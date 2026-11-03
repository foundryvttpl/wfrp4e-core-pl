import {values} from './actor-variants-core.js';
import {sameTokenDelta, canonicalHtml} from './content-scene-data.js';

// Operators carry a Symbol value. Copy them explicitly instead of losing their
// payload through structuredClone, and never let Foundry mutate a saved plan.
export function copyUpdate(value) {
    if (value instanceof Date) return new Date(value);
    const operators = globalThis.foundry?.data?.operators;
    if (operators?.ForcedDeletion && value instanceof operators.ForcedDeletion) return new operators.ForcedDeletion();
    if (operators?.ForcedReplacement && value instanceof operators.ForcedReplacement) {
        return new operators.ForcedReplacement(copyUpdate(operators.DataFieldOperator.get(value)));
    }
    if (Array.isArray(value)) return value.map(copyUpdate);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, copyUpdate(v)]));
    return value;
}

const plain = value => value !== null && typeof value === 'object'
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
function equal(one, two) {
    if (one === two) return true;
    if (one instanceof Date && two instanceof Date) return one.getTime() === two.getTime();
    if (Array.isArray(one) && Array.isArray(two)) return one.length === two.length && one.every((v, i) => equal(v, two[i]));
    if (!plain(one) || !plain(two) || Array.isArray(one) || Array.isArray(two)) return false;
    // An undefined value is never persisted, so it equals a missing key.
    const defined = value => Object.keys(value).filter(k => value[k] !== undefined);
    const keys = defined(one);
    return keys.length === defined(two).length && keys.every(k => Object.hasOwn(two, k) && equal(one[k], two[k]));
}

function sameHtml(document, path, one, two) {
    const HTMLField = globalThis.foundry?.data?.fields?.HTMLField;
    if (typeof one !== 'string' || typeof two !== 'string' || !HTMLField) return false;
    let field;
    try {
        field = document.schema?.getField?.(path)
            ?? (path.startsWith('system.') ? document.system?.schema?.getField?.(path.slice(7)) : null);
    } catch {return false;}
    return field instanceof HTMLField && canonicalHtml(one) === canonicalHtml(two);
}

function rootData(document, data) {
    const excluded = new Set(Object.entries(document.constructor.metadata?.embedded ?? {}).filter(([type, field]) =>
        type !== 'ActorDelta' && (Array.isArray(data[field]) || Array.isArray(document[field]?.contents))).map(([, field]) => field));
    const input = Object.fromEntries(Object.entries(data).filter(([key]) => !excluded.has(key) && key !== '_stats'));
    // Native cleaning removes non-persisted Babele properties and supplies
    // model defaults without constructing Documents or running gameplay hooks.
    const clean = typeof document.constructor.cleanData === 'function'
        ? document.constructor.cleanData(structuredClone(input), {partial: false, expand: false}, {creation: true}) : structuredClone(input);
    for (const key of excluded) delete clean[key];
    delete clean._id;
    delete clean._stats;
    // Lightweight document adapters without schemas use the same known
    // non-persisted markers. Valid flags.babele payloads remain significant.
    if (typeof document.constructor.cleanData !== 'function') {
        for (const key of ['translated', 'hasTranslation', 'originalName']) delete clean[key];
        if (clean.id === data._id) delete clean.id;
    }
    return clean;
}

export function documentPatch(document, incoming, snapshot = document.toObject()) {
    const before = rootData(document, snapshot), after = rootData(document, incoming), patch = {};
    const operators = globalThis.foundry?.data?.operators;
    const changedType = after.type !== undefined && before.type !== after.type;
    const visit = (one, two, path) => {
        if (equal(one, two) || sameHtml(document, path, one, two)) return;
        // The server does not persist a blank optional string (e.g. page
        // text.markdown); writing it again would never take effect.
        if (one === undefined && two === '') return;
        if (path === 'ownership' || (path === 'system' && changedType)
            || [one, two].some(value => plain(value) && Object.keys(value).some(key => key.includes('.') || key.startsWith('-=')))
            || (document.documentName === 'Token' && path === 'delta')) {
            if (path === 'delta' && sameTokenDelta(one, two)) return;
            patch[path] = operators?.ForcedReplacement ? new operators.ForcedReplacement(copyUpdate(two)) : copyUpdate(two);
        } else if (plain(one) && plain(two) && !Array.isArray(one) && !Array.isArray(two)) {
            for (const [key, value] of Object.entries(two)) visit(one[key], value, `${path}.${key}`);
            for (const key of Object.keys(one)) if (!Object.hasOwn(two, key)) {
                if (operators?.ForcedDeletion) patch[`${path}.${key}`] = new operators.ForcedDeletion();
                else patch[`${path}.-=${key}`] = null;
            }
        } else patch[path] = copyUpdate(two);
    };
    for (const [key, value] of Object.entries(after)) visit(before[key], value, key);
    if (changedType && Object.hasOwn(after, 'system') && !Object.hasOwn(patch, 'system')) {
        patch.system = operators?.ForcedReplacement ? new operators.ForcedReplacement(copyUpdate(after.system)) : copyUpdate(after.system);
    }
    if (incoming._stats && Object.hasOwn(incoming._stats, 'compendiumSource')
        && incoming._stats.compendiumSource !== snapshot._stats?.compendiumSource) {
        patch['_stats.compendiumSource'] = incoming._stats.compendiumSource;
    }
    return Object.keys(patch).length ? patch : null;
}

export function documentChanges(document, incoming, snapshot = document.toObject()) {
    const patch = documentPatch(document, incoming, snapshot), collections = [];
    for (const [type, field] of Object.entries(document.constructor.metadata?.embedded ?? {})) {
        if (type === 'ActorDelta' || (!Array.isArray(incoming[field]) && !Array.isArray(document[field]?.contents))) continue;
        const target = incoming[field] ?? [], existing = document.getEmbeddedCollection(type);
        const ids = new Set(target.map(child => child._id));
        const old = new Map((snapshot[field] ?? []).map(child => [child._id, child]));
        const remove = values(existing).filter(child => !ids.has(child.id)).map(child => child.id);
        const create = [], update = [];
        for (const child of target) {
            const present = existing.get(child._id);
            if (!present) create.push(copyUpdate(child));
            else {
                const changes = documentChanges(present, child, old.get(child._id) ?? present.toObject());
                if (changes.changed) update.push({id: child._id, changes});
            }
        }
        if (remove.length || create.length || update.length) collections.push({type, remove, create, update});
    }
    return {patch, collections, changed: !!patch || !!collections.length};
}

export function changeCounts(changes) {
    const counts = {rootWrites: changes?.patch ? 1 : 0, embeddedCreates: 0, embeddedUpdates: 0, embeddedDeletes: 0};
    const visit = plan => {
        for (const group of plan?.collections ?? []) {
            counts.embeddedCreates += group.create.length;
            counts.embeddedDeletes += group.remove.length;
            for (const child of group.update) {
                if (child.changes.patch) counts.embeddedUpdates++;
                visit(child.changes);
            }
        }
    };
    visit(changes);
    return counts;
}
