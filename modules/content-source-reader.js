import {readyTranslations} from './content-localization.js';
import {digest} from './actor-variants-core.js';

// Bump when the preparation of source Actors changes in a way that file
// ETags or module versions would not reveal.
const REVISION_VERSION = 1;
const MODULE_ROOT = new URL('../', import.meta.url);
const PREPARATION_FILES = ['modules/content-localization.js', 'modules/actor-variants-core.js',
    'modules/legacy-actor-items-converter.js', 'modules/source-import-compatibility.js',
    'modules/wom-embedded-compatibility.js', 'modules/content-lifecycle.js', 'babele-register.js'];

// Everything besides the compendium entry that shapes a prepared source
// Document: Foundry, system and module versions, every translation file and
// this module's loaded code. File ETags (size + mtime) are read once per
// Babele session. Any unknown input gives null: then nothing is skipped.
async function sessionRevision(babele, language) {
    try {
        const translation = (await babele.sourceDiagnostics?.())?.translation?.uniqueFiles;
        if (!Array.isArray(translation) || !translation.length) return null;
        const own = new Set(PREPARATION_FILES.map(path => new URL(path, MODULE_ROOT).href));
        for (const entry of performance.getEntriesByType?.('resource') ?? []) {
            const url = entry.name.split(/[?#]/u)[0];
            if (/\.(m?js|json)$/u.test(url) && (url.startsWith(MODULE_ROOT.href) || url.includes('/modules/babele/'))) own.add(url);
        }
        const files = [...new Set([...translation.map(path => new URL(path, document.baseURI).href), ...own])].sort();
        const tags = [];
        for (let offset = 0; offset < files.length; offset += 24) {
            tags.push(...await Promise.all(files.slice(offset, offset + 24).map(async url => {
                const response = await fetch(url, {method: 'HEAD', cache: 'no-store'});
                const tag = response.ok ? response.headers.get('etag') ?? response.headers.get('last-modified') : null;
                if (!tag) throw new Error(url);
                return [url.replace(document.baseURI, ''), tag];
            })));
        }
        const modules = [...game.modules].filter(module => module.active).map(module => `${module.id}@${module.version}`).sort();
        return await digest({version: REVISION_VERSION, language, core: game.release?.version,
            system: `${game.system.id}@${game.system.version}`, modules, files: tags});
    } catch {return null;}
}

// Keep no second copy of source payloads. Only recognize Documents that this
// reader obtained in the current Babele session; Foundry owns their cache and
// its expiration. Reloading the world/session drops all eligibility.
let identity;
let fetched = new WeakMap();

export async function sourceReadContext(progress) {
    const babele = await readyTranslations(), mappings = babele.documentMappings;
    const world = game, language = game.i18n.lang;
    const version = `${game.release?.version ?? ''}:${game.system.version ?? ''}`;
    if (!identity || identity.babele !== babele || identity.mappings !== mappings
        || identity.world !== world || identity.language !== language || identity.version !== version) {
        identity = {babele, mappings, world, language, version};
        fetched = new WeakMap();
    }
    const session = identity, seen = fetched;
    const counts = {sourceFetched: 0, sourceCached: 0, sourceSkipped: 0};
    const current = () => {
        if (game !== world || game.babele !== babele || game.i18n.lang !== language
            || babele.documentMappings !== mappings || `${game.release?.version ?? ''}:${game.system.version ?? ''}` !== version) {
            throw new Error('Źródła lub tłumaczenia zmieniły się podczas przygotowania. Ponów aktualizację; nie zapisano zmian zawartości.');
        }
        return babele;
    };
    return {current, counts,
        // Revision of one prepared compendium entry; null when unknown.
        async sourceRevision(entry) {
            const time = entry?._stats?.modifiedTime;
            if (!Number.isFinite(time)) return null;
            session.revision ??= sessionRevision(babele, language);
            const revision = await session.revision;
            return revision ? digest(`${revision}:${time}`) : null;
        },
        skipped(count) {counts.sourceSkipped += count; progress?.count?.(counts);},
        async read(pack, ids, {index, reuse = () => false, invoke = read => read()} = {}) {
        current();
        const docs = new Map(), missing = [];
        const packageVersion = game.modules.get(pack.metadata?.packageName ?? pack.collection.split('.')[0])?.version ?? '';
        // No revision/session information means a full read, never a guess
        // based just on the installed module version or last import time.
        for (const id of ids) {
            const document = mappings && typeof mappings === 'object' && reuse(id) ? pack.get?.(id) : null;
            const revision = index?.get(id)?._stats?.modifiedTime;
            if (document && document.id === id && seen.get(document) === packageVersion && document.pack === pack.collection
                && document.documentName === pack.documentName && !document.invalid
                && Number.isFinite(revision) && revision === document._stats?.modifiedTime) {
                docs.set(id, document);
                counts.sourceCached++;
            } else {
                if (document) seen.delete(document);
                missing.push(id);
            }
        }
        if (missing.length) {
            // The caller bounds this batch (Actor <=8, other types <=20).
            const loaded = await invoke(() => pack.getDocuments({_id__in: missing}));
            current();
            const wanted = new Set(missing);
            for (const document of loaded) {
                if (document.documentName !== pack.documentName || !wanted.delete(document.id)) throw new Error(`Paczka ${pack.collection} zwróciła niewłaściwy lub powtórzony dokument.`);
                docs.set(document.id, document);
                if (identity === session) seen.set(document, packageVersion);
            }
            if (wanted.size) throw new Error(`Nie wczytano wszystkich wymaganych dokumentów z ${pack.collection}.`);
            counts.sourceFetched += loaded.length;
        }
        progress?.count?.(counts);
        return ids.map(id => docs.get(id));
    }};
}
