/**
 * Folder Compatibility & V14 Runtime Helpers for WFRP4e Polish Translation
 *
 * 1. ActiveEffect Model schema compatibility (V14)
 *    - Extends ActiveEffectTypeDataModel schema to prevent #verifyActiveEffectModels error
 *      in Foundry V14.367+ without requiring changes to warhammer-lib.
 *
 * 2. Compendium Folder Pre-Creation Translation
 *    - Intercepts preCreateFolder to ensure folders imported from compendia
 *      (e.g. via native importAll) receive translated Polish names in _source.name
 *      before being saved to the world database.
 *
 * 3. Runtime Folder Translation & Sidebar Refresh
 *    - Resolves nested/tree folders (such as Trappings, Core Rulebook) that contain
 *      no direct documents and translates them in memory upon world load / reload (F5).
 *    - Re-renders sidebar directory tabs so translated folder names are immediately visible.
 */

const MODULE_ID = "wfrp4e-core-pl";
const INITIALIZED = Symbol.for(`${MODULE_ID}.folderCompatibility`);

if (!globalThis[INITIALIZED]) {
    globalThis[INITIALIZED] = true;
    initFolderCompatibility();
}

export function initFolderCompatibility() {
    // --- 1. ActiveEffect Schema Compatibility (V14) ---
    function patchActiveEffectSchema() {
        if (game.release?.generation < 14) return;
        const model = CONFIG.ActiveEffect?.dataModels?.base;
        if (model && !model.schema?.fields?.changes && foundry.data?.ActiveEffectTypeDataModel) {
            try {
                model.schema.extendFields(foundry.data.ActiveEffectTypeDataModel.defineSchema());
            } catch (err) {
                console.warn(`${MODULE_ID} | Nie udało się rozszerzyć schematu ActiveEffect:`, err);
            }
        }
    }

    Hooks.on("init", patchActiveEffectSchema);
    Hooks.on("i18nInit", patchActiveEffectSchema);
    if (typeof CONFIG !== "undefined" && CONFIG.ActiveEffect?.dataModels?.base) {
        patchActiveEffectSchema();
    }

    // --- 2. Helper Functions for Folder Translation ---
    function findSourceCollectionForFolder(folder, visited = new Set()) {
        if (!folder || visited.has(folder.id)) return null;
        visited.add(folder.id);

        // A. Direct sourceId on folder
        const directSourceId = folder._stats?.compendiumSource ?? folder.flags?.core?.sourceId;
        if (directSourceId) {
            const match = String(directSourceId).match(/^Compendium\.([^.]+\.[^.]+)\./);
            if (match) return match[1];
        }

        // B. Direct match in compendium pack folders
        const folderId = folder.id ?? folder._id;
        if (folderId && game.packs) {
            for (const pack of game.packs) {
                if (folder.type && pack.documentName && folder.type !== pack.documentName) continue;
                if (pack.folders?.has(folderId)) {
                    return pack.collection;
                }
            }
        }

        // C. Direct contents of the folder
        for (const entry of folder.contents ?? []) {
            const sourceId = entry._stats?.compendiumSource ?? entry.flags?.core?.sourceId;
            if (sourceId) {
                const match = String(sourceId).match(/^Compendium\.([^.]+\.[^.]+)\./);
                if (match) return match[1];
            }
        }

        // D. Recursive check on child folders (subfolders)
        const allFolders = game.folders ?? game.collections?.get("Folder");
        if (allFolders && folderId) {
            const children = allFolders.filter(f => (f.folder?.id === folderId || f.folder === folderId));
            for (const child of children) {
                const col = findSourceCollectionForFolder(child, visited);
                if (col) return col;
            }
        }

        // E. Check parent folder in world
        const parentId = folder.folder?.id ?? folder.folder;
        if (parentId && allFolders) {
            const parent = allFolders.get(parentId);
            if (parent && !visited.has(parent.id)) {
                const col = findSourceCollectionForFolder(parent, visited);
                if (col) return col;
            }
        }

        return null;
    }

    function getTranslatedFolderName(originalName, collection) {
        if (!originalName) return null;

        // 1. If we have a source collection, check its MappedCompendium in Babele
        if (collection && game.babele) {
            const session = game.babele._session || game.babele;
            const mappedCompendium = session?.mappedCompendiums?.get?.(collection);
            if (mappedCompendium) {
                const payload = typeof mappedCompendium.folderTranslations === "function"
                    ? mappedCompendium.folderTranslations()
                    : (mappedCompendium.folders || {});
                if (payload?.[originalName]) {
                    return payload[originalName];
                }
            }

            // Check if pack.folders in memory already has the translated name
            const pack = game.packs?.get(collection);
            if (pack?.folders) {
                for (const pf of pack.folders) {
                    if ((pf.originalName === originalName || pf.name === originalName) && pf.name && pf.name !== originalName) {
                        return pf.name;
                    }
                }
            }

            // Check package-level _packs-folders for this package
            const packageName = collection.split(".")[0];
            const packFolderTranslations = session?.packFolderTranslations;
            if (packFolderTranslations) {
                const packagePack = packFolderTranslations.get?.(`${packageName}._packs-folders`);
                if (packagePack?.entries?.[originalName]) {
                    return packagePack.entries[originalName];
                }
            }
        }

        // 2. Check all _packs-folders translations in Babele
        const allTranslations = game.babele?.folderTranslations?._packFolderTranslations?.()?.allTranslations?.()
            ?? game.babele?._session?.packFolderTranslations?.allTranslations?.();
        if (allTranslations?.[originalName]) {
            return allTranslations[originalName];
        }

        // 3. Search all game.packs for a folder matching originalName
        if (game.packs) {
            for (const pack of game.packs) {
                if (!pack.folders?.size) continue;
                for (const pf of pack.folders) {
                    if (pf.originalName === originalName && pf.name && pf.name !== originalName) {
                        return pf.name;
                    }
                }
            }
        }

        return null;
    }

    function renderSidebarTab(type) {
        const tabMap = {
            Item: "items",
            RollTable: "tables",
            Actor: "actors",
            Scene: "scenes",
            JournalEntry: "journal"
        };
        const tabName = tabMap[type] || (type ? type.toLowerCase() : null);
        if (!tabName) return;
        const tab = ui.sidebar?.tabs?.[tabName];
        if (tab?.rendered) {
            tab.render();
        }
    }

    // --- 3. Pre-Creation Hook (Database Persistence) ---
    Hooks.on("preCreateFolder", (folder, data, options, userId) => {
        // Only handle world folders (pack is falsy or null)
        if (folder.pack) return;

        const collection = findSourceCollectionForFolder(folder);
        const originalName = folder.name || data?.name;
        const translatedName = getTranslatedFolderName(originalName, collection);

        if (translatedName && translatedName !== originalName) {
            folder.updateSource({ name: translatedName });
            if (data) {
                data.name = translatedName;
            }
        }
    });

    // --- 4. Runtime Tree Translation & UI Refresh (F5 / Existing Worlds) ---
    function translateWorldFolderTree() {
        const allFolders = game.folders ?? game.collections?.get("Folder");
        if (!allFolders?.size) return;

        let anyChanged = false;
        const changedTypes = new Set();

        allFolders.forEach((folder) => {
            const originalName = folder.originalName ?? folder.name;
            const collection = findSourceCollectionForFolder(folder);
            const translatedName = getTranslatedFolderName(originalName, collection);

            if (translatedName && translatedName !== folder.name) {
                folder.originalName = originalName;
                folder.name = translatedName;
                anyChanged = true;
                if (folder.type) changedTypes.add(folder.type);
            }
        });

        if (anyChanged) {
            for (const type of changedTypes) {
                renderSidebarTab(type);
            }
        }
    }

    // Execute translation on babele.ready and standard ready
    Hooks.on("babele.ready", () => {
        translateWorldFolderTree();
    });

    Hooks.once("ready", () => {
        // Fallback in case babele.ready already fired or was skipped
        setTimeout(() => translateWorldFolderTree(), 100);
    });
}
