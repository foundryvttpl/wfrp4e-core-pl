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
    function findSourceCollectionForFolder(folder) {
        if (!folder) return null;

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

        return null;
    }

    // --- 3. Pre-Creation Hook (Database Persistence) ---
    Hooks.on("preCreateFolder", (folder, data, options, userId) => {
        // Only handle world folders (pack is falsy or null)
        if (game.i18n?.lang !== "pl" || folder.pack || options?.wfrp4eContentLifecycle) return;

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

    // --- 5. Compendium Window Folder Translation ---
    function translateCompendiumApp(app, html) {
        if (game.i18n?.lang !== "pl") return;
        const pack = app?.collection ?? (typeof app?.metadata?.id === "string" ? app : null);
        if (!pack) return;

        if (pack.folders) {
            game.babele?.translatePackFolders?.(pack);
        }

        const root = html instanceof HTMLElement ? html : (html?.[0] instanceof HTMLElement ? html[0] : (app?.element instanceof HTMLElement ? app.element : null));
        if (!root) return;

        const folderElements = root.querySelectorAll(".folder");
        folderElements.forEach(folderEl => {
            const folderId = folderEl.dataset?.folderId;
            const header = folderEl.querySelector(".folder-header h3, .folder-name");
            if (!header) return;

            let originalName = header.textContent.trim();
            const packFolder = folderId && pack.folders ? pack.folders.get(folderId) : null;
            if (packFolder) {
                if (packFolder.name && packFolder.name !== packFolder.originalName) {
                    header.textContent = packFolder.name;
                    return;
                }
                originalName = packFolder.originalName || packFolder.name;
            }

            const translatedName = getTranslatedFolderName(originalName, pack.collection);
            if (translatedName && translatedName !== originalName) {
                header.textContent = translatedName;
                if (packFolder) {
                    packFolder.originalName = originalName;
                    packFolder.name = translatedName;
                }
            }
        });
    }

    Hooks.on("renderCompendium", (app, html) => {
        translateCompendiumApp(app, html);
    });

    Hooks.on("renderCompendiumCollection", (app, html) => {
        translateCompendiumApp(app, html);
    });
}
