import {clone, digest} from './actor-variants-core.js';
import {automaticEncumbrance} from './content-scene-data.js';

// Native WFRP adds Encumbrance conditions (enc1-3) to world Actors at runtime.
// They are state, not source content: an update keeps them and they are not a
// local edit. A customized effect still differs from the system template.
export function keepAutomaticEffects(changes, before) {
    const effects = new Map((before.effects ?? []).map(effect => [effect._id, effect]));
    changes.collections = changes.collections.map(group => group.type !== 'ActiveEffect' ? group
        : {...group, remove: group.remove.filter(id => !automaticEncumbrance(effects.get(id)))})
        .filter(group => group.remove.length || group.create.length || group.update.length);
    changes.changed = !!changes.patch || !!changes.collections.length;
    return changes;
}

// Wounds are play state (damage, healing, native autoCalc), not translated
// content: an update keeps the world values and never reports them.
export function keepWorldWounds(target, before) {
    const wounds = before?.system?.status?.wounds;
    if (!target || !wounds) return target;
    return {...target, system: {...target.system, status: {...target.system?.status, wounds: clone(wounds)}}};
}

export function actorBaselineValues(data) {
    return {wounds: clone(data.system?.status?.wounds ?? {}),
        token: {width: data.prototypeToken?.width, height: data.prototypeToken?.height}};
}

// A tracked, unchanged source may differ only in values that native WFRP
// recalculates after loading the world. Do not rewrite those values on every
// update. This requires remembered source values AND an exact native result;
// manual sizes, new source numbers, or any other change still write.
export function automaticActorNoop(changes, before, incoming, marker, calculated) {
    const saved = marker?.sourceAutomaticBaseline;
    if (!saved || !marker.hash || !calculated || changes.collections.length || !changes.patch) return false;
    const paths = Object.keys(changes.patch);
    const token = before.prototypeToken, sourceToken = incoming.prototypeToken;
    return paths.length > 0 && paths.every(path => {
        if (['prototypeToken.width', 'prototypeToken.height'].includes(path)) {
            return Number.isFinite(calculated.width) && Number.isFinite(calculated.height)
                && token?.width === calculated.width && token.height === calculated.height
                && sourceToken?.width === saved.token?.width && sourceToken?.height === saved.token?.height;
        }
        return false;
    });
}

// Recover an older import fingerprint only when Wounds or native automatic
// calculations explain the entire difference. Token size and other mechanical
// fields still need an exact native result.
export async function automaticActorBaseline(before, incoming, marker, calculated) {
    if (!marker?.hash || marker.hashVersion !== 2 || !calculated) return null;
    const candidate = clone(before), paths = [];
    if (Array.isArray(candidate.effects)) candidate.effects = candidate.effects.filter(effect => {
        if (!automaticEncumbrance(effect)) return true;
        paths.push(`effects[${effect._id}]`);
        return false;
    });
    // New records retain these four baseline values, so a later source revision
    // or a rename of a historical variant does not need that book to be loaded.
    const baseline = marker.automaticBaseline ?? actorBaselineValues(incoming);
    const current = before.system?.status?.wounds, source = baseline.wounds;
    if (current && source) {
        for (const key of ['value', 'max']) if (current[key] !== source[key]) {
            candidate.system.status.wounds[key] = source[key];
            paths.push(`system.status.wounds.${key}`);
        }
    }
    const token = before.prototypeToken, sourceToken = baseline.token;
    if (token && sourceToken && token.width === calculated.width && token.height === calculated.height
        && Number.isFinite(sourceToken.width) && Number.isFinite(sourceToken.height)) {
        for (const key of ['width', 'height']) if (token[key] !== sourceToken[key]) {
            candidate.prototypeToken[key] = sourceToken[key];
            paths.push(`prototypeToken.${key}`);
        }
    }
    return paths.length && await digest(candidate) === marker.hash ? paths : null;
}
