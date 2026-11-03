// Pure source identity, chronology and reference handling. No world writes.
export const SCOPE = 'wfrp4e-core-pl';
export const clone = value => structuredClone(value);
export const values = value => Array.from(value?.contents ?? value ?? []);
export const variantFlag = data => data?.flags?.[SCOPE]?.actorVariant;
export const sourceFlag = data => data?.flags?.['warhammer-lib']?.source;

export function actorSource(uuid) {
    const match = /^Compendium\.([^.]+\.[^.]+)\.(?:Actor\.)?([a-zA-Z0-9]{16})(?=\.|$)/u.exec(uuid ?? '');
    return match ? {pack: match[1], module: match[1].split('.')[0], id: match[2],
        uuid: `Compendium.${match[1]}.Actor.${match[2]}`} : null;
}

export function publicationFor(module, folder, folders, policy) {
    const config = policy.modules[module];
    if (!config) return null;
    const seen = new Set();
    while (folder && !seen.has(folder)) {
        seen.add(folder);
        const key = config.folderPublications?.[folder];
        if (key) return {key, ...policy.publications[key]};
        const parent = folders.find(f => (f._id ?? f.id) === folder)?.folder;
        folder = parent?.id ?? parent;
    }
    const key = config.publication;
    return key ? {key, ...policy.publications[key]} : null;
}

function dateBounds(date) {
    const [y, m, d] = date.split('-').map(Number);
    return [Date.UTC(y, m - 1, d ?? 1), Date.UTC(y, m - 1, d ?? new Date(Date.UTC(y, m, 0)).getUTCDate())];
}

export function choosePrimary(records) {
    if (records.length === 1) return records[0];
    if (records.some(record => !record.publication?.release)) {
        throw new Error('Brakuje zweryfikowanej daty książki dla wspólnego ID: '
            + records.map(r => `${r.data.name} (${r.module})`).join(', '));
    }
    const sorted = [...records].sort((a, b) => dateBounds(b.publication.release)[0] - dateBounds(a.publication.release)[0]);
    if (dateBounds(sorted[0].publication.release)[0] <= dateBounds(sorted[1].publication.release)[1]) {
        throw new Error(`Nieustalona kolejność publikacji dla aktora ${sorted[0].data.name}. Uzupełnij daty książek.`);
    }
    return sorted[0];
}

// Babele may translate text and scripts, but a translation must not add/drop
// native Items or change numerical statistics. Restore these from its rollback
// payload, which is scoped to this exact compendium document.
export function faithfulActor(original, translated) {
    function merge(source, localized, key = '') {
        if (Array.isArray(source)) {
            if (source.some(v => v && typeof v === 'object' && v._id)) {
                const byId = new Map((Array.isArray(localized) ? localized : []).map(v => [v?._id, v]));
                return source.map(v => merge(v, byId.get(v._id), key));
            }
            return clone(source);
        }
        if (source && typeof source === 'object') {
            const result = {};
            for (const [field, value] of Object.entries(source)) {
                result[field] = merge(value, localized?.[field], field);
            }
            // Translation provenance is not game mechanics.
            if (key === 'flags' && localized?.babele) result.babele = clone(localized.babele);
            return result;
        }
        if (typeof source === 'number' || typeof source === 'boolean' || source === null) return source;
        if (typeof source === 'string' && typeof localized === 'string') {
            if (key === '_id' || /^[+-]?\d+(?:\.\d+)?\+?$/u.test(source)) return source;
            return localized;
        }
        return clone(source);
    }
    const result = merge(original, translated);
    result.flags ??= {};
    if (translated.flags?.babele) result.flags.babele = clone(translated.flags.babele);
    return result;
}

// Ignore framework metadata and placement when detecting user changes. Embedded
// IDs and all mechanical/text fields remain significant, including removed data.
export function comparable(data, {legacy = false} = {}) {
    function clean(value, path = '') {
        if (Array.isArray(value)) {
            const entries = !legacy && value.length && value.every(v => v && typeof v._id === 'string')
                ? [...value].sort((a, b) => a._id < b._id ? -1 : a._id > b._id ? 1 : 0) : value;
            return entries.map(v => clean(v, path));
        }
        if (!value || typeof value !== 'object') return value;
        const result = {};
        for (const key of Object.keys(value).sort()) {
            if (['_stats', 'ownership', 'folder', 'sort', 'originalName', 'translated', 'hasTranslation'].includes(key)) continue;
            if (key === SCOPE || (path === 'flags' && ['babele', 'core', 'warhammer-lib'].includes(key))) continue;
            if (!legacy && key === 'babele' && path.endsWith('.flags')) continue;
            result[key] = clean(value[key], path ? `${path}.${key}` : key);
        }
        return result;
    }
    return JSON.stringify(clean(data));
}

export async function digest(value) {
    const bytes = new TextEncoder().encode(typeof value === 'string' ? value : comparable(value));
    if (globalThis.crypto?.subtle) {
        const hash = await crypto.subtle.digest('SHA-256', bytes);
        return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
    }
    // Foundry is also served over plain HTTP on private networks, where browsers
    // do not expose SubtleCrypto. Produce the same SHA-256 in that environment.
    const constants = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
        0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
        0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
        0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
        0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
        0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
        0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
        0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    const hash = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const buffer = new Uint8Array(Math.ceil((bytes.length + 9) / 64) * 64);
    buffer.set(bytes); buffer[bytes.length] = 0x80;
    const view = new DataView(buffer.buffer), words = new Uint32Array(64);
    view.setUint32(buffer.length - 8, Math.floor(bytes.length / 0x20000000));
    view.setUint32(buffer.length - 4, bytes.length * 8);
    const rotate = (n, bits) => (n >>> bits) | (n << (32 - bits));
    for (let offset = 0; offset < buffer.length; offset += 64) {
        for (let i = 0; i < 16; i++) words[i] = view.getUint32(offset + i * 4);
        for (let i = 16; i < 64; i++) {
            const x = words[i - 15], y = words[i - 2];
            words[i] = words[i - 16] + (rotate(x, 7) ^ rotate(x, 18) ^ (x >>> 3))
                + words[i - 7] + (rotate(y, 17) ^ rotate(y, 19) ^ (y >>> 10));
        }
        let [a,b,c,d,e,f,g,h] = hash;
        for (let i = 0; i < 64; i++) {
            const first = h + (rotate(e, 6) ^ rotate(e, 11) ^ rotate(e, 25))
                + ((e & f) ^ (~e & g)) + constants[i] + words[i];
            const second = (rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22)) + ((a & b) ^ (a & c) ^ (b & c));
            h=g; g=f; f=e; e=(d+first)>>>0; d=c; c=b; b=a; a=(first+second)>>>0;
        }
        [a,b,c,d,e,f,g,h].forEach((value, i) => {hash[i] = (hash[i] + value) >>> 0;});
    }
    return hash.map(value => value.toString(16).padStart(8, '0')).join('');
}

export function legacySources(actor, records) {
    const result = new Set();
    const add = uuid => {
        const source = actorSource(uuid);
        if (source && records.some(r => r.uuid === source.uuid)) result.add(source.uuid);
    };
    add(variantFlag(actor)?.sourceUuid);
    add(actor._stats?.compendiumSource);
    add(actor.flags?.core?.sourceId);
    for (const record of records) {
        if (sourceFlag(actor) === record.module && actor._id === record.originalId) result.add(record.uuid);
    }
    for (const item of actor.items ?? []) {
        const source = actorSource(item._stats?.compendiumSource ?? item.flags?.core?.sourceId);
        if (source && records.some(r => r.uuid === source.uuid && r.data.items?.some(i => i._id === item._id))) result.add(source.uuid);
    }
    return result;
}

export function displayName(record, primary) {
    const base = record.baseName ?? variantFlag(record.data)?.baseName ?? record.data.name;
    if (record.uuid === primary.uuid) return base;
    if (!record.publication?.abbreviation) throw new Error(`Brakuje skrótu książki: ${record.module}`);
    return `${base} (${record.publication.abbreviation})`;
}

export function referenceMaps(assignments) {
    const explicit = new Map();
    const contextual = new Map();
    const names = new Map();
    for (const record of assignments) {
        explicit.set(record.uuid, record.worldId);
        const key = `${record.module}:${record.originalId}`;
        if (contextual.has(key) && contextual.get(key) !== record.worldId) {
            throw new Error(`Kilka źródeł aktora ${record.originalId} w tym samym module.`);
        }
        contextual.set(key, record.worldId);
        for (const name of [record.baseName, record.data?.name, record.raw?.name,
            record.data?.flags?.babele?.originalName, ...(record.referenceNames ?? [])].filter(Boolean)) {
            const nameKey = `${record.module}:${name}`;
            if (names.has(nameKey) && names.get(nameKey) !== record.worldId) names.set(nameKey, null);
            else if (!names.has(nameKey)) names.set(nameKey, record.worldId);
        }
    }
    return {explicit, contextual, names};
}

export function rewriteReferences(data, module, maps, oldBindings = new Map()) {
    const worldId = id => maps.contextual.get(`${module}:${id}`)
        ?? maps.explicit.get(oldBindings.get(id)) ?? id;
    function text(value) {
        if (!value.includes('Actor.') && !value.includes('Compendium.') && !value.includes('game.actors.')) return value;
        return value.replace(/Compendium\.([^.\s\[\]"'<>]+\.[^.\s\[\]"'<>]+)\.(?:Actor\.)?([A-Za-z0-9]{16})(?=\.|[\]"'<>\s}]|$)|(?<![A-Za-z0-9_.])Actor\.([A-Za-z0-9]{16})(?=\.|[\]"'<>\s}]|$)/gu,
            (all, pack, sourceId, id) => pack
                ? (maps.explicit.has(`Compendium.${pack}.Actor.${sourceId}`)
                    ? `Actor.${maps.explicit.get(`Compendium.${pack}.Actor.${sourceId}`)}` : all)
                : `Actor.${worldId(id)}`)
            .replace(/game\.actors\.get\((['"])([A-Za-z0-9]{16})\1\)/gu,
                (all, quote, id) => `game.actors.get(${quote}${worldId(id)}${quote})`)
            .replace(/game\.actors\.getName\((['"])([^'"\n]+)\1\)/gu,
                (all, quote, name) => maps.names?.get(`${module}:${name}`)
                    ? `game.actors.get(${quote}${maps.names.get(`${module}:${name}`)}${quote})` : all);
    }
    function walk(value, path = '') {
        if (typeof value === 'string') return text(value);
        // Copy only changed branches. Callers treat source/provenance as
        // immutable and take an independent copy before a native write.
        if (Array.isArray(value)) {
            let result = value;
            for (let index = 0; index < value.length; index++) {
                const child = walk(value[index], path);
                if (child !== value[index]) {
                    if (result === value) result = value.slice();
                    result[index] = child;
                }
            }
            return result;
        }
        if (!value || typeof value !== 'object') return value;
        let result = value;
        for (const [key, child] of Object.entries(value)) {
            const next = path ? `${path}.${key}` : key;
            if (key === '_stats' || key === 'sourceId' || key === 'sourceUuid'
                || key === 'originalPayload' || next === `flags.${SCOPE}`) continue;
            const changed = key === 'actorId' && typeof child === 'string' ? worldId(child)
                : key === 'documentId' && value.documentCollection === 'Actor' ? worldId(child) : walk(child, next);
            if (changed !== child) {
                if (result === value) result = {...value};
                result[key] = changed;
            }
        }
        return result;
    }
    return walk(data);
}

export function unscopedActorIds(data) {
    const found = new Set();
    function walk(value, key) {
        if (typeof value === 'string') {
            if (key === 'actorId') found.add(value);
            for (const match of value.matchAll(/(?<![A-Za-z0-9_.])Actor\.([A-Za-z0-9]{16})(?=\.|[\]"'<>\s}]|$)|game\.actors\.get\(['"]([A-Za-z0-9]{16})['"]\)/gu)) found.add(match[1] ?? match[2]);
        } else if (Array.isArray(value)) value.forEach(v => walk(v, key));
        else if (value && typeof value === 'object') for (const [field, child] of Object.entries(value)) {
            if (field === 'documentId' && value.documentCollection === 'Actor' && typeof child === 'string') found.add(child);
            if (!['_stats', 'sourceId', 'sourceUuid', 'originalPayload', SCOPE].includes(field)) walk(child, field);
        }
    }
    walk(data);
    return found;
}
