import {clone, comparable, digest} from './actor-variants-core.js';

const effectTemplates = new Map();

// The server sanitizes every HTMLField on write (parse5 + sanitize-html): it
// closes tags, decodes entities, drops empty attributes and rewrites styles.
// Compare these fields in one canonical form, or saved source HTML differs on
// every update.
let template;
const BOOLEAN_ATTRIBUTES = new Set(['allowfullscreen', 'async', 'autofocus', 'autoplay', 'checked', 'controls',
    'default', 'defer', 'disabled', 'hidden', 'loop', 'multiple', 'muted', 'novalidate', 'open', 'playsinline',
    'readonly', 'required', 'reversed', 'selected']);
export function canonicalHtml(value) {
    const clean = globalThis.foundry?.utils?.cleanHTML;
    template ??= globalThis.document?.createElement?.('template');
    if (!template || typeof clean !== 'function') return value;
    template.innerHTML = clean(value);
    for (const element of template.content.querySelectorAll('*')) {
        if (element.hasAttribute('style')) element.setAttribute('style', element.style.cssText);
        // sanitize-html drops empty non-boolean attributes such as title="".
        for (const {name, value} of [...element.attributes]) if (value === '' && !BOOLEAN_ATTRIBUTES.has(name)) element.removeAttribute(name);
    }
    return template.innerHTML;
}
// Token deltas hold whole embedded Items/Effects. Compare them like root
// documents: server-assigned _stats are metadata and HTML in canonical form.
function canonicalFields(schema, value, type) {
    const fields = globalThis.foundry?.data?.fields;
    if (!fields || !schema?.fields || !value || typeof value !== 'object') return;
    for (const [key, field] of Object.entries(schema.fields)) {
        if (field instanceof fields.HTMLField && typeof value[key] === 'string') value[key] = canonicalHtml(value[key]);
        else if (key === 'system' && type) canonicalFields(globalThis.CONFIG?.[type]?.dataModels?.[value.type]?.schema, value[key]);
        else if (field instanceof fields.SchemaField) canonicalFields(field, value[key]);
    }
}
function cleanRecord(type, record, legacy = false) {
    if (record?._tombstone) return clone(record);
    const cls = globalThis.CONFIG?.[type]?.documentClass;
    let result = clone(record);
    if (typeof cls?.cleanData === 'function') {
        try {result = cls.cleanData(result, {partial: false, prune: false}, {creation: true});}
        catch {return clone(record);}
    }
    if (type === 'Item' && Array.isArray(result.effects)) result.effects = result.effects.map(effect => cleanRecord('ActiveEffect', effect, legacy));
    if (legacy) return result;
    delete result._stats;
    canonicalFields(cls?.schema, result, type);
    return result;
}

function effectValue(effect) {
    const value = clone(effect);
    delete value._id;
    // Permanent system effects do not use the time at which they were created.
    if (value.start == null || Object.entries(value.start).every(([key, v]) => key === 'time' || v == null)) delete value.start;
    return comparable(value);
}

export function automaticEncumbrance(effect) {
    if (effect?._tombstone || effect?.statuses?.length !== 1 || !/^enc[123]$/u.test(effect.statuses[0])) return false;
    const cls = globalThis.CONFIG?.ActiveEffect?.documentClass;
    const template = game.wfrp4e?.config?.systemEffects?.[effect.statuses[0]];
    if (!template || typeof cls?.cleanData !== 'function') return false;
    // Native cleaning supplies the same schema defaults as effect creation.
    // Do not prune unknown fields: a customized effect must remain significant.
    const key = JSON.stringify(template);
    let saved = effectTemplates.get(effect.statuses[0]);
    try {
        if (saved?.cls !== cls || saved.key !== key) {
            // Actor-owned system effects are non-transferring; native
            // WarhammerActiveEffect._preCreate applies this after cleaning.
            const data = cls.cleanData({...clone(template), transfer: false}, {partial: false, prune: false}, {creation: true});
            saved = {cls, key, value: effectValue(data)};
            effectTemplates.set(effect.statuses[0], saved);
        }
        const data = cls.cleanData(clone(effect), {partial: false, prune: false}, {creation: true});
        return effectValue(data) === saved.value;
    } catch {return false;}
}

// ActorDelta has optional nullable fields. Foundry's singleton serializer drops
// those nulls, whereas Scene.toObject can retain them in its raw token array.
export function comparableTokenDelta(delta, legacy = false) {
    if (!delta) return null;
    const data = clone(delta);
    for (const key of ['name', 'type', 'img', 'ownership']) if (data[key] == null) delete data[key];
    if (Array.isArray(data.effects)) data.effects = data.effects.filter(effect => !automaticEncumbrance(effect))
        .map(effect => cleanRecord('ActiveEffect', effect, legacy));
    if (Array.isArray(data.items)) data.items = data.items.map(item => cleanRecord('Item', item, legacy));
    const empty = Object.entries(data).every(([key, value]) => key === '_id'
        || (['system', 'flags'].includes(key) && value && Object.keys(value).length === 0)
        || (['items', 'effects'].includes(key) && Array.isArray(value) && value.length === 0));
    return empty ? null : data;
}

// Native WFRP recalculates Wounds and token size of unlinked tokens (autoCalc)
// and saves the result on the scene. Where the world holds exactly that result
// and the source holds unchanged book values, keep the world value: rewriting
// it would only be recalculated again and is not a local edit.
export function keepAutomaticTokenValues(target, before, scene) {
    if (!Array.isArray(target?.tokens)) return;
    const saved = new Map((before.tokens ?? []).map(token => [token._id, token]));
    target.tokens = target.tokens.map(token => {
        const current = saved.get(token._id), actor = scene.tokens?.get(token._id)?.actor;
        if (!current || current.actorLink || token.actorLink || !actor) return token;
        let result = token;
        const copy = () => {if (result === token) result = clone(token); return result;};
        // Wounds are play state: keep the world override, or its absence.
        const wounds = current.delta?.system?.status?.wounds, source = token.delta?.system?.status?.wounds;
        if (JSON.stringify(wounds) !== JSON.stringify(source)) {
            const data = copy();
            if (wounds) {
                data.delta ??= {};
                foundry.utils.setProperty(data.delta, 'system.status.wounds', clone(wounds));
            } else delete data.delta.system.status.wounds;
        }
        const size = actor.system?.autoCalc?.size ? game.wfrp4e?.config?.tokenSizes?.[actor.system.details?.size?.value] : undefined;
        if (Number.isFinite(size)) {
            const scale = Math.min(size, 1), length = Math.max(size, 1);
            const texture = current.texture ?? {};
            if (texture.scaleX === scale && texture.scaleY === scale && current.width === length && current.height === length) {
                const data = copy();
                data.texture = {...data.texture, scaleX: scale, scaleY: scale};
                data.width = data.height = length;
            }
        }
        return result;
    });
}

// Version 0 ignores token Wounds; 1 is the format saved on 30.10.2026 and 2
// the older one with item _stats and raw HTML in token deltas.
export function sceneComparison(data, version = 0) {
    const result = clone(data);
    delete result.active;
    for (const token of result.tokens ?? []) {
        if (!version && token.delta?.system?.status) delete token.delta.system.status.wounds;
        token.delta = comparableTokenDelta(token.delta, version === 2);
    }
    return result;
}

export const sameTokenDelta = (one, two) => comparable(comparableTokenDelta(one)) === comparable(comparableTokenDelta(two));
export const sceneDigest = (data, version = 0) => digest(sceneComparison(data, version));

export async function automaticSceneChange(before, target, marker) {
    // A hash saved before token-delta canonicalization may differ; then the
    // same full comparison with the source below still decides. Older hashes
    // use the earlier comparison formats.
    if (marker?.sceneHash) for (const version of [0, 1, 2]) {
        if (await sceneDigest(before, version) === marker.sceneHash) return true;
    }
    // Older fingerprints can contain random IDs from automatic conditions. Only
    // accept a migration when the entire meaningful scene equals its source.
    // A moved token, wound override, custom effect, wall or note still differs.
    return !!target && await sceneDigest(before) === await sceneDigest(target);
}
