import {documentPatch, documentChanges, copyUpdate, changeCounts} from './content-diff.js';
import {encodeSnapshot, decodeSnapshot, MAX_SNAPSHOT_CHARACTERS} from './content-snapshot-codec.js';
import {sourceReadContext} from './content-source-reader.js';
import {hasActorReference} from './content-reference-scan.js';
import {SCOPE, clone, values, variantFlag, sourceFlag, actorSource, publicationFor,
    choosePrimary, faithfulActor, comparable, digest, legacySources, displayName,
    referenceMaps, rewriteReferences, unscopedActorIds} from './actor-variants-core.js';
import {localizedSourceData, nativeSourceData} from './content-localization.js';
import './v14-migration-compatibility.js';
import {withSourceActorContext, withSourceSceneContext, automaticActorValues} from './source-import-compatibility.js';
import {inspectDocumentWrite, inspectionHtml} from './content-plan-diagnostics.js';
import {automaticActorBaseline, actorBaselineValues, automaticActorNoop, keepAutomaticEffects, keepWorldWounds} from './content-actor-baseline.js';
import {sceneDigest, automaticSceneChange, keepAutomaticTokenValues} from './content-scene-data.js';

const KEY = 'contentLifecycle';
const PATCH = Symbol.for(`${SCOPE}.${KEY}`);
const TYPES = {Actor: 'actors', JournalEntry: 'journals', Item: 'items', Scene: 'scenes',
    RollTable: 'tables', Macro: 'macros', Playlist: 'playlists', Cards: 'cards', Adventure: 'adventures'};
const COLLECTIONS = {...TYPES, JournalEntry: 'journal', RollTable: 'tables'};
// Foundry mutates operation arguments (parent, pack, data, ids, updates).
// This is an immutable template: every database call must get a fresh copy.
const OP = Object.freeze({pack: null, keepId: true, keepEmbeddedIds: true, skipItems: true,
    skipSpecialisationChoice: true, skipDeletingItems: true, wfrp4eContentLifecycle: true});
let policyPromise;
let queue = Promise.resolve();
let writingActors = false;
let operationStatus = null;
let lastOperation = null;
let lastInspection = null;

function operationProgress(callback) {
    const started = Date.now();
    const stages = {};
    let stage = 'przygotowanie', stageStarted = started;
    const counters = {};
    const notification = ui.notifications.info('Przygotowywanie zawartości modułu…', {progress: true, console: false});
    const controls = [...(globalThis.document?.querySelectorAll?.('.module-list button, .wfrp4e-update-all') ?? [])]
        .map(button => ({button, disabled: button.disabled}));
    for (const {button} of controls) button.disabled = true;
    let lastYield = 0, lastUpdate = 0, lastPct = 0;
    const report = async (message, pct, force = false) => {
        const now = Date.now();
        lastPct = Math.max(lastPct, pct ?? lastPct);
        operationStatus = {message, pct: lastPct, updatedAt: now, elapsedMs: now - started, counters: {...counters}};
        if (force || now - lastUpdate >= 80) {
            callback?.(message);
            notification?.update?.({message, pct: lastPct});
            lastUpdate = now;
        }
        // Awaiting already-resolved promises never gives Chromium a chance to
        // paint. Yield to a browser task during CPU-heavy preparation as well.
        if (force || Date.now() - lastYield >= 25) {
            await new Promise(resolve => setTimeout(resolve, 0));
            lastYield = Date.now();
        }
    };
    report.stage = name => {
        const now = Date.now();
        stages[stage] = (stages[stage] ?? 0) + now - stageStarted;
        stage = name; stageStarted = now;
    };
    report.count = values => Object.assign(counters, values);
    report.close = outcome => {
        report.stage('koniec');
        lastOperation = {outcome, elapsedMs: Date.now() - started, stages, counters: {...counters}};
        notification?.remove?.(); operationStatus = null;
        for (const {button, disabled} of controls) button.disabled = disabled;
    };
    return report;
}

const scope = () => game.wfrp4eCorePl?.MODULE_ID ?? 'wfrp4e-core-pl';
const enabled = () => game.system.id === 'wfrp4e' && game.i18n.lang === 'pl';
const collection = type => game[COLLECTIONS[type]];
const dataOf = document => document.toObject();
const idOf = document => document.id ?? document._id;
const moduleOf = pack => pack.metadata?.packageName ?? pack.collection?.split('.')[0];
const moduleLabel = module => typeof premiumModuleTitle === 'function'
    ? premiumModuleTitle(module.id, module.title) : module.title;
const packLabel = pack => {
    const module = game.modules.get(moduleOf(pack));
    return module ? moduleLabel(module) : pack.metadata?.label ?? 'zawartość modułu';
};
const managedModule = module => enabled() && module?.id?.startsWith('wfrp4e-')
    && (module.protected || Object.hasOwn(game.wfrp4e?.config?.premiumModules ?? {}, module.id));
function initialized(id) {try {return !!game.settings.get(id, 'initialized');} catch {return false;}}
function documentModule(document) {
    if (document.flags?.[SCOPE]?.privateCopy) return null;
    return sourceFlag(document) ?? document._stats?.compendiumSource?.split('.')[1]
        ?? actorSource(document.flags?.core?.sourceId)?.module;
}
const escape = value => String(value).replace(/[&<>"']/gu, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

async function policy() {
    policyPromise ??= (async () => {
        const response = await fetch(`modules/${scope()}/modules/actor-source-policy.json`);
        if (!response.ok) throw new Error('Nie można wczytać dat publikacji aktorów.');
        return response.json();
    })();
    return policyPromise;
}
function loadState() {
    const state = clone(game.settings.get(scope(), KEY) ?? {});
    state.schema ??= 1;
    state.variants ??= {};
    state.documents ??= {};
    state.aliases ??= {};
    state.excludedModules ??= {};
    // Recover identity from document flags too: DEV/production installations
    // use different setting namespaces but must never create duplicate aliases.
    for (const actor of values(game.actors)) {
        const flag = variantFlag(actor);
        if (!flag || actor.flags?.[SCOPE]?.privateCopy) continue;
        const existing = state.variants[flag.sourceUuid];
        if (!existing || variantFlag(game.actors.get(existing.worldId))?.sourceUuid !== flag.sourceUuid) {
            state.variants[flag.sourceUuid] = {worldId: actor.id, originalId: flag.originalId,
                module: flag.module, publicationKey: flag.publicationKey, baseName: flag.baseName,
                retained: !!flag.retained};
        }
        // Protected Actors keep their exact flags even after source removal.
        // The registry still records that this is now an archived source.
        if (state.excludedModules[flag.module]) state.variants[flag.sourceUuid].retained = true;
        if (actor.id !== flag.originalId) state.aliases[flag.sourceUuid] ??= actor.id;
    }
    for (const [uuid, entry] of Object.entries(state.variants)) {
        const actor = game.actors.get(entry.worldId);
        if (!actor || (variantFlag(actor) && variantFlag(actor).sourceUuid !== uuid)) delete state.variants[uuid];
    }
    return state;
}
async function saveState(state) {
    await game.settings.set(scope(), KEY, state);
    for (const button of globalThis.document?.querySelectorAll?.('.wfrp4e-undo-content') ?? []) {
        button.disabled = !state.backup && !state.pending;
    }
}

// Bound both individual writes and the combined settings sent at world login.
// The previous backup stays intact until all compressed new parts exist.
const SNAPSHOT_CHARS = 2_000_000;
function snapshotKey(slot, part) {
    const key = `${KEY}Snapshot${slot}_${part}`;
    if (!game.settings.settings?.has(`${scope()}.${key}`)) {
        game.settings.register(scope(), key, {scope: 'world', config: false, type: String, default: ''});
    }
    return key;
}
async function storeSnapshot(snapshot, previous, progress) {
    if (previous?.storage === 1 && previous.chunks * SNAPSHOT_CHARS > MAX_SNAPSHOT_CHARACTERS) {
        throw new Error('Zapisana duża kopia w starym formacie wymaga bezpiecznej kompresji przed kolejną operacją. Nie zmieniono zawartości świata ani poprzedniej kopii.');
    }
    const slot = [1, 2].includes(previous?.storage) ? 1 - previous.slot : 0;
    await progress?.('Kompresowanie kopii bezpieczeństwa…', 0.5, true);
    const packed = await encodeSnapshot(snapshot), data = packed.data;
    const count = Math.ceil(data.length / SNAPSHOT_CHARS);
    const metrics = {snapshotCharacters: packed.characters, snapshotStoredCharacters: data.length, snapshotChunks: count,
        snapshotDocuments: snapshot.before.length, snapshotFolders: snapshot.folders.length};
    progress?.count?.(metrics);
    if (lastInspection) Object.assign(lastInspection.summary, metrics);
    const countKey = snapshotKey(slot, 'count');
    let oldCount = Number(game.settings.get(scope(), countKey) || 0);
    // An old interrupted write may contain parts beyond its published count.
    // Native WorldSettings exposes all persisted rows, including unregistered
    // setting keys. Do not leave that invisible tail in the login response.
    const prefix = `${scope()}.${KEY}Snapshot${slot}_`;
    for (const setting of values(game.settings.storage?.get('world'))) {
        const suffix = setting.key?.startsWith(prefix) ? setting.key.slice(prefix.length) : '';
        if (/^\d+$/u.test(suffix)) oldCount = Math.max(oldCount, Number(suffix) + 1);
    }
    // This count is also a high-water mark during preparation. Readers use
    // pointer.chunks, so recording it before the first part is safe.
    await game.settings.set(scope(), countKey, String(Math.max(count, oldCount)));
    for (let part = 0; part < count; part++) {
        await progress?.(`Zapisywanie kopii bezpieczeństwa: ${part + 1}/${count}`, 0.5 + 0.05 * (part / count));
        await game.settings.set(scope(), snapshotKey(slot, part), data.slice(part * SNAPSHOT_CHARS, (part + 1) * SNAPSHOT_CHARS));
    }
    for (let part = count; part < oldCount; part++) await game.settings.set(scope(), snapshotKey(slot, part), '');
    await game.settings.set(scope(), countKey, String(count));
    return {storage: 2, encoding: packed.encoding, characters: packed.characters, slot, chunks: count, time: snapshot.time};
}
async function readSnapshot(pointer) {
    // Accept pre-chunking snapshots so interrupted development imports recover.
    if (![1, 2].includes(pointer?.storage)) return pointer;
    if (![0, 1].includes(pointer.slot) || !Number.isInteger(pointer.chunks) || pointer.chunks < 1
        || (pointer.storage === 2 && pointer.chunks > Math.ceil(MAX_SNAPSHOT_CHARACTERS / SNAPSHOT_CHARS))) {
        throw new Error('Nieprawidłowy wskaźnik kopii bezpieczeństwa. Kopia pozostaje zachowana.');
    }
    const parts = [];
    for (let part = 0; part < pointer.chunks; part++) {
        const value = game.settings.get(scope(), snapshotKey(pointer.slot, part));
        if (typeof value !== 'string' || !value.length) throw new Error('Brakuje części zapisanej kopii bezpieczeństwa.');
        parts.push(value);
    }
    return pointer.storage === 2 ? decodeSnapshot(parts.join(''), pointer) : JSON.parse(parts.join(''));
}

function packsFor(module) {
    const declared = (module.flags?.initializationPacks ?? []).map(id => game.packs.get(id));
    if (declared.some(pack => !pack)) throw new Error(`Brakuje paczki inicjalizacji modułu ${module.title}.`);
    // Actors can be imported lazily by journals; some modules also omit Macros
    // from initializationPacks. Both still need the same lifecycle and IDs.
    return [...new Set([...declared, ...values(game.packs).filter(pack =>
        moduleOf(pack) === module.id && ['Actor', 'Macro'].includes(pack.documentName))])];
}
function sourceUuid(pack, data, type) {return `Compendium.${pack.collection}.${type}.${data._id}`;}
function nativeData(data, pack, type) {
    return nativeSourceData(pack, type, data);
}
async function actorRecords(pack, rules, ids, progress, packIndex, packCount, sources, index, reuse) {
    const folders = values(pack.folders).map(f => f.toObject());
    const records = [];
    for (let offset = 0; offset < ids.length; offset += 8) {
        await progress(`Wczytywanie aktorów: ${packLabel(pack)} (${offset}/${ids.length})`,
            0.1 + 0.2 * (packIndex + offset / ids.length) / Math.max(packCount, 1), true);
        // Foundry 14's supported _id__in operator limits both database results
        // and Babele/Actor construction to these exact source variants.
        const docs = await sources.read(pack, ids.slice(offset, offset + 8), {index, reuse});
        for (const document of docs) {
            if (!ids.includes(document.id)) throw new Error(`Paczka ${pack.collection} zwróciła niewłaściwego aktora.`);
            const translated = await localizedSourceData(pack, document, sources);
            const original = nativeData(translated, pack, 'Actor');
            const data = faithfulActor(original, translated);
            records.push({uuid: sourceUuid(pack, data, 'Actor'), module: moduleOf(pack), pack: pack.collection,
                originalId: data._id, sourceFolder: data.folder, data, raw: original,
                sourceRevision: await sources.sourceRevision?.(index?.get(document.id)),
                baseName: data.name, publication: publicationFor(moduleOf(pack), data.folder, folders, rules)});
            await progress(`Przygotowywanie aktorów: ${packLabel(pack)} (${records.length}/${ids.length})`,
                0.1 + 0.2 * (packIndex + records.length / ids.length) / Math.max(packCount, 1));
        }
    }
    if (records.length !== ids.length) throw new Error(`Nie wczytano wszystkich wymaganych aktorów z ${pack.collection}.`);
    return records;
}

async function readCatalog(requests, state, rules, progress, sources) {
    const deleted = new Set(requests.filter(r => r.mode === 'delete').map(r => r.module.id));
    const reimported = new Set(requests.filter(r => r.mode !== 'delete').map(r => r.module.id));
    const excluded = new Set([...Object.keys(state.excludedModules).filter(id => state.excludedModules[id]
        && !reimported.has(id)), ...deleted]);
    const actorRequests = requests.filter(r => r.mode !== 'delete' && r.settings.actors);
    const actorPacks = values(game.packs).filter(pack => pack.documentName === 'Actor');
    const packs = [];
    const wantedIds = new Set();
    for (const actor of values(game.actors)) if (deleted.has(sourceFlag(actor))) wantedIds.add(variantFlag(actor)?.originalId ?? actor.id);
    const records = new Map(), removedRecords = new Map(), protectedRecords = [];
    for (const {module} of actorRequests) {
        if (!managedModule(module) || !module.active) continue;
        for (const pack of actorPacks.filter(pack => moduleOf(pack) === module.id)) {
            packs.push({module, pack});
        }
    }
    const indices = new Map();
    // Inspect only the books explicitly being imported. Installed books do not
    // participate until their Actors are actually added to this world.
    const indexFor = async pack => {
        if (!indices.has(pack.collection)) {
            await progress(`Sprawdzanie indeksów aktorów: ${packLabel(pack)}`, 0.05, true);
            indices.set(pack.collection, values(await pack.getIndex({fields: ['_stats.modifiedTime']})));
        }
        return indices.get(pack.collection);
    };
    for (const {module, pack} of packs) {
        const request = actorRequests.find(r => r.module.id === module.id);
        if (!request) continue;
        for (const entry of await indexFor(pack)) {
            if (!request.actorIds || request.actorIds.includes(entry._id)) wantedIds.add(entry._id);
        }
    }
    // An update reads only Actors whose prepared source may differ from the
    // last import. The rest are taken from the world below (existingOnly), when
    // the entry, translations and code are unchanged and nothing was edited.
    const unchanged = new Map();
    for (const [packIndex, {module, pack}] of packs.entries()) {
        if (!wantedIds.size) break;
        const request = actorRequests.find(r => r.module.id === module.id);
        const index = new Map((await indexFor(pack)).map(entry => [entry._id, entry]));
        let ids = [...index.keys()].filter(id => !request.actorIds || request.actorIds.includes(id));
        if (request.mode === 'update') {
            const read = [];
            for (const id of ids) {
                await progress(`Sprawdzanie zmian aktorów: ${packLabel(pack)}`, 0.1 * (packIndex + 1) / packs.length);
                const uuid = sourceUuid(pack, {_id: id}, 'Actor'), entry = state.variants[uuid];
                const actor = entry ? game.actors.get(entry.worldId) : null;
                const revision = entry?.sourceRevision && entry.sourceHash && entry.hashVersion === 2
                    && variantFlag(actor)?.sourceUuid === uuid ? await sources.sourceRevision(index.get(id)) : null;
                if (revision && revision === entry.sourceRevision && await digest(dataOf(actor)) === entry.hash) unchanged.set(uuid, revision);
                else read.push(id);
            }
            sources.skipped(ids.length - read.length);
            ids = read;
        }
        if (ids.length) {
            const reuse = id => request.mode === 'update' && !!game.actors.get(state.variants[sourceUuid(pack, {_id: id}, 'Actor')]?.worldId);
            for (const record of await actorRecords(pack, rules, ids, progress, packIndex, packs.length, sources, index, reuse)) {
                records.set(record.uuid, record);
            }
        }
    }
    // Other variants come from world documents, not their source compendiums.
    // Keep their exact payload, including local edits, when moving the old
    // primary to its stable alias. Updating one book cannot refresh another.
    const worldActors = wantedIds.size ? values(game.actors) : [];
    const foldersByPack = new Map();
    for (const [index, actor] of worldActors.entries()) {
        await progress(`Sprawdzanie aktorów świata: ${index + 1}/${worldActors.length}`,
            actorRequests.length ? 0.3 : 0.02 + 0.08 * (index + 1) / worldActors.length, index === 0);
        if (actor.flags?.[SCOPE]?.privateCopy) continue;
        const flag = variantFlag(actor);
        let source = actorSource(flag?.sourceUuid ?? actor._stats?.compendiumSource ?? actor.flags?.core?.sourceId);
        // Official books reuse Actor source metadata when copying characters.
        // An explicit world import owner is stronger evidence than that older
        // upstream compendiumSource (the manager's full variant flag wins).
        if (!flag && wantedIds.has(actor.id) && sourceFlag(actor)
            && (!source || source.module !== sourceFlag(actor))) {
            const ownPacks = actorPacks.filter(pack => moduleOf(pack) === sourceFlag(actor));
            source = ownPacks.length === 1 ? actorSource(`Compendium.${ownPacks[0].collection}.Actor.${actor.id}`) : null;
        }
        if (!source || !wantedIds.has(source.id) || records.has(source.uuid)) continue;
        if (!flag && !rules.modules[source.module] && !managedModule(game.modules.get(source.module))) continue;
        // Manual duplicates keep their private IDs; only tracked aliases and
        // the original world ID are managed variants of a source Actor.
        if (!flag && actor.id !== source.id && state.variants[source.uuid]?.worldId !== actor.id) continue;
        const data = dataOf(actor);
        const pack = game.packs.get(source.pack);
        let sourceFolder = flag && Object.hasOwn(flag, 'sourceFolder') ? flag.sourceFolder : data.folder;
        if (!foldersByPack.has(source.pack)) foldersByPack.set(source.pack, values(pack?.folders).map(dataOf));
        const sourceFolders = foldersByPack.get(source.pack);
        // null means the source book root, not the Actor's current world
        // folder. Older imports could mistakenly save a generated world root
        // or another book's folder here; those are not source pack folders.
        if (pack && sourceFolder && !sourceFolders.some(folder => folder._id === sourceFolder)) sourceFolder = null;
        const record = {uuid: source.uuid, module: source.module, pack: source.pack,
            originalId: source.id, sourceFolder, data, raw: clone(data),
            baseName: flag?.baseName ?? data.name, publication: rules.publications[flag?.publicationKey]
                ? {key: flag.publicationKey, ...rules.publications[flag.publicationKey]}
                : publicationFor(source.module, sourceFolder, sourceFolders, rules),
            existingOnly: true, retained: excluded.has(source.module) || !!flag?.retained};
        if (unchanged.has(source.uuid)) Object.assign(record, {unchangedSource: true, sourceRevision: unchanged.get(source.uuid), raw: null});
        (excluded.has(source.module) ? removedRecords : records).set(source.uuid, record);
    }
    // Preserve a removed source only when another book or private document
    // actually refers to it. It becomes an archived secondary, not the winner.
    const unused = new Map(), byId = new Map();
    for (const record of removedRecords.values()) {
        const entry = state.variants[record.uuid];
        const old = entry ? game.actors.get(entry.worldId) : game.actors.get(record.originalId);
        if (!old || !knownOwner(old, [record]).has(record.uuid)) continue;
        if (protectedActor(old)) {
            // Keep reference bindings, but never plan writes or let an excluded
            // protected secondary compete for the main ID of another book.
            protectedRecords.push({...record, worldId: old.id});
            continue;
        }
        const candidate = {record, old};
        unused.set(record.uuid, candidate);
        for (const id of new Set([old.id, record.originalId])) {
            if (!byId.has(id)) byId.set(id, []);
            byId.get(id).push(candidate);
        }
    }
    if (unused.size) {
        // Scan each world document once, rather than serializing the entire
        // world again for every removed Actor (minutes with large books).
        const pattern = new RegExp([...byId.keys()].join('|'), 'gu');
        const sourceModules = new Set([...unused.values()].map(value => value.record.module));
        const documents = Object.keys(TYPES).flatMap(type => values(collection(type)).map(document => ({type, document})));
        for (const [index, {type, document}] of documents.entries()) {
            if (!unused.size) break;
            await progress(`Sprawdzanie użycia aktorów w świecie: ${index + 1}/${documents.length}`,
                actorRequests.length ? 0.305 : 0.1 + 0.2 * (index + 1) / documents.length, index === 0);
            const owner = documentModule(document);
            const protectedDocument = document.hasPlayerOwner || (type === 'Actor' && protectedActor(document));
            // Unprotected documents of the same removed book will disappear.
            if (sourceModules.size === 1 && sourceModules.has(owner) && !protectedDocument) continue;
            const data = dataOf(document), serialized = JSON.stringify(data);
            const matches = new Set(serialized.match(pattern) ?? []);
            let unscoped;
            for (const id of matches) for (const {record, old} of byId.get(id)) {
                if (!unused.has(record.uuid) || document === old || (owner === record.module && !protectedDocument)) continue;
                if (!serialized.includes(record.uuid)) {
                    unscoped ??= unscopedActorIds(data);
                    if (!unscoped.has(old.id)) continue;
                }
                records.set(record.uuid, {...record, data: variantFlag(old) ? dataOf(old) : clone(record.data),
                    baseName: variantFlag(old)?.baseName ?? record.baseName, retained: true, existingOnly: true});
                unused.delete(record.uuid);
            }
        }
    }
    return {records, removedRecords, protectedRecords, deleted};
}

function protectedActor(actor) {
    return actor.hasPlayerOwner || actor.inCombat || values(game.users).some(user => user.character?.id === actor.id);
}
function knownOwner(document, records) {
    const flag = variantFlag(document);
    if (flag?.sourceUuid) return new Set([flag.sourceUuid]);
    const imported = records.filter(record => record.module === sourceFlag(document) && record.originalId === document.id);
    if (imported.length === 1) return new Set([imported[0].uuid]);
    return legacySources(dataOf(document), records);
}

function folderModule(id) {
    const seen = new Set();
    while (id && !seen.has(id)) {
        seen.add(id);
        const folder = game.folders.get(id);
        if (!folder) return null;
        if (sourceFlag(folder)) return sourceFlag(folder);
        id = folder.folder?.id ?? folder.folder;
    }
    return null;
}

async function buildActorPlan(requests, state, catalog, progress) {
    const wanted = new Set(requests.filter(r => r.mode !== 'delete' && r.settings.actors).map(r => r.module.id));
    const touched = new Set();
    for (const record of catalog.records.values()) if (wanted.has(record.module)
        && requests.some(r => r.module.id === record.module && (!r.actorIds || r.actorIds.includes(record.originalId)))) touched.add(record.originalId);
    for (const entry of Object.values(state.variants)) if (catalog.deleted.has(entry.module)) touched.add(entry.originalId);
    for (const actor of values(game.actors)) if (catalog.deleted.has(sourceFlag(actor))) touched.add(actor.id);
    const groups = new Map();
    for (const record of catalog.records.values()) {
        if (!groups.has(record.originalId)) groups.set(record.originalId, []);
        groups.get(record.originalId).push(record);
    }
    const plans = [];
    const assignments = [];
    const oldBindings = new Map();
    const ambiguities = new Set();
    const usedIds = new Set(values(game.actors).map(idOf));
    const skipped = [];
    for (const [originalId, candidates] of groups) {
        if (!touched.has(originalId)) continue;
        await progress('Planowanie wariantów aktorów…', 0.31);
        const available = candidates.filter(record => !record.retained && !record.unavailable);
        // With no eligible source there is no primary. Used removed variants
        // survive under their stable secondary IDs until explicitly imported.
        const primary = available.length ? choosePrimary(available) : {uuid: null};
        const original = game.actors.get(originalId);
        const knownCandidates = [...candidates, ...[...catalog.removedRecords.values()].filter(r => r.originalId === originalId)];
        let owners = original ? knownOwner(original, knownCandidates) : new Set();
        // On source removal, its old flag is still evidence of its identity.
        if (original && !owners.size && catalog.deleted.has(sourceFlag(original))) {
            const source = actorSource(original._stats?.compendiumSource ?? original.flags?.core?.sourceId);
            if (source) owners.add(source.uuid);
            else if (variantFlag(original)) owners.add(variantFlag(original).sourceUuid);
        }
        if (original && protectedActor(original)) {
            skipped.push(original.name);
            continue;
        }
        if (original && !owners.size) {
            throw new Error(`Nie można przejąć ID aktora „${original.name}”: brak potwierdzonego źródła.`);
        }
        if (owners.size === 1) oldBindings.set(originalId, [...owners][0]);
        else if (owners.size > 1) ambiguities.add(originalId);
        for (const record of candidates) {
            const previous = state.variants[record.uuid];
            let current = previous ? game.actors.get(previous.worldId) : null;
            if (current && variantFlag(current)?.sourceUuid !== record.uuid) current = null;
            if (!current && original && owners.size === 1 && owners.has(record.uuid)) current = original;
            let worldId = originalId;
            if (record.uuid !== primary.uuid) {
                worldId = state.aliases[record.uuid];
                if (!worldId || (game.actors.has(worldId) && variantFlag(game.actors.get(worldId))?.sourceUuid !== record.uuid)) {
                    let salt = 0;
                    do {worldId = (await digest(`${SCOPE}:${record.uuid}:${salt++}`)).slice(0, 16);} while (usedIds.has(worldId));
                    state.aliases[record.uuid] = worldId;
                }
            }
            usedIds.add(worldId);
            if (current && protectedActor(current)) throw new Error(`Aktor „${current.name}” jest postacią gracza lub uczestniczy w walce.`);
            // Snapshot placement before any writes: the old primary's live
            // Document may later become the newer primary under the same ID.
            const currentFolder = current?.folder?.id ?? current?.folder ?? null;
            const canRestoreFolder = !!game.packs.get(record.pack) || game.folders.has(record.sourceFolder);
            const currentFolderModule = folderModule(currentFolder);
            const foreignFolder = currentFolderModule && currentFolderModule !== record.module;
            const preserveFolder = !!current && (!canRestoreFolder
                || (record.uuid === primary.uuid && worldId === current.id && !foreignFolder));
            const refresh = wanted.has(record.module) || !current || !variantFlag(current);
            const data = refresh ? {...record.data, flags: {...record.data.flags}} : dataOf(current);
            const baseName = refresh ? record.baseName : variantFlag(current).baseName;
            data._id = worldId;
            data.name = displayName({...record, baseName}, primary);
            data.flags ??= {};
            data.flags['warhammer-lib'] = {...data.flags['warhammer-lib'], source: record.module};
            data.flags.core = {...data.flags.core, sourceId: record.uuid};
            data._stats = {...data._stats, compendiumSource: record.uuid};
            data.flags[SCOPE] = {...data.flags[SCOPE], nameAliases: [...new Set([
                ...(current?.flags?.[SCOPE]?.nameAliases ?? []), baseName, data.flags.babele?.originalName, record.raw?.name
            ].filter(Boolean))], actorVariant: {sourceUuid: record.uuid, originalId, module: record.module,
                baseName, publicationKey: record.publication?.key ?? null, sourceFolder: record.sourceFolder,
                role: record.uuid === primary.uuid ? 'primary' : 'secondary', retained: !!record.retained, schema: 1}};
            assignments.push({...record, worldId, referenceNames: [...data.flags[SCOPE].nameAliases, current?.name].filter(Boolean)});
            plans.push({type: 'Actor', id: worldId, data, raw: record.raw, record, current,
                sourceFolder: record.sourceFolder, preserveFolder, currentFolder,
                ownership: current?.ownership ?? original?.ownership,
                mixed: !!original && owners.size > 1, refresh});
            if (current) oldBindings.set(current.id, record.uuid);
        }
    }
    // Unaffected variants still participate in cross-book reference resolution.
    for (const [uuid, entry] of Object.entries(state.variants)) {
        if (touched.has(entry.originalId) || catalog.deleted.has(entry.module)) continue;
        if (!game.actors.has(entry.worldId)) continue;
        assignments.push({uuid, ...entry, referenceNames: game.actors.get(entry.worldId)?.flags?.[SCOPE]?.nameAliases});
        oldBindings.set(entry.worldId, uuid);
    }
    for (const record of catalog.protectedRecords) {
        assignments.push(record);
        oldBindings.set(record.worldId, record.uuid);
        state.variants[record.uuid] = {...state.variants[record.uuid], worldId: record.worldId,
            originalId: record.originalId, module: record.module, publicationKey: record.publication?.key ?? null,
            baseName: record.baseName, retained: true};
    }
    return {plans, assignments, oldBindings, ambiguities, touched, skipped};
}

async function buildOtherPlans(requests, progress, sources) {
    const plans = [];
    for (const request of requests) {
        if (request.mode === 'delete') continue;
        for (const pack of packsFor(request.module)) {
            const type = pack.documentName;
            if (type === 'Actor' || !TYPES[type] || !request.settings[TYPES[type]]) continue;
            await progress(`Sprawdzanie zawartości: ${moduleLabel(request.module)}`, 0.33, true);
            const index = new Map(values(await pack.getIndex({fields: request.mode === 'update' ? ['_stats.modifiedTime'] : []})).map(entry => [entry._id, entry]));
            const ids = [...index.keys()];
            let prepared = 0;
            for (let offset = 0; offset < ids.length; offset += 20) {
                await progress(`Przygotowywanie zawartości: ${moduleLabel(request.module)} (${prepared}/${ids.length})`, 0.35, true);
                const batch = ids.slice(offset, offset + 20);
                const documents = await sources.read(pack, batch, {index,
                    reuse: id => request.mode === 'update' && collection(type).has(id),
                    invoke: read => type === 'Scene' ? withSourceSceneContext(batch, read) : read()});
                for (const document of documents) {
                    prepared++;
                    const data = await localizedSourceData(pack, document, sources);
                    const current = collection(type).get(data._id);
                    if (request.settings.excludeNameChange && current && current.name !== data.name) continue;
                    if (current?.hasPlayerOwner) continue;
                    if (type === 'Scene' && current) data.active = current.active ?? dataOf(current).active;
                    data.flags ??= {};
                    data.flags['warhammer-lib'] = {...data.flags['warhammer-lib'], source: request.module.id};
                    // Original EN data is needed only to recognize an old
                    // unregistered import. Normal tracked updates never use it.
                    plans.push({type, id: data._id, data, originalSource: () => nativeData(data, pack, type),
                        module: request.module.id, pack: pack.collection, current,
                        sourceFolder: data.folder, preserveFolder: !!current,
                        currentFolder: current?.folder?.id ?? current?.folder ?? null, ownership: current?.ownership});
                    await progress(`Przygotowywanie zawartości: ${moduleLabel(request.module)} (${prepared}/${ids.length})`, 0.35);
                }
            }
        }
    }
    return plans;
}

function legacyMatches(current, incoming, raw) {
    const one = JSON.parse(comparable(current));
    const two = JSON.parse(comparable(incoming));
    const three = JSON.parse(comparable(raw ?? incoming));
    function match(a, b, c) {
        if (a === b || a === c) return true;
        if (Array.isArray(a)) {
            if (!Array.isArray(b) || !Array.isArray(c)) return false;
            if (a.some(v => v?._id)) {
                const left = new Map(b.map(v => [v._id, v])), right = new Map(c.map(v => [v._id, v]));
                return a.length === b.length && a.every(v => left.has(v._id) && match(v, left.get(v._id), right.get(v._id)));
            }
            return a.length === b.length && a.every((v, i) => match(v, b[i], c[i]));
        }
        if (a && typeof a === 'object') return Object.keys(a).every(key => match(a[key], b?.[key], c?.[key]));
        return false;
    }
    return match(one, two, three);
}

function rootUpdate(document, incoming) {
    return documentPatch(document, incoming);
}

// Fingerprint of the prepared source payload, not of the saved world copy.
// The server normalizes HTML on write, so the world can never equal the raw
// source; an unchanged source plus an unedited world is the reliable no-op.
// World-bound placement and activation are compared separately.
function sourceDigest(data) {
    const {active, ...source} = data;
    return digest(`${comparable(source)}\n${JSON.stringify(data.flags?.[SCOPE] ?? null)}`);
}

// Resolve existing placements before deciding which documents need backup.
// If a destination folder still needs creation, keep the plan conservatively.
function comparableTarget(plan) {
    const current = collection(plan.type).get(plan.id);
    if (!current) return null;
    // Only placement, ownership and activation differ from the prepared
    // source. Embedded data stays immutable until the native write copy.
    const data = {...plan.data};
    if (plan.preserveFolder && plan.current && (!plan.currentFolder || game.folders.has(plan.currentFolder))) data.folder = plan.currentFolder;
    else if (plan.referencesOnly && plan.current) data.folder = plan.current.folder?.id ?? plan.current.folder ?? null;
    else {
        const folder = game.folders.get(plan.sourceFolder);
        const moduleId = plan.record?.module ?? plan.module;
        if (folder && (plan.type !== 'Actor' || folderModule(plan.sourceFolder) === moduleId)) data.folder = plan.sourceFolder;
        else {
            // Explicit source-book-root placement, never a foreign/current
            // subfolder. Ambiguous or legacy roots stay in the write plan.
            const roots = values(game.folders).filter(folder => folder.type === plan.type
                && sourceFlag(folder) === moduleId && folder.flags?.['warhammer-lib']?.contentRoot === true);
            if (plan.sourceFolder != null || roots.length !== 1) return null;
            data.folder = roots[0].id;
        }
    }
    if (plan.ownership) data.ownership = clone(plan.ownership);
    else data.ownership ??= {default: 0, [game.user.id]: 3};
    if (plan.type === 'Scene') data.active = current.active ?? dataOf(current).active;
    return data;
}

async function rememberPlan(state, plan, verifiedHash = null) {
    const document = collection(plan.type).get(plan.id);
    const data = verifiedHash ? null : dataOf(document);
    const hash = verifiedHash ?? await digest(data);
    const automaticBaseline = plan.type === 'Actor' ? plan.comparedBaseline ?? actorBaselineValues(data) : undefined;
    const currentSceneHash = async () => plan.comparedSceneHash ?? sceneDigest(data ?? dataOf(document));
    if (plan.type === 'Actor' && plan.record) {
        const sourceAutomaticBaseline = plan.record.existingOnly ? state.variants[plan.record.uuid]?.sourceAutomaticBaseline : actorBaselineValues(plan.record.data);
        state.variants[plan.record.uuid] = {worldId: plan.id, originalId: plan.record.originalId,
            module: plan.record.module, publicationKey: plan.record.publication?.key ?? null,
            baseName: plan.record.baseName, retained: !!plan.record.retained, hash, hashVersion: 2, automaticBaseline,
            ...(sourceAutomaticBaseline ? {sourceAutomaticBaseline} : {}),
            ...(plan.sourceHash ? {sourceHash: plan.sourceHash} : {}),
            ...(plan.sourceHash && plan.record.sourceRevision ? {sourceRevision: plan.record.sourceRevision} : {})};
    } else if (plan.referencesOnly) {
        const flag = variantFlag(document);
        const entry = flag ? state.variants[flag.sourceUuid] : state.documents[`${plan.type}:${plan.id}`];
        if (entry) {
            entry.hash = hash; entry.hashVersion = 2;
            if (automaticBaseline) entry.automaticBaseline = automaticBaseline;
            if (plan.type === 'Scene') entry.sceneHash = await currentSceneHash();
        }
    } else {
        state.documents[`${plan.type}:${plan.id}`] = {module: plan.module,
            sourceUuid: `Compendium.${plan.pack}.${plan.type}.${plan.id}`, hash, hashVersion: 2,
            ...(plan.sourceHash ? {sourceHash: plan.sourceHash} : {}),
            ...(plan.type === 'Scene' ? {sceneHash: await currentSceneHash()} : {})};
    }
}

async function waitForSceneCanvas(document) {
    let scene = document;
    while (scene && scene.documentName !== 'Scene') scene = scene.parent;
    const board = globalThis.canvas;
    if (!scene || !board?.initialized) return;
    // Scene/Level update callbacks may start Canvas#draw without returning its
    // promise to the database operation. Let it start and wait on public state.
    await new Promise(resolve => setTimeout(resolve, 0));
    const deadline = Date.now() + 60_000;
    while (board.loading) {
        if (Date.now() >= deadline) throw new Error('Rysowanie mapy trwa zbyt długo. Kopia operacji jest zachowana; przeładuj widok Foundry przed ponowieniem.');
        await new Promise(resolve => setTimeout(resolve, 25));
    }
    if (board.scene === scene && !board.ready) throw new Error('Widok mapy nie jest gotowy do aktualizacji. Przeładuj Foundry i przywróć przerwaną operację.');
}

function embeddedUpdateSatisfied(document, update) {
    if (!document || typeof document.constructor.cleanData !== 'function' || typeof document.updateSource !== 'function') return false;
    try {
        // Foundry omits successful no-ops from the returned array after native
        // migration, sanitization and validation. Verify that exact condition;
        // a missing ID with a remaining change must still abort and roll back.
        const input = copyUpdate(update);
        const changes = document.constructor.cleanData(input, {
            migrate: true, sanitize: true, partial: true
        }, {creation: false, model: document, source: document._source});
        const diff = document.updateSource(changes, {clean: true, dryRun: true, fallback: false, recursive: true});
        return diff != null && Object.keys(diff).length === 0;
    } catch {return false;}
}

async function replaceEmbedded(document, incoming, changes) {
    for (const group of changes.collections) {
        const {type, remove, create, update} = group;
        const existing = document.getEmbeddedCollection(type);
        if (remove.length) {
            await waitForSceneCanvas(document);
            await document.deleteEmbeddedDocuments(type, [...remove], {...OP});
            if (remove.some(id => existing.has(id))) throw new Error(`Foundry nie usunęło wszystkich elementów dokumentu „${document.name}”. Kopia operacji jest zachowana.`);
            await waitForSceneCanvas(document);
        }
        const updates = [];
        for (const child of update) {
            const present = existing.get(child.id);
            if (!present) throw new Error(`Brakuje elementu dokumentu „${document.name}”. Kopia operacji jest zachowana.`);
            await replaceEmbedded(present, null, child.changes);
            if (child.changes.patch) updates.push({_id: child.id, ...copyUpdate(child.changes.patch)});
        }
        if (updates.length) {
            await waitForSceneCanvas(document);
            const result = await document.updateEmbeddedDocuments(type, updates, {...OP, diff: true, recursive: true});
            if (Array.isArray(result) && updates.some(child => !result.some(value => idOf(value) === child._id)
                && !embeddedUpdateSatisfied(existing.get(child._id), child))) {
                throw new Error(`Foundry odrzuciło aktualizację elementów dokumentu „${document.name}”. Kopia operacji jest zachowana.`);
            }
            await waitForSceneCanvas(document);
        }
        if (create.length) {
            await waitForSceneCanvas(document);
            const result = await document.createEmbeddedDocuments(type, copyUpdate(create), {...OP});
            if (Array.isArray(result) && create.some(child => !result.some(value => idOf(value) === child._id))) {
                throw new Error(`Foundry nie utworzyło wszystkich elementów dokumentu „${document.name}”. Kopia operacji jest zachowana.`);
            }
            await waitForSceneCanvas(document);
        }
    }
}

async function replaceDocument(document, incoming, reconcile = true, changes = null) {
    const invoke = () => replaceDocumentInContext(document, incoming, reconcile, changes);
    if (document.documentName === 'Scene') return withSourceSceneContext([idOf(document)], invoke);
    return withSourceActorContext(document.documentName === 'Actor' ? [idOf(document)] : [], invoke);
}

async function replaceDocumentInContext(document, incoming, reconcile = true, changes = null) {
    changes ??= documentChanges(document, incoming);
    await waitForSceneCanvas(document);
    await replaceEmbedded(document, incoming, changes);
    if (changes.patch) {
        await waitForSceneCanvas(document);
        const update = copyUpdate(changes.patch);
        const result = await document.update(update, {...OP, diff: true, recursive: true});
        if (!result && !embeddedUpdateSatisfied(document, update)) throw new Error(`Foundry odrzuciło aktualizację dokumentu „${document.name}”. Kopia operacji jest zachowana.`);
        await waitForSceneCanvas(document);
    }
    if (document.documentName === 'Actor') {
        const expected = JSON.stringify((incoming.items ?? []).map(item => item._id).sort());
        const matches = () => JSON.stringify(values(document.items).map(idOf).sort()) === expected;
        if (!matches() && reconcile) await replaceDocument(document, incoming, false);
        if (!matches()) throw new Error(`Niezgodny zestaw elementów aktora ${incoming.name}. Kopia operacji jest zachowana.`);
    }
}

async function createWorldDocuments(type, data) {
    const target = type === 'Folder' ? game.folders : collection(type);
    const documentClass = type === 'Folder' ? CONFIG.Folder.documentClass : target.documentClass;
    const create = () => documentClass.createDocuments(data, {...OP});
    const created = type === 'Scene' ? await withSourceSceneContext(data.map(child => child._id), create)
        : await withSourceActorContext(type === 'Actor' ? data.map(child => child._id) : [], create);
    if (data.some(child => !target.has(child._id)
        || (Array.isArray(created) && !created.some(document => idOf(document) === child._id)))) {
        throw new Error(`Foundry nie utworzyło wszystkich dokumentów (${type}). Kopia operacji jest zachowana.`);
    }
    return created;
}

async function deleteWorldDocument(type, id) {
    const target = type === 'Folder' ? game.folders : collection(type);
    const document = target.get(id);
    if (!document) return;
    const documentClass = type === 'Folder' ? CONFIG.Folder.documentClass : target.documentClass;
    await waitForSceneCanvas(document);
    const deleted = await documentClass.deleteDocuments([id], {...OP,
        ...(type === 'Folder' ? {deleteSubfolders: false, deleteContents: false} : {})});
    await waitForSceneCanvas(document);
    // preDelete hooks may filter IDs without throwing. Never clear the source
    // registry or report completion while the requested document still exists.
    if (target.has(id) || (Array.isArray(deleted) && !deleted.some(value => idOf(value) === id))) {
        throw new Error(`Foundry nie usunęło dokumentu „${document.name}”. Kopia operacji jest zachowana.`);
    }
}

async function restoreSnapshot(snapshot, progress) {
    writingActors = true;
    try {
        // Restore folders before documents that reference them.
        const missing = snapshot.folders.filter(data => !game.folders.has(data._id));
        while (missing.length) {
            const ready = missing.filter(data => !data.folder || game.folders.has(data.folder));
            if (!ready.length) throw new Error('Nie można odtworzyć powiązań folderów z kopii bezpieczeństwa.');
            await progress?.('Przywracanie brakujących folderów…', 0.1);
            await createWorldDocuments('Folder', ready.map(clone));
            for (const data of ready) missing.splice(missing.indexOf(data), 1);
        }
        for (const data of snapshot.folders) {
            const folder = game.folders.get(data._id);
            if (folder) {
                if (snapshot.folderMode !== 'dependencies' && JSON.stringify(folder.toObject()) !== JSON.stringify(data)) await folder.update(clone(data), {...OP});
            }
        }
        let restored = 0;
        for (const saved of snapshot.before) {
            await progress?.(`Przywracanie dokumentów: ${++restored}/${snapshot.before.length} — ${saved.data.name ?? saved.id}`,
                0.2 + 0.6 * restored / Math.max(snapshot.before.length, 1));
            const target = collection(saved.type);
            const existing = target.get(saved.id);
            if (existing) await replaceDocument(existing, saved.data);
            else {
                await createWorldDocuments(saved.type, [clone(saved.data)]);
                if (saved.type === 'Actor') await replaceDocument(target.get(saved.id), saved.data);
            }
        }
        for (const created of snapshot.created) {
            if (collection(created.type)?.has(created.id)) await deleteWorldDocument(created.type, created.id);
        }
        for (const placement of snapshot.placements) {
            const document = collection(placement.type)?.get(placement.id);
            if (document && (document.folder?.id ?? document.folder ?? null) !== placement.folder) {
                await document.update({folder: placement.folder}, {...OP});
            }
        }
        for (const placement of snapshot.packPlacements ?? []) {
            const pack = game.packs.get(placement.id);
            if (pack && (pack.folder?.id ?? null) !== placement.folder) await pack.setFolder(placement.folder);
        }
        const beforeIds = new Set(snapshot.folders.map(f => f._id));
        for (const folder of snapshot.folderMode === 'dependencies' ? [] : foldersChildrenFirst()) {
            if (!beforeIds.has(folder.id) && (snapshot.modules.includes(sourceFlag(folder))
                || snapshot.modules.includes(folder.flags?.['warhammer-lib']?.contentModule)
                || folder.flags?.['warhammer-lib']?.contentCategory)) {
                if (!folder.contents.length && !values(game.folders).some(f => (f.folder?.id ?? f.folder) === folder.id)) await deleteWorldDocument('Folder', folder.id);
            }
        }
        for (const [module, value] of Object.entries(snapshot.initialized)) await game.settings.set(module, 'initialized', value);
    } finally {writingActors = false;}
}

function foldersChildrenFirst() {
    const depth = folder => {
        let result = 0, current = folder;
        const seen = new Set();
        while (current && !seen.has(current.id)) {
            seen.add(current.id); result++;
            const parent = current.folder?.id ?? current.folder;
            current = game.folders.get(parent);
        }
        return result;
    };
    return values(game.folders).sort((a, b) => depth(b) - depth(a));
}

async function assertPlanCurrent(plan) {
    const current = collection(plan.type).get(plan.id);
    let changed = plan.comparedHash ? !current : !!current;
    if (current && plan.comparedHash) {
        const data = dataOf(current), guard = plan.comparedGuard;
        const ownership = data.ownership ?? {}, expected = guard.ownership;
        changed = await digest(data) !== plan.comparedHash || (data.folder ?? null) !== guard.folder
            || data.sort !== guard.sort || Object.keys(ownership).length !== Object.keys(expected).length
            || Object.keys(ownership).some(key => ownership[key] !== expected[key])
            || (variantFlag(data)?.sourceUuid ?? null) !== guard.sourceUuid
            || (sourceFlag(data) ?? null) !== guard.module
            || (data._stats?.compendiumSource ?? null) !== guard.compendiumSource;
        if (current.hasPlayerOwner || (plan.type === 'Actor' && protectedActor(current))) changed = true;
    }
    if (changed) throw new Error(`Dokument „${plan.data.name ?? plan.id}” zmienił się podczas przygotowania. Ponów aktualizację; nie zapisano zmian zawartości.`);
}

async function execute(requests, progress, {inspectOnly = false} = {}) {
    if (!game.user.isGM || (game.users.activeGM && game.users.activeGM.id !== game.user.id)) {
        throw new Error('Operację może wykonać tylko aktywny Mistrz Gry.');
    }
    const storedRegistry = clone(game.settings.get(scope(), KEY) ?? {});
    delete storedRegistry.backup; delete storedRegistry.pending;
    const state = loadState();
    if (state.pending) throw new Error('Poprzednia operacja została przerwana. Użyj „Cofnij ostatnią operację” przed kolejnym importem.');
    const originalRegistry = clone(state);
    delete originalRegistry.backup;
    const rules = await policy();
    progress.stage?.('źródła');
    await progress('Sprawdzanie źródeł i odnośników…', 0.01, true);
    const sources = requests.some(request => request.mode !== 'delete')
        ? await sourceReadContext(progress) : {current() {}};
    const catalog = await readCatalog(requests, state, rules, progress, sources);
    const actorPlan = await buildActorPlan(requests, state, catalog, progress);
    progress.stage?.('pozostała zawartość');
    const plans = [...actorPlan.plans, ...await buildOtherPlans(requests, progress, sources)];
    const maps = referenceMaps(actorPlan.assignments);
    const affectedIds = new Set(actorPlan.touched);
    for (const record of actorPlan.assignments) if (actorPlan.touched.has(record.originalId)) affectedIds.add(record.worldId);
    for (const [id, uuid] of actorPlan.oldBindings) if (actorPlan.touched.has(actorSource(uuid)?.id)) affectedIds.add(id);
    const referenceIds = [...affectedIds].filter(id => /^[A-Za-z0-9]{16}$/u.test(id));
    const referencePattern = referenceIds.length ? new RegExp(referenceIds.join('|'), 'u') : null;
    const referenceNames = new Map();
    for (const [key, id] of maps.names) {
        if (!id || !affectedIds.has(id)) continue;
        const split = key.indexOf(':'), moduleId = key.slice(0, split), name = key.slice(split + 1);
        if (!referenceNames.has(moduleId)) referenceNames.set(moduleId, new Set());
        referenceNames.get(moduleId).add(name);
    }
    const deleting = [];
    const planned = new Map(plans.map(p => [`${p.type}:${p.id}`, p]));
    let referenceChecked = 0, referenceCandidates = 0;
    progress.stage?.('odnośniki');
    // Journals-only updates have no Actor bindings to move and no deletions.
    if (referencePattern || catalog.deleted.size || actorPlan.touched.size) for (const [type] of Object.entries(TYPES)) {
        for (const document of values(collection(type))) {
            await progress('Sprawdzanie odnośników w świecie…', 0.4);
            const module = documentModule(document);
            const key = `${type}:${document.id}`;
            const flag = variantFlag(document);
            if (type === 'Actor' && catalog.deleted.has(module) && protectedActor(document)) actorPlan.skipped.push(document.name);
            if (type === 'Actor' && flag && actorPlan.touched.has(flag.originalId)
                && !planned.has(key) && actorPlan.assignments.some(r => r.uuid === flag.sourceUuid && r.worldId !== document.id)) {
                deleting.push({type, id: document.id, data: dataOf(document)});
                continue;
            }
            if (catalog.deleted.has(module) && !document.hasPlayerOwner
                && (type !== 'Actor' || !protectedActor(document))) {
                if (type !== 'Actor' || flag || actorPlan.touched.has(document.id)) {
                    if (!planned.has(key)) deleting.push({type, id: document.id, data: dataOf(document)});
                    continue;
                }
            }
            if (planned.has(key)) continue;
            if (!referencePattern) continue;
            // Most world documents have no relation to this import. Avoid
            // copying their contents or scanning ignored source provenance.
            referenceChecked++;
            if (!hasActorReference(document, referencePattern, referenceNames.get(module))) continue;
            referenceCandidates++;
            const before = dataOf(document);
            if ((!module || !managedModule(game.modules.get(module)))
                && [...unscopedActorIds(before)].some(id => actorPlan.ambiguities.has(id))) {
                throw new Error(`Dokument „${document.name}” odwołuje się do mieszanego aktora bez wskazania książki. Najpierw wskaż jego źródło.`);
            }
            const references = rewriteReferences(before, module, maps, actorPlan.oldBindings);
            if (references !== before && comparable(references) !== comparable(before)) {
                if (!module || !managedModule(game.modules.get(module))) {
                    // Unmanaged documents keep their exact previous variant via
                    // a known old binding; mixed actors cannot be guessed.
                    // Exact previous bindings preserve private token variants.
                }
                plans.push({type, id: document.id, data: references, current: document,
                    module, preserveFolder: true, currentFolder: document.folder?.id ?? document.folder ?? null, referencesOnly: true});
            }
        }
    }
    progress.count?.({referenceChecked, referenceCandidates});
    // Keep deleted actors only when other content still explicitly needs them.
    // Deletion must never silently destroy cross-book or private uses.
    for (const removed of deleting.filter(p => p.type === 'Actor')) {
        const uuid = variantFlag(removed.data)?.sourceUuid;
        const consumers = plans.filter(p => p.type !== 'Actor' && (JSON.stringify(p.data).includes(`Actor.${removed.id}`)
            || (uuid && JSON.stringify(p.data).includes(uuid))));
        if (consumers.length && !actorPlan.assignments.some(r => r.uuid === uuid)) throw new Error(`Nie można usunąć aktora „${removed.data.name}”: nadal używają go inne dokumenty. Cofnij wybór usuwania tego modułu.`);
    }
    const changed = [], diagnostics = [];
    let diagnosticBudget = 400;
    const writePlans = [], skippedPlans = [];
    let automaticUnchanged = 0, sourceUnchangedCount = 0;
    progress.stage?.('porównanie');
    for (const plan of plans) {
        await progress('Sprawdzanie istniejącej zawartości…', 0.45);
        if (!plan.referencesOnly) {
            const module = plan.record?.module ?? plan.module;
            plan.data = rewriteReferences(plan.data, module, maps, actorPlan.oldBindings);
        }
        const existing = collection(plan.type).get(plan.id);
        if (existing?.hasPlayerOwner) throw new Error(`Dokument „${existing.name}” należy do gracza i jest chroniony.`);
        if (plan.type === 'Actor' && existing && protectedActor(existing)) throw new Error(`Aktor „${existing.name}” uczestniczy w walce lub jest postacią gracza i jest chroniony.`);
        const marker = existing ? state.documents[`${plan.type}:${plan.id}`]
            ?? (plan.type === 'Actor' ? state.variants[variantFlag(existing)?.sourceUuid] : null) : null;
        const target = existing ? comparableTarget(plan) : null;
        const before = existing ? dataOf(existing) : null;
        if (target && plan.type === 'Scene') keepAutomaticTokenValues(target, before, existing);
        if (before) plan.comparedGuard = {folder: before.folder ?? null, sort: before.sort,
            ownership: {...before.ownership}, sourceUuid: variantFlag(before)?.sourceUuid ?? null,
            module: sourceFlag(before) ?? null, compendiumSource: before._stats?.compendiumSource ?? null};
        plan.folderUnresolved = !!existing && !target;
        // A skipped read keeps the digest of the unchanged prepared source.
        if (!plan.referencesOnly) plan.sourceHash = plan.record?.unchangedSource ? marker?.sourceHash ?? null : await sourceDigest(plan.data);
        const beforeHash = before ? await digest(before) : null;
        // Same source as the last import and no world edit since: nothing to
        // compare. Placement and the compendium source link must still match.
        const sourceUnchanged = !!(plan.sourceHash && target && marker?.sourceHash === plan.sourceHash
            && marker.hash === beforeHash && (before.folder ?? null) === (target.folder ?? null)
            && (plan.data._stats?.compendiumSource === undefined
                || plan.data._stats.compendiumSource === before._stats?.compendiumSource));
        if (existing) {
            let projected = target ?? {...plan.data, folder: before.folder,
                ownership: plan.ownership ?? plan.data.ownership ?? {default: 0, [game.user.id]: 3},
                ...(plan.type === 'Scene' ? {active: before.active} : {})};
            if (plan.type === 'Actor') projected = keepWorldWounds(projected, before);
            plan.changes = sourceUnchanged ? {patch: null, collections: [], changed: false}
                : documentChanges(existing, projected, before);
            if (plan.type === 'Actor') keepAutomaticEffects(plan.changes, before);
            if (!sourceUnchanged && plan.type === 'Actor' && automaticActorNoop(plan.changes, before, projected, marker, automaticActorValues(existing))) {
                plan.changes = {patch: null, collections: [], changed: false};
                automaticUnchanged++;
            }
        }
        if (sourceUnchanged) sourceUnchangedCount++;
        if (existing && target && !plan.changes.changed) {
            plan.comparedHash = beforeHash;
            if (plan.type === 'Actor') plan.comparedBaseline = actorBaselineValues(before);
            if (plan.type === 'Scene') {
                // Always the current format, so older markers do not linger.
                plan.comparedSceneHash = await sceneDigest(before);
            }
            skippedPlans.push(plan);
            continue;
        }
        writePlans.push(plan);
        if (!existing) continue;
        const hash = beforeHash;
        plan.comparedHash = hash;
        const unchanged = marker?.hash && (hash === marker.hash || (!marker.hashVersion
            && await digest(comparable(before, {legacy: true})) === marker.hash));
        const sameRuntimeActivation = marker?.hash && hash !== marker.hash && plan.type === 'Scene' && typeof before.active === 'boolean'
            && (marker.hash === await digest({...before, active: !before.active}) || (!marker.hashVersion
                && marker.hash === await digest(comparable({...before, active: !before.active}, {legacy: true}))));
        const automaticChanges = !unchanged && plan.type === 'Actor' && !plan.mixed
            ? await automaticActorBaseline(before, plan.data, marker, automaticActorValues(existing)) : null;
        const automaticScene = !unchanged && plan.type === 'Scene'
            && await automaticSceneChange(before, target, marker);
        const warning = !!(plan.mixed || (marker?.hash ? !unchanged && !sameRuntimeActivation && !automaticChanges && !automaticScene : !legacyMatches(before, plan.data, plan.raw ?? plan.originalSource?.())));
        if (warning) changed.push(plan.data.name ?? existing.name);
        if (warning || inspectOnly) {
            const details = inspectDocumentWrite(existing, target ?? plan.data, rootUpdate, Math.min(160, diagnosticBudget), plan.changes, before);
            diagnosticBudget -= details.changes.length;
            diagnostics.push({id: plan.id, type: plan.type,
            name: plan.data.name ?? existing.name, module: plan.record?.module ?? plan.module,
            sourceUuid: plan.record?.uuid ?? marker?.sourceUuid ?? null,
            warning, reason: automaticScene ? 'automaticScene' : automaticChanges ? 'automatic' : !warning ? 'source' : plan.mixed ? 'mixed' : marker?.hash ? 'baseline' : 'legacy',
            automaticChanges: automaticChanges ?? [],
            expectedHash: marker?.hash ?? null, currentHash: hash, hashVersion: marker?.hashVersion ?? null,
            targetResolved: !!target, referencesOnly: !!plan.referencesOnly,
            ...details});
        }
    }
    const plannedWrites = {rootWrites: 0, embeddedCreates: 0, embeddedUpdates: 0, embeddedDeletes: 0};
    for (const plan of writePlans) for (const [key, count] of Object.entries(changeCounts(plan.changes))) plannedWrites[key] += count;
    progress.count?.({...plannedWrites, automaticUnchanged, sourceUnchanged: sourceUnchangedCount, checked: plans.length, unchanged: skippedPlans.length,
        create: writePlans.filter(plan => !collection(plan.type).has(plan.id)).length,
        update: writePlans.filter(plan => collection(plan.type).has(plan.id)).length, delete: deleting.length});
    progress.stage?.('sprawdzenie folderów');
    const handlers = new Map(), changedFolderPacks = new Set();
    const sourcePacks = new Set(plans.filter(plan => !plan.referencesOnly).map(plan => plan.record?.pack ?? plan.pack));
    for (const packId of sourcePacks) {
        const pack = game.packs.get(packId);
        if (!pack) continue;
        const moduleId = moduleOf(pack);
        const packPlans = plans.filter(plan => !plan.referencesOnly && (plan.record?.pack ?? plan.pack) === packId);
        const needsPlacement = packPlans.some(plan => !plan.current || !plan.preserveFolder
            || (plan.currentFolder && !game.folders.has(plan.currentFolder)));
        const ownsFolders = values(game.folders).some(folder => folder.type === pack.documentName && sourceFlag(folder) === moduleId);
        // Existing documents can intentionally live at world root or in a
        // private folder. Do not recreate empty book roots on every update.
        if (!needsPlacement && !ownsFolders) continue;
        await progress('Sprawdzanie układu folderów…', 0.46);
        const handler = handlers.get(moduleId) ?? new WarhammerModuleContentHandler(game.modules.get(moduleId));
        handlers.set(moduleId, handler);
        const folderIds = packPlans.map(plan => plan.sourceFolder).filter(Boolean);
        if (!handler.folderChangesRequired || await handler.folderChangesRequired(pack, {folderIds})) changedFolderPacks.add(packId);
    }
    progress.count?.({folderPacks: changedFolderPacks.size});
    lastInspection = {time: Date.now(), inspectOnly, modules: requests.map(request => request.module.id),
        summary: {...sources.counts, referenceChecked, referenceCandidates, ...plannedWrites, automaticUnchanged,
            sourceUnchanged: sourceUnchangedCount, checked: plans.length, unchanged: skippedPlans.length, create: writePlans.filter(plan => !collection(plan.type).has(plan.id)).length,
            update: writePlans.filter(plan => collection(plan.type).has(plan.id)).length, delete: deleting.length, folderPacks: changedFolderPacks.size},
        documents: diagnostics};
    if (diagnostics.length) console.info('WFRP PL | Diagnostyka planu przed zapisem', clone(lastInspection));
    sources.current();
    if (inspectOnly) return clone(lastInspection);
    if (changed.length && !await foundry.applications.api.DialogV2.confirm({
        window: {title: 'Zmiany w istniejącej zawartości'},
        content: `<p>Wykryto różnice wymagające zatwierdzenia (${changed.length}). Rozwiń nazwę dokumentu, aby zobaczyć planowane zmiany. Przed zapisem zachowam kopię bezpieczeństwa całej operacji.</p><ul style="max-height: min(45vh, 24rem); overflow-y: auto;">${inspectionHtml(lastInspection)}</ul><p>Kontynuować?</p>`,
        yes: {label: 'Zaktualizuj i zachowaj kopię'}, no: {label: 'Anuluj'}
    })) return false;
    sources.current();

    // A user may edit a page while preparation or the confirmation dialog is
    // open. Do not record that new edit as an unchanged importer baseline.
    for (const plan of plans) await assertPlanCurrent(plan);

    // Remember legacy/metadata-only imports too, without backing up identical
    // document payloads. A genuine no-op keeps the previous Undo snapshot.
    for (const plan of skippedPlans) await rememberPlan(state, plan, plan.comparedHash);
    const registry = clone(state); delete registry.backup; delete registry.pending;
    const registryChanged = JSON.stringify(registry) !== JSON.stringify(storedRegistry);
    const initializationChanged = requests.some(request => request.mode === 'delete'
        || (request.mode === 'initialize' && !initialized(request.module.id)));
    if (!writePlans.length && !deleting.length && !changedFolderPacks.size && !initializationChanged) {
        // Repair bookkeeping without replacing the Undo of the last content
        // operation with an empty full-world snapshot.
        if (registryChanged) await saveState(state);
        ui.notifications.info(`Brak zmian. Sprawdzono ${plans.length} dokumentów; kopia poprzedniej operacji pozostaje dostępna.`);
        return true;
    }

    progress.stage?.('kopia bezpieczeństwa');
    const folderWork = changedFolderPacks.size > 0 || deleting.length > 0
        || requests.some(request => request.mode === 'initialize')
        || writePlans.some(plan => !collection(plan.type).has(plan.id) || plan.folderUnresolved || Object.hasOwn(plan.changes?.patch ?? {}, 'folder'));
    const beforeKeys = new Set();
    const snapshot = {modules: [...new Set([...requests.map(r => r.module.id),
        ...plans.map(plan => plan.record?.module ?? plan.module)].filter(Boolean))], before: [], created: [],
        folderMode: folderWork ? 'full' : 'dependencies',
        folders: folderWork ? values(game.folders).map(dataOf) : [], placements: [], initialized: {},
        packPlacements: folderWork ? values(game.packs).map(pack => ({id: pack.collection, folder: pack.folder?.id ?? null})) : [],
        registry: originalRegistry, time: Date.now()};
    if (folderWork) for (const [type] of Object.entries(TYPES)) for (const doc of values(collection(type))) {
        snapshot.placements.push({type, id: doc.id, folder: doc.folder?.id ?? doc.folder ?? null});
    }
    for (const plan of [...writePlans, ...deleting]) {
        await progress('Przygotowywanie kopii bezpieczeństwa…', 0.49);
        const key = `${plan.type}:${plan.id}`;
        if (beforeKeys.has(key)) continue;
        beforeKeys.add(key);
        const current = collection(plan.type).get(plan.id);
        if (current) snapshot.before.push({type: plan.type, id: plan.id, data: dataOf(current)});
        else snapshot.created.push({type: plan.type, id: plan.id});
    }
    if (!folderWork) {
        const needed = new Set();
        for (const saved of snapshot.before) {
            let id = saved.data.folder;
            while (id && !needed.has(id)) {
                needed.add(id);
                const folder = game.folders.get(id);
                if (!folder) break;
                snapshot.folders.push(dataOf(folder));
                id = folder.folder?.id ?? folder.folder ?? null;
            }
        }
    }
    for (const request of requests) snapshot.initialized[request.module.id] = initialized(request.module.id);
    // Journal once before the first mutation. It contains all planned document
    // IDs, including not-yet-created aliases, so recovery also survives a reload.
    const snapshotPointer = await storeSnapshot(snapshot, state.backup, progress);
    sources.current();
    // Compression/settings writes yield to other clients. Verify only targets
    // about to be changed again, before publishing pending or mutating content.
    for (const plan of writePlans) await assertPlanCurrent(plan);
    state.pending = snapshotPointer;
    await saveState(state);
    writingActors = true;
    try {
        progress.stage?.('foldery');
        const folderPacks = new Set([...changedFolderPacks,
            ...writePlans.filter(p => !p.referencesOnly && !comparableTarget(p)).map(p => p.record?.pack ?? p.pack)]);
        for (const packId of folderPacks) {
            await progress('Przygotowywanie katalogów zawartości…', 0.56);
            const pack = game.packs.get(packId);
            if (!pack) continue;
            const moduleId = moduleOf(pack);
            const handler = handlers.get(moduleId) ?? new WarhammerModuleContentHandler(game.modules.get(moduleId));
            handlers.set(moduleId, handler);
            const folderPlans = plans.filter(p => !p.referencesOnly && (p.record?.pack ?? p.pack) === packId);
            game.babele?.translatePackFolders?.(pack);
            // Organized once for all involved books after the writes below.
            await handler.createFolders(pack, {folderIds: folderPlans.map(p => p.sourceFolder).filter(Boolean), organize: false});
        }
        let index = 0;
        progress.stage?.('zapis');
        for (const plan of writePlans) {
            await progress(`Zapis zmian ${++index}/${writePlans.length}: ${plan.data.name ?? plan.id}`, 0.6 + 0.38 * index / Math.max(writePlans.length, 1));
            const target = collection(plan.type);
            const current = target.get(plan.id);
            const data = clone(plan.data);
            if (plan.preserveFolder && plan.current && (!plan.currentFolder || game.folders.has(plan.currentFolder))) data.folder = plan.currentFolder;
            else if (plan.referencesOnly && plan.current) data.folder = plan.current.folder?.id ?? plan.current.folder ?? null;
            else if (!plan.referencesOnly) {
                const projected = comparableTarget(plan);
                const packId = plan.record?.pack ?? plan.pack;
                const handler = handlers.get(plan.record?.module ?? plan.module);
                const sourceFolder = game.folders.get(plan.sourceFolder);
                const ownFolder = sourceFolder && (plan.type !== 'Actor'
                    || folderModule(plan.sourceFolder) === (plan.record?.module ?? plan.module));
                data.folder = projected ? projected.folder : ownFolder ? plan.sourceFolder : handler?.rootFolders[packId] ?? null;
            }
            if (plan.ownership) data.ownership = clone(plan.ownership);
            else data.ownership ??= {default: 0, [game.user.id]: 3};
            // Scene activation belongs to the world, not the source book. A
            // reimport must not deactivate the currently viewed map mid-update.
            if (plan.type === 'Scene' && current) data.active = current.active ?? dataOf(current).active;
            if (current) {
                // Folder IDs are the only late-bound part of the saved patch.
                const changes = copyUpdate(plan.changes);
                const beforeFolder = current.folder?.id ?? current.folder ?? null;
                if (beforeFolder !== (data.folder ?? null)) (changes.patch ??= {}).folder = data.folder ?? null;
                else if (changes.patch) delete changes.patch.folder;
                if (changes.patch && !Object.keys(changes.patch).length) changes.patch = null;
                await replaceDocument(current, data, true, changes);
            }
            else {
                await createWorldDocuments(plan.type, [data]);
                // Reconcile after creation hooks; do not leave optional default
                // items or generated embedded IDs in a source-faithful Actor.
                if (plan.type === 'Actor') await replaceDocument(target.get(plan.id), data);
            }
            if (plan.type === 'Actor' && plan.record) {
                const actor = target.get(plan.id);
                const actualIds = values(actor.items).map(idOf).sort();
                const expectedIds = (data.items ?? []).map(i => i._id).sort();
                if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) throw new Error(`Niezgodny zestaw elementów aktora ${data.name}.`);
            }
            await rememberPlan(state, plan);
        }
        for (const plan of deleting) {
            await progress(`Usuwanie zawartości: ${plan.data.name ?? plan.id}`, 0.99);
            await deleteWorldDocument(plan.type, plan.id);
            delete state.documents[`${plan.type}:${plan.id}`];
            for (const [uuid, entry] of Object.entries(state.variants)) if (entry.worldId === plan.id) delete state.variants[uuid];
        }
        for (const request of requests) {
            if (request.mode === 'delete') {
                state.excludedModules[request.module.id] = true;
                for (const [uuid, entry] of Object.entries(state.variants)) if (entry.module === request.module.id && !entry.retained) delete state.variants[uuid];
                for (const folder of foldersChildrenFirst()) {
                    if (sourceFlag(folder) === request.module.id && !folder.contents.length
                        && !values(game.folders).some(f => (f.folder?.id ?? f.folder) === folder.id)) await deleteWorldDocument('Folder', folder.id);
                }
            } else delete state.excludedModules[request.module.id];
            if (request.mode === 'initialize' || request.mode === 'delete') {
                await game.settings.set(request.module.id, 'initialized', request.mode !== 'delete');
            }
        }
        progress.stage?.('porządkowanie');
        await progress('Porządkowanie zawartości…', 0.99, true);
        const involvedModules = new Set([...requests.map(request => request.module.id),
            ...plans.map(plan => plan.record?.module ?? plan.module)].filter(Boolean));
        if (folderWork) for (const folder of foldersChildrenFirst()) {
            if (folder.type !== 'Compendium' && involvedModules.has(sourceFlag(folder))
                && !folder.contents.length
                && !values(game.folders).some(child => (child.folder?.id ?? child.folder) === folder.id)) {
                await deleteWorldDocument('Folder', folder.id);
            }
        }
        if (folderWork) {
            await game.wfrp4eCorePl?.contentOrganization?.consolidate?.([...involvedModules]);
            // managed: this operation is the folder writer, so the organizer must
            // not skip itself because a content operation is in progress.
            await game.wfrp4eCorePl?.contentOrganization?.organize({moduleIds: [...involvedModules], managed: true});
            ui.sidebar?.render?.();
        }
        delete state.pending;
        state.backup = snapshotPointer;
        await saveState(state);
        ui.notifications.info(`Zakończono: zapisano ${writePlans.length}, bez zmian ${skippedPlans.length}, usunięto ${deleting.length}. Zachowano kopię bezpieczeństwa.`);
        if (actorPlan.skipped.length) ui.notifications.warn(`Pominięto chronione postacie graczy lub walki: ${[...new Set(actorPlan.skipped)].join(', ')}.`);
        return true;
    } catch (error) {
        try {
            await progress('Błąd zapisu — przywracanie kopii bezpieczeństwa…', 0.99, true);
            await restoreSnapshot(snapshot, progress);
            await saveState({...snapshot.registry, backup: snapshotPointer});
        } catch (restoreError) {
            console.error('WFRP PL | Przywracanie przerwane', restoreError);
            ui.notifications.error('Nie udało się dokończyć przywracania. Kopia bezpieczeństwa pozostaje zapisana; użyj „Cofnij ostatnią operację”.', {permanent: true});
        }
        throw error;
    } finally {writingActors = false;}
}

export function runContentOperation(requests, progress, options = {}) {
    const normalized = requests.map(request => ({...request, settings: request.settings
        ?? Object.fromEntries(Object.values(TYPES).map(key => [key, true]))}));
    const task = queue.then(async () => {
        const report = operationProgress(progress);
        let outcome = 'błąd';
        try {const result = await execute(normalized, report, options); outcome = result ? 'ukończono' : 'anulowano'; return result;}
        finally {report.close(outcome);}
    });
    queue = task.catch(() => {});
    return task;
}

export function repairFolderDuplicates() {
    const task = queue.then(async () => {
        if (!enabled() || !game.user.isGM || (game.users.activeGM && game.users.activeGM.id !== game.user.id)) return;
        const organization = game.wfrp4eCorePl?.contentOrganization;
        const groups = organization?.duplicateRoots?.() ?? [];
        if (!groups.length) return;
        const state = loadState();
        // Never replace the recovery pointer of an interrupted content operation.
        if (state.pending) return;
        const progress = operationProgress();
        const snapshot = {modules: [...new Set(groups.map(roots => roots[0].flags?.['warhammer-lib']?.source
            ?? roots[0].flags?.['warhammer-lib']?.contentModule))], before: [], created: [], initialized: {},
            folders: values(game.folders).map(dataOf), placements: [],
            packPlacements: values(game.packs).map(pack => ({id: pack.collection, folder: pack.folder?.id ?? null})),
            registry: clone(state), time: Date.now()};
        for (const [type] of Object.entries(TYPES)) for (const document of values(collection(type))) {
            snapshot.placements.push({type, id: document.id, folder: document.folder?.id ?? document.folder ?? null});
        }
        let pointer;
        try {
            await progress('Scalanie folderów: zapisywanie kopii bezpieczeństwa…', 0.01, true);
            pointer = await storeSnapshot(snapshot, state.backup, progress);
            state.pending = pointer;
            await saveState(state);
            await progress('Scalanie folderów tej samej książki…', 0.6, true);
            const count = await organization.withFolderWrites(() => organization.consolidate());
            delete state.pending;
            state.backup = pointer;
            await saveState(state);
            ui.notifications.info(`Scalono nadmiarowe foldery: ${count}. Zachowano kopię — operację można cofnąć.`);
            return count;
        } catch (error) {
            if (pointer) {
                try {await restoreSnapshot(snapshot, progress); await saveState({...snapshot.registry, backup: pointer});}
                catch (restoreError) {console.error('WFRP PL | Przywracanie folderów przerwane', restoreError);}
            }
            throw error;
        } finally {progress.close();}
    });
    queue = task.catch(() => {});
    return task;
}

export async function undoLastOperation() {
    const task = queue.then(async () => {
        if (!enabled() || !game.user.isGM || (game.users.activeGM && game.users.activeGM.id !== game.user.id)) return;
        const state = loadState(), pointer = state.pending ?? state.backup;
        if (!pointer) return ui.notifications.info('Brak zapisanej operacji do cofnięcia.');
        if (!await foundry.applications.api.DialogV2.confirm({window: {title: 'Cofnij ostatnią operację'},
            content: '<p>Przywrócić dokumenty do stanu sprzed ostatniej operacji? Późniejsze zmiany w tych dokumentach zostaną zastąpione kopią bezpieczeństwa.</p>',
            yes: {label: 'Przywróć kopię'}, no: {label: 'Anuluj'}})) return;
        const progress = operationProgress();
        try {
            await progress('Wczytywanie kopii przerwanej operacji…', 0.01, true);
            const snapshot = await readSnapshot(pointer);
            // An interrupted undo must remain recoverable and block new writes.
            state.pending = pointer;
            await saveState(state);
            await restoreSnapshot(snapshot, progress);
            await progress('Przywracanie rejestru zawartości…', 0.99, true);
            await saveState(snapshot.registry);
            ui.notifications.info('Przywrócono stan sprzed ostatniej operacji.');
        } catch (error) {
            console.error('WFRP PL | Nie udało się przywrócić kopii operacji', error);
            throw error;
        } finally {progress.close();}
    });
    queue = task.catch(() => {});
    return task;
}

function install() {
    if (typeof WarhammerModuleContentHandler === 'undefined') return;
    const prototype = WarhammerModuleContentHandler.prototype;
    if (prototype[PATCH]) return;
    for (const method of ['initialize', 'update', 'delete']) {
        const original = prototype[method];
        prototype[method] = function(settings) {
            if (!managedModule(this.module)) return original.apply(this, arguments);
            return runContentOperation([{module: this.module, mode: method, settings}]).catch(error => {
                console.error('WFRP PL | Operacja zawartości nie powiodła się', error);
                ui.notifications.error(error.message, {permanent: true});
                return false;
            });
        };
    }
    Object.defineProperty(prototype, PATCH, {value: true});
}

const lifecycleApi = {run: runContentOperation, undo: undoLastOperation, repairFolders: repairFolderDuplicates,
    inspect: requests => runContentOperation(requests, undefined, {inspectOnly: true}),
    get lastInspection() {return lastInspection ? clone(lastInspection) : null;},
    get status() {return operationStatus ? {...operationStatus} : null;},
    get lastOperation() {return lastOperation ? clone(lastOperation) : null;},
    get strictActorImport() {return writingActors;}};
function exposeApi() {
    game.wfrp4eCorePl ??= {};
    game.wfrp4eCorePl.contentLifecycle = lifecycleApi;
}
exposeApi();
Hooks.once('init', () => {
    // ES modules initially see Foundry's temporary game object. Publish again
    // after it has been replaced by the real Game instance.
    exposeApi();
    game.settings.register(scope(), KEY, {scope: 'world', config: false, type: Object, default: {schema: 1}});
    install();
});
Hooks.once('ready', () => {
    exposeApi();
    install();
    if (enabled() && game.user.isGM && loadState().pending) {
        ui.notifications.warn('Poprzedni import został przerwany. Otwórz inicjalizację modułów i użyj „Cofnij ostatnią operację”.', {permanent: true});
    }
    const actors = game.actors;
    if (!actors || actors[PATCH]) return;
    const original = actors.importDocument;
    actors.importDocument = async function(document, options = {}) {
        const module = document.pack && game.modules.get(document.pack.split('.')[0]);
        if (!managedModule(module) || options.wfrp4ePrivateCopy) return original.call(this, document, options);
        const succeeded = await runContentOperation([{module, mode: 'update', actorIds: [document.id], settings: {actors: true}}]);
        const source = actorSource(document.uuid);
        const entry = source && loadState().variants[source.uuid];
        return succeeded && entry ? this.get(entry.worldId) : null;
    };
    Object.defineProperty(actors, PATCH, {value: true});
});
Hooks.on('preCreateActor', (actor, data, options) => {
    if (!enabled() || options.wfrp4eContentLifecycle || !variantFlag(actor)) return;
    // Foundry's Duplicate action produces a private copy, never another managed
    // endpoint carrying the original variant's ownership marker.
    actor.updateSource({[`flags.${SCOPE}.-=actorVariant`]: null,
        [`flags.${SCOPE}.privateCopy`]: true, 'flags.warhammer-lib.-=source': null});
});
Hooks.on('renderWarhammerModuleInitializationV2', (app, element) => {
    if (!enabled() || !game.user.isGM) return;
    const root = element?.[0] ?? element;
    const instructions = root?.querySelector('.initializer .instructions');
    if (!instructions || instructions.querySelector('.wfrp4e-undo-content')) return;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'wfrp4e-undo-content';
    button.textContent = 'Cofnij ostatnią operację';
    button.style.cssText = 'display:inline-flex;width:auto;margin-left:1em;padding:2px 10px';
    button.disabled = !loadState().backup && !loadState().pending;
    button.addEventListener('click', () => undoLastOperation().then(() => app.render()).catch(error => ui.notifications.error(error.message)));
    (instructions.querySelector('p:last-child') ?? instructions).append(button);
});
