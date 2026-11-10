// Shared classification for world folders and compendiums; the initializer stays flat.
const MODULE_ID = import.meta.url.match(/modules\/([^/]+)/)?.[1] ?? "wfrp4e-core-pl";
const GROUPS = [
    {id: "basic", name: "01. Podstawowe", color: "#40566d"},
    {id: "adventures", name: "02. Przygody", color: "#7b3535"},
    {id: "supplements", name: "03. Dodatki", color: "#715629"},
    {id: "places", name: "04. Miasta i krainy", color: "#386449"},
    {id: "enemy-within", name: "05. Wewnętrzny Wróg", color: "#38005e"}
];
const ENEMY = ["wfrp4e-eis", "wfrp4e-dotr", "wfrp4e-pbtt", "wfrp4e-horned-rat", "wfrp4e-empire-ruins"];
// Keep Adventure as a separate level. Skaven is a sibling of Introduction,
// allowing category/book/adventure/chapter to remain within four levels.
const SOURCE_FOLDER_LAYOUTS = {
    'wfrp4e-horned-rat.actors': {
        dbonrSBd687KHcXe: {folder: '1CvASy6WGnzN0ssY', sort: 100001}
    }
};
const MODULE_GROUPS = Object.fromEntries([
    ...["wfrp4e", "wfrp4e-core", "wfrp4e-starter-set", "wfrp4e-gm-toolkit"].map(id => [id, "basic"]),
    ...["wfrp4e-rnhd", "wfrp4e-ua1", "wfrp4e-ua2", "wfrp4e-ua3"].map(id => [id, "adventures"]),
    ...["wfrp4e-altdorf", "wfrp4e-middenheim", "wfrp4e-salzenmund", "wfrp4e-lustria", "wfrp4e-soc", "wfrp4e-owb3"].map(id => [id, "places"]),
    ...ENEMY.map(id => [id, "enemy-within"]),
    ...["wfrp4e-eis-maps", "wfrp4e-dotr-maps"].map(id => [id, "enemy-within"])
]);
const parentId = folder => folder?.folder?.id ?? folder?.folder ?? folder?._source?.folder ?? null;
const values = collection => Array.from(collection ?? []);
const flags = folder => folder?.flags?.["warhammer-lib"] ?? {};
const ownedBy = folder => flags(folder).source ?? flags(folder).contentModule;
const enabled = () => game.i18n?.lang === "pl";
const canWrite = () => enabled() && game.user?.isGM
    && (!game.users?.activeGM || game.users.activeGM.id === game.user.id);
// Foundry 14 initializes Folder#color as a Color object, never a CSS string.
const sameColor = (color, css) => (color?.css ?? color ?? null) === (css ?? null);
function category(moduleId) {
    if (!moduleId || (moduleId !== "wfrp4e" && !moduleId.startsWith("wfrp4e-"))) return null;
    if (/^wfrp4e-core-pl(?:-|$)/u.test(moduleId)) return null;
    return GROUPS.find(group => group.id === (MODULE_GROUPS[moduleId] ?? "supplements"));
}
function isRoot(folder, moduleId) {
    if (ownedBy(folder) !== moduleId) return false;
    // A compendium's Adventure/Companion/chapter folders are never the book
    // container, even when an older import has lost their world ancestors.
    if (values(game.packs).some(pack => (pack.metadata?.packageName ?? pack.collection?.split('.')[0]) === moduleId
        && (pack.documentName ?? pack.metadata?.type) === folder.type
        && (pack.folders?.has?.(folder.id) ?? values(pack.folders).some(source => (source.id ?? source._id) === folder.id)))
        && !(flags(folder).contentRoot === true && flags(folder).contentRootSource === folder.id)) return false;
    const seen = new Set([folder.id]);
    for (let id = parentId(folder); id && !seen.has(id);) {
        seen.add(id);
        const parent = game.folders.get(id);
        if (ownedBy(parent) === moduleId) return false;
        id = parentId(parent);
    }
    return true;
}

const protectedActor = document => document.documentName === 'Actor'
    && (document.hasPlayerOwner || document.inCombat || document.flags?.['wfrp4e-core-pl']?.privateCopy || values(game.combats).some(combat =>
        values(combat.combatants).some(combatant => combatant.actorId === document.id || combatant.actor?.id === document.id)));
function folderDocuments(folder) {
    // Folder.contents can be a cached directory-tree array. Read authoritative
    // document placements, including immediately after a move and before redraw.
    const collection = game.collections?.get?.(folder.type) ?? game.collections?.[folder.type];
    return values(collection ?? folder.contents).filter(document => parentId(document) === folder.id);
}
// createFolders names folders copied from a compendium using that pack's own
// catalog, the single source of truth. Renaming them from the package catalog
// made both disagree and recreated folder work on every update. A source folder
// adopted as the book root keeps its package-level root name.
function sourcePackFolder(folder, moduleId) {
    if (flags(folder).contentRootSource === folder.id) return false;
    return values(game.packs).some(pack => (pack.metadata?.packageName ?? pack.collection?.split('.')[0]) === moduleId
        && (pack.documentName ?? pack.metadata?.type) === folder.type
        && (pack.folders?.has?.(folder.id) ?? values(pack.folders).some(source => (source.id ?? source._id) === folder.id)));
}
function chooseRoot(roots) {
    return [...roots].sort((a, b) =>
        Number(flags(b).contentRootSource === b.id) - Number(flags(a).contentRootSource === a.id)
        || Number(folderDocuments(b).some(protectedActor)) - Number(folderDocuments(a).some(protectedActor))
        || Number(flags(b).contentRoot === true) - Number(flags(a).contentRoot === true)
        || (a._stats?.createdTime ?? 0) - (b._stats?.createdTime ?? 0)
        || a.id.localeCompare(b.id))[0];
}
function duplicateRoots(moduleIds = null) {
    const allowed = moduleIds ? new Set(moduleIds) : null, groups = new Map();
    for (const folder of values(game.folders)) {
        const moduleId = ownedBy(folder);
        if (!category(moduleId) || (allowed && !allowed.has(moduleId)) || !isRoot(folder, moduleId)) continue;
        const key = `${folder.type}:${moduleId}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(folder);
    }
    return [...groups.values()].filter(roots => roots.length > 1);
}
async function mergeModuleRoot(source, target) {
    if (!source || !target || source.id === target.id) return;
    if (source.type !== target.type || !ownedBy(source) || ownedBy(source) !== ownedBy(target)) {
        throw new Error('Nie można scalać folderów pochodzących z różnych modułów lub typów dokumentów.');
    }
    // A protected Actor keeps its exact folder ID. Retain its container beneath
    // the book rather than moving the Actor or deleting its Folder document.
    if (folderDocuments(source).some(protectedActor) || flags(source).contentRootSource === source.id) {
        if (parentId(source) !== target.id) await source.update({folder: target.id});
        return;
    }
    for (const document of folderDocuments(source)) {
        const invoke = () => document.update({folder: target.id}, {
            wfrp4eContentLifecycle: true, skipDeletingItems: true, diff: true, recursive: true
        });
        const context = game.wfrp4eCorePl?.sourceImport?.withActorContext;
        if (context && document.documentName === 'Actor') await context([document.id], invoke);
        else await invoke();
        if (parentId(document) !== target.id) throw new Error(`Nie przeniesiono dokumentu „${document.name}”.`);
    }
    for (const child of values(game.folders)) if (parentId(child) === source.id) {
        if (child.id === target.id) throw new Error('Scalenie folderów utworzyłoby cykl.');
        await child.update({folder: target.id});
        if (parentId(child) !== target.id) throw new Error(`Nie przeniesiono folderu „${child.name}”.`);
    }
    for (const pack of values(game.packs)) if (pack.folder?.id === source.id) await pack.setFolder(target.id);
    if (folderDocuments(source).length || values(game.folders).some(child => parentId(child) === source.id)
        || values(game.packs).some(pack => pack.folder?.id === source.id)) throw new Error('Folder źródłowy nadal zawiera zawartość; scalenie przerwano.');
    await CONFIG.Folder.documentClass.deleteDocuments([source.id], {deleteSubfolders: false, deleteContents: false});
    if (game.folders.has(source.id)) throw new Error('Foundry nie usunęło pustego duplikatu folderu.');
}
async function consolidate(moduleIds = null) {
    let count = 0;
    for (const roots of duplicateRoots(moduleIds)) {
        const target = chooseRoot(roots);
        for (const source of roots) if (source.id !== target.id && game.folders.has(source.id)) {
            await mergeModuleRoot(source, target); count++;
        }
    }
    return count;
}

function folderLayout(pack, {folderIds = null} = {}) {
    if (!enabled()) return undefined;
    const sourceFolders = values(pack.folders).map(folder => folder.toObject());
    const byId = new Map(sourceFolders.map(folder => [folder._id, folder]));
    // Some official packs refer to a package root which is not stored in the
    // pack. That external ID denotes the book root, not a missing subfolder.
    for (const folder of sourceFolders) if (folder.folder && !byId.has(folder.folder)) folder.folder = null;
    const overrides = SOURCE_FOLDER_LAYOUTS[pack.collection] ?? {};
    for (const folder of sourceFolders) if (overrides[folder._id]) Object.assign(folder, overrides[folder._id]);
    const paths = new Map(), roots = new Set();
    for (const folder of sourceFolders) {
        let current = folder, depth = 0, root = folder._id;
        const seen = new Set();
        while (current) {
            if (seen.has(current._id)) throw new Error(`Cykl folderów źródłowych w ${pack.collection}: ${current.name}.`);
            seen.add(current._id); root = current._id; depth++;
            current = byId.get(current.folder);
        }
        paths.set(folder._id, {root, depth}); roots.add(root);
    }
    const moduleId = pack.metadata?.packageName ?? pack.collection?.split('.')[0];
    const categoryDepth = enabled() && category(moduleId) ? 1 : 0;
    const maximum = globalThis.CONST?.FOLDER_MAX_DEPTH ?? 4;
    let rootSourceId = null;
    if ([...paths.values()].some(path => path.depth + categoryDepth + 1 > maximum)) {
        // Reuse the deepest source root as the book container. Its ID and all
        // descendants survive, without adding a fifth level above that branch.
        rootSourceId = [...roots].sort().find(id => [...paths.values()]
            .every(path => path.depth + categoryDepth + (path.root === id ? 0 : 1) <= maximum));
        if (!rootSourceId) throw new Error(`Hierarchia ${pack.collection} nie mieści się w ${maximum} poziomach przy zachowaniu folderów źródłowych.`);
    }
    const required = folderIds === null ? null : new Set(folderIds);
    if (required) {
        if (rootSourceId) required.add(rootSourceId);
        for (const id of required) {
            const parent = byId.get(id)?.folder;
            if (parent) required.add(parent);
        }
    }
    return {sourceFolders, rootSourceId, sortedFolderIds: Object.keys(overrides),
        folders: sourceFolders.filter(folder => !required || required.has(folder._id))};
}
const creating = new Map();
async function categoryFolder(moduleId, type) {
    const group = category(moduleId);
    if (!enabled() || !group) return null;
    const key = `${type}:${group.id}`;
    if (creating.has(key)) return creating.get(key);
    const operation = (async () => {
        const candidates = values(game.folders).filter(folder => folder.type === type);
        // Prefer the established category over a legacy campaign container,
        // regardless of their database order, so a second category is not made.
        let folder = candidates.find(folder => flags(folder).contentCategory === group.id)
            ?? candidates.find(folder => !parentId(folder) && folder.name === group.name)
            ?? (group.id === "enemy-within" ? candidates.find(folder => !parentId(folder)
                && (flags(folder).campaign === "enemy-within"
                    || ["Wewnętrzny Wróg", "The Enemy Within"].includes(folder.originalName ?? folder.name))) : null);
        const data = {name: group.name, type, folder: null, sorting: "m", sort: (GROUPS.indexOf(group) + 1) * 100000,
            color: group.color, flags: {"warhammer-lib": {contentCategory: group.id,
                ...(group.id === "enemy-within" ? {campaign: "enemy-within"} : {})}}};
        if (folder) delete folder.originalName;
        if (!folder) [folder] = await CONFIG.Folder.documentClass.create([data]);
        else if (folder.name !== data.name || parentId(folder) || flags(folder).contentCategory !== group.id
            || !sameColor(folder.color, group.color) || folder.sort !== data.sort
            || folder.sorting !== data.sorting) await folder.update(data);
        return folder;
    })();
    creating.set(key, operation);
    try {return await operation;} finally {creating.delete(key);}
}
const catalogs = new Map();
async function folderCatalog(moduleId) {
    if (!catalogs.has(moduleId)) catalogs.set(moduleId, (async () => {
        try {
            const response = await fetch(`modules/${MODULE_ID}/compendium/${moduleId}._packs-folders.json`);
            return response.ok ? (await response.json()).entries ?? {} : {};
        } catch {return {};}
    })());
    return catalogs.get(moduleId);
}
async function moduleName(moduleId) {
    const module = game.modules.get(moduleId);
    const original = module?.flags?.folder?.name ?? module?.title?.replace(/^WFRP4e\s*[-–]\s*/u, "") ?? moduleId;
    const entries = await folderCatalog(moduleId);
    return moduleId === "wfrp4e" ? "Zasoby systemu" : entries[original] ?? original;
}
function inheritedModule(folder) {
    const seen = new Set();
    while (folder && !seen.has(folder.id)) {
        seen.add(folder.id);
        if (ownedBy(folder)) return ownedBy(folder);
        folder = game.folders.get(parentId(folder));
    }
    return null;
}
function moduleOrder(moduleId) {
    const archiveVolume = ["wfrp4e-archives1", "wfrp4e-archives2", "wfrp4e-archives3"].indexOf(moduleId);
    if (archiveVolume >= 0) return (archiveVolume + 1) * 100000;
    const normalized = moduleId.replace(/-maps$/u, "");
    const index = ENEMY.indexOf(normalized);
    return index < 0 ? null : (index + 1) * 100000;
}
let worldOrganization = Promise.resolve();
let folderWrites = 0;
async function withFolderWrites(invoke) {
    folderWrites++;
    try {
        await worldOrganization;
        return await invoke();
    } finally {folderWrites--;}
}
function organizeWorldFolders({managed = false, moduleIds = null} = {}) {
    const run = async () => {
        if (!managed && (folderWrites || game.wfrp4eCorePl?.contentLifecycle?.status)) return;
        return organizeWorldFoldersNow(moduleIds);
    };
    const task = worldOrganization.then(run);
    worldOrganization = task.catch(() => {});
    return task;
}
async function organizeWorldFoldersNow(moduleIds = null) {
    if (!canWrite()) return;
    for (const folder of values(game.folders)) {
        if (!game.folders.has(folder.id) || folder.type === "Compendium") continue;
        const moduleId = inheritedModule(folder);
        if (moduleIds && !moduleIds.includes(moduleId)) continue;
        if (!category(moduleId)) continue;
        const patch = {};
        // Use only the owning module's catalog, and persist the translated name.
        // Do not depend on Babele's lazy pack loading or overwrite custom names.
        const storedName = folder._source?.name ?? folder.name;
        const entries = await folderCatalog(moduleId);
        const name = entries[storedName] ?? entries[folder.name];
        if (typeof name === "string" && (name !== storedName || name !== folder.name)
            && !sourcePackFolder(folder, moduleId)) patch.name = name;
        if (!isRoot(folder, moduleId)) {
            if (Object.keys(patch).length) await folder.update(patch);
            continue;
        }
        const parent = await categoryFolder(moduleId, folder.type);
        if (parentId(folder) !== parent.id) patch.folder = parent.id;
        const order = moduleOrder(moduleId);
        if (order && folder.sort !== order) patch.sort = order;
        if (Object.keys(patch).length) await folder.update(patch);
    }
    // Remove only obsolete, explicitly marked campaign containers that are
    // empty after their module roots moved. Keep every content folder and ID.
    if (moduleIds && !moduleIds.some(id => category(id)?.id === 'enemy-within')) return;
    for (const folder of values(game.folders)) {
        if (flags(folder).campaign !== "enemy-within" || flags(folder).contentCategory
            || ownedBy(folder) || parentId(folder) || typeof folder.delete !== "function") continue;
        const canonical = values(game.folders).find(other => other.type === folder.type
            && flags(other).contentCategory === "enemy-within");
        if (!canonical || !Array.isArray(folder.contents) || folder.contents.length
            || values(game.folders).some(child => parentId(child) === folder.id)
            || values(game.packs).some(pack => pack.folder?.id === folder.id)) continue;
        await folder.delete({deleteSubfolders: false, deleteContents: false});
    }
}
async function moduleFolder(moduleId, type) {
    const key = `module:${type}:${moduleId}`;
    if (creating.has(key)) return creating.get(key);
    const operation = createModuleFolder(moduleId, type);
    creating.set(key, operation);
    try {return await operation;} finally {creating.delete(key);}
}
async function createModuleFolder(moduleId, type) {
    const existing = values(game.folders).find(folder => folder.type === type && isRoot(folder, moduleId));
    if (existing) return existing;
    const parent = await categoryFolder(moduleId, type);
    if (!parent) return null;
    const sourceKey = type === "Compendium" ? "contentModule" : "source";
    const [folder] = await CONFIG.Folder.documentClass.create([{
        name: await moduleName(moduleId), type, folder: parent.id, sorting: "m", sort: moduleOrder(moduleId) ?? 0,
        color: game.modules.get(moduleId)?.flags?.folder?.color ?? parent.color,
        flags: {"warhammer-lib": {[sourceKey]: moduleId}}
    }]);
    return folder;
}
async function organizeCompendiums(moduleIds = null, managed = false) {
    if (!canWrite()) return;
    const modules = new Map();
    for (const pack of values(game.packs)) {
        const moduleId = pack.metadata?.packageName ?? pack.metadata?.package ?? pack.collection?.split(".")[0];
        if (moduleIds && !moduleIds.includes(moduleId)) continue;
        if (!category(moduleId)) continue;
        if (moduleId !== "wfrp4e" && !game.modules.get(moduleId)?.active) continue;
        if (!modules.has(moduleId)) modules.set(moduleId, []);
        modules.get(moduleId).push(pack);
    }
    for (const [moduleId, packs] of modules) {
        const parent = await categoryFolder(moduleId, "Compendium");
        const expected = new Set([await moduleName(moduleId), game.modules.get(moduleId)?.flags?.folder?.name]
            .filter(name => typeof name === 'string' && name.length));
        // Infer old unmarked containers only from their own packs, before those
        // packs move. A matching private name alone is not module provenance.
        for (const pack of packs) {
            const seen = new Set();
            for (let folder = pack.folder; folder && !seen.has(folder.id); folder = game.folders.get(parentId(folder))) {
                seen.add(folder.id);
                if (!ownedBy(folder) && !flags(folder).contentCategory
                    && (expected.has(folder.name) || expected.has(folder.originalName))
                    && !values(game.packs).some(other => other.folder?.id === folder.id && !packs.includes(other))) {
                    await folder.update({'flags.warhammer-lib.contentModule': moduleId});
                }
            }
        }
        const roots = values(game.folders).filter(folder => folder.type === "Compendium" && isRoot(folder, moduleId));
        let root = chooseRoot(roots);
        if (managed && root) for (const duplicate of roots) {
            if (duplicate.id !== root.id) await mergeModuleRoot(duplicate, root);
        }
        if (!root) {
            for (const pack of packs) {
                const seen = new Set();
                for (let folder = pack.folder; folder && !seen.has(folder.id); folder = game.folders.get(parentId(folder))) {
                    seen.add(folder.id);
                    if (expected.has(folder.name) || expected.has(folder.originalName)) root = folder;
                }
                if (root) break;
            }
        }
        root ??= await moduleFolder(moduleId, "Compendium");
        const patch = {};
        const storedName = root._source?.name ?? root.name;
        const entries = await folderCatalog(moduleId);
        const name = entries[storedName] ?? entries[root.name];
        if (typeof name === "string" && (name !== storedName || name !== root.name)) patch.name = name;
        if (parentId(root) !== parent.id) patch.folder = parent.id;
        if (flags(root).contentModule !== moduleId) patch["flags.warhammer-lib.contentModule"] = moduleId;
        const order = moduleOrder(moduleId);
        if (order && root.sort !== order) patch.sort = order;
        if (Object.keys(patch).length) await root.update(patch);
        for (const pack of packs) {
            const seen = new Set();
            let inside = false;
            for (let folder = pack.folder; folder && !seen.has(folder.id); folder = game.folders.get(parentId(folder))) {
                seen.add(folder.id);
                if (folder.id === root.id) {inside = true; break;}
            }
            // Duplicate-root pack placements are changed only by the backed-up
            // consolidation transaction, so Undo retains their original paths.
            if (!inside && values(game.folders).filter(folder => folder.type === 'Compendium'
                && isRoot(folder, moduleId)).length < 2) await pack.setFolder(root.id);
        }
    }
}
let organizing;
async function organize({moduleIds = null, managed = false} = {}) {
    // An unmanaged pass skips itself during a content operation, so it cannot
    // stand in for the managed pass requested by that operation.
    if (organizing && (!managed || organizing.managed)
        && (!organizing.moduleIds || (moduleIds && moduleIds.every(id => organizing.moduleIds.includes(id))))) return organizing.promise;
    const previous = organizing;
    const current = {moduleIds, managed, promise: null};
    current.promise = (async () => {
        if (previous) await previous.promise.catch(() => {});
        await organizeWorldFolders({moduleIds, managed});
        await organizeCompendiums(moduleIds, managed);
    })();
    organizing = current;
    try {return await current.promise;} finally {if (organizing === current) organizing = null;}
}
const organizationApi = {
    groups: GROUPS, category, isModuleRoot: isRoot, folderLayout,
    parentFor: async (moduleId, type) => (await categoryFolder(moduleId, type))?.id ?? null,
    organize, organizeWorldFolders, withFolderWrites, chooseRoot, mergeModuleRoot, duplicateRoots, consolidate
};
function exposeOrganizationApi() {
    game.wfrp4eCorePl ??= {};
    game.wfrp4eCorePl.contentOrganization = organizationApi;
}
exposeOrganizationApi();
Hooks.once('init', exposeOrganizationApi);

// Folders are organized only at the end of an initialization/update/delete
// operation, for the modules it involved. No pass runs at startup or after
// unrelated folder creation; a book's layout is repaired by updating it.
for (const type of ["Actor", "Item", "JournalEntry", "Scene", "RollTable", "Macro", "Playlist", "Cards", "Adventure"]) {
    Hooks.on(`create${type}`, async (document, options) => {
        if (!canWrite() || options?.wfrp4eContentLifecycle
            || document.flags?.["wfrp4e-core-pl"]?.privateCopy || document.pack || document.folder) return;
        const uuid = document._stats?.compendiumSource ?? document.flags?.core?.sourceId;
        const moduleId = document.flags?.["warhammer-lib"]?.source ?? uuid?.match(/^Compendium\.([^.]+)\./u)?.[1];
        if (!category(moduleId)) return;
        try {
            const folder = await moduleFolder(moduleId, type);
            if (folder) await document.update({folder: folder.id});
        } catch (error) {console.error(`${MODULE_ID} | Grupowanie importu ${type}`, error);}
    });
}
