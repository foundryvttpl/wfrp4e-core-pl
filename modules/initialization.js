function activeCorePlModuleId() {
    return game.wfrp4eCorePl?.MODULE_ID
        ?? (game.modules.get("wfrp4e-core-pl")?.active ? "wfrp4e-core-pl" : "wfrp4e-core-pl");
}

function activeCorePlModulePath() {
    return game.wfrp4eCorePl?.MODULE_PATH ?? `modules/${activeCorePlModuleId()}`;
}

Hooks.on("init", () => {
	CONFIG.supportedLanguages["pl"] = "Polski";
    if (game.data?.packs) {
        game.data.packs = game.data.packs.filter(i => i.name != "basic" || i.system != "wfrp4e");
    }
});

WarhammerModuleInitializationV2.initialize = async function (ev, target) {
    let key = target.closest("[data-module]").dataset.module;
    let module = game.modules.get(key);
    const moduleTitle = premiumModuleTitle(key, module.title);
    let dialogContent = game.i18n.format("WH.Initializer.DialogContent", {title : moduleTitle, description : module.description});
    const packLines = await Promise.all(module.flags.initializationPacks.map(async p =>
    {
        let pack = game.packs.get(p);
        if (!pack) {
            return `<li>${p}: ${game.i18n.localize("WH.Initializer.Tooltips.NotInstalled")}</li>`;
        }
        await pack.getIndex();
        return `<li>${pack.metadata.type}: ${pack.index.size} </li>`;
    }));
    const authors = Array.from(module.authors || []);
    const authorNames = authors.slice(0, Math.max(authors.length - 1, 0)).map(i => i.name).join(", ");
    dialogContent += `
    <ul>
    ${packLines.join("")}
    </ul>
    <hr>
    ${systemConfig().copyrightText.replace("@AUTHORS@", authorNames)}
    `;
    if (await foundry.applications.api.DialogV2.confirm({window: {title : `${game.i18n.localize("WH.Initialize")} ${moduleTitle}`}, content : dialogContent, classes : ["initialization"]}))
    {
        try {
            const completed = await new WarhammerModuleContentHandler(module).initialize();
            if (completed) {
                await game.settings.set(key, "initialized", true);
                ui.notifications.info(`${moduleTitle}: ${game.i18n.localize("WH.Initialization.Complete")}`);
            }
        }
        catch(error) {
            console.error(`Could not initialize ${module.title}`, error);
            ui.notifications.error(`${moduleTitle}: inicjalizacja nie powiodła się. Szczegóły w konsoli.`);
        }
    }
}
WarhammerModuleInitializationV2.DEFAULT_OPTIONS.actions.initialize = WarhammerModuleInitializationV2.initialize;

const originalDeleteModuleContent = WarhammerModuleInitializationV2.DEFAULT_OPTIONS.actions.delete;
const deletingModuleContent = new Set();
WarhammerModuleInitializationV2.delete = async function(ev, target) {
    const key = target.closest("[data-module]").dataset.module;
    const module = game.modules.get(key);
    const managed = game.system?.id === "wfrp4e" && game.i18n?.lang === "pl"
        && game.wfrp4eCorePl?.contentLifecycle && module?.id?.startsWith("wfrp4e-")
        && (module.protected || Object.hasOwn(game.wfrp4e?.config?.premiumModules ?? {}, key));
    if (!managed) return originalDeleteModuleContent.call(this, ev, target);
    if (!game.user?.isGM || deletingModuleContent.has(key)) return false;
    deletingModuleContent.add(key);
    try {
        const title = premiumModuleTitle(key, module.title);
        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: {title: game.i18n.format("WH.Initializer.DeleteModuleContent", {module: title})},
            content: game.i18n.format("WH.Initializer.DeleteModuleContentDesc", {module: title}),
            classes: ["initialization"]
        });
        if (!confirmed) return false;
        const completed = await new WarhammerModuleContentHandler(module).delete();
        // Await the operation before refreshing the tile and its three actions.
        // A rejected/cancelled deletion must keep the initialized state visible.
        if (completed && this.rendered) await this.render();
        return completed;
    } catch (error) {
        console.error(`Could not delete content of ${key}`, error);
        ui.notifications.error(error.message, {permanent: true});
        return false;
    } finally {deletingModuleContent.delete(key);}
};
WarhammerModuleInitializationV2.DEFAULT_OPTIONS.actions.delete = WarhammerModuleInitializationV2.delete;

// warhammer-lib 3.3.4 catches errors for each initialization pack and then
// reports success to the caller. Make the result explicit so a cancelled or
// partially failed import is never marked as initialized.
if (!WarhammerModuleContentHandler.prototype._wfrp4eCorePlFailFastInitialization) {
    WarhammerModuleContentHandler.prototype.initialize = async function() {
        const packList = this.module.flags.initializationPacks || [];
        if (this.hasExistingInitialization(packList)) {
            const proceed = await foundry.applications.api.DialogV2.confirm({
                content: game.i18n.localize("WH.Initialization.ExistingContentMessage")
            });
            if (!proceed) {
                return false;
            }
        }

        for (const packId of packList) {
            const pack = game.packs.get(packId);
            if (!pack) {
                throw new Error(`Initialization pack not found: ${packId}`);
            }
            const documents = await pack.getDocuments();
            // Loading documents activates the mapped Babele compendium. Apply
            // its complete `folders` catalog before copying the folder tree to
            // the world; otherwise English names become persisted permanently.
            game.babele?.translatePackFolders?.(pack);
            await this.createFolders(pack);
            const documentName = documents[0]?.documentName;
            if (!documentName) {
                continue;
            }

            const targets = {
                Actor: [game.actors, "WH.Initialization.Actors"],
                Item: [game.items, "WH.Initialization.Items"],
                JournalEntry: [game.journal, "WH.Initialization.Journals"],
                RollTable: [game.tables, "WH.Initialization.Tables"],
                Scene: [game.scenes, "WH.Initialization.Scenes"],
            };
            const target = targets[documentName];
            if (!target) {
                throw new Error(`Unsupported initialization document type: ${documentName}`);
            }
            // Jeden zbiorczy komunikat na paczkę zamiast komunikatu o każdym dokumencie.
            const createdCount = documents.filter(document => !target[0].has(document.id)).length;
            const existingCount = documents.length - createdCount;
            await this.createOrUpdateDocuments(documents, target[0]);
            ui.notifications.info(game.i18n.format("WH.Initialization.PackSummary", {
                module: premiumModuleTitle(this.module.id, this.module.title),
                type: game.i18n.localize(target[0].documentClass.metadata.labelPlural),
                created: createdCount,
                updated: existingCount,
            }));
            const missingDocumentIds = documents
                .map(document => document.id)
                .filter(documentId => !target[0].has(documentId));
            if (missingDocumentIds.length) {
                throw new Error(
                    `${this.module.id}: ${documentName} initialization is incomplete; `
                    + `${missingDocumentIds.length} documents are missing from the world. `
                    + `Examples: ${missingDocumentIds.slice(0, 5).join(", ")}`
                );
            }
        }
        return true;
    };
    WarhammerModuleContentHandler.prototype._wfrp4eCorePlFailFastInitialization = true;
}

function normalizeFolderName(name) {
    if (!name || typeof name !== "string") return "";
    return name
        .toLowerCase()
        .replace(/[:.,_]/g, " ")
        .replace(/\bvolume\b/g, "vol")
        .replace(/\bvol\s*([0-9ivxlcdm]+)\b/g, (_m, num) => {
            const romanMap = { i: "1", ii: "2", iii: "3", iv: "4", v: "5" };
            return `vol ${romanMap[num] ?? num}`;
        })
        .replace(/\s+/g, " ")
        .trim();
}

// warhammer-lib's default _addData() calls updateSource() on the live document
// returned by CompendiumCollection#getDocuments(). Preparing a WFRP Actor can
// then add missing system effects, which Foundry correctly rejects because the
// source compendium is locked. Build plain world-import data instead and never
// mutate or prepare the compendium document itself.
if (!WarhammerModuleContentHandler.prototype._wfrp4eCorePlSafePackCloning) {
    WarhammerModuleContentHandler.prototype._addData = function(documents) {
        const folders = worldFolders();
        return documents.map(document => {
            const data = foundry.utils.deepClone(document.toObject());
            const packId = typeof document.pack === "string"
                ? document.pack
                : document.pack?.collection ?? document.pack?.metadata?.id;
            const pack = game.packs?.get?.(packId);
            const folderId = data.folder?.id ?? data.folder;
            const folderExists = folderId && (pack?.folders?.has?.(folderId) || folders.get?.(folderId));

            if (!folderExists) {
                const initializationFolder = findInitializationFolderName(data);
                data.folder = (initializationFolder ? this._wfrp4eCorePlInitializationFolders?.[packId]?.[initializationFolder] : null)
                    ?? this.rootFolders[packId]
                    ?? null;
            }
            data.flags ??= {};
            foundry.utils.setProperty(data.flags, "warhammer-lib.source", this.module.id);
            return data;
        });
    };
    WarhammerModuleContentHandler.prototype._wfrp4eCorePlSafePackCloning = true;
}

// Some official packs (notably Ubersreik Adventures I and II) do not carry
// Foundry folder ids. Their documents instead provide a logical
// `initialization-folder` flag. Preserve that grouping by creating/resolving
// the named child folder and using it for both new and existing documents.
function findInitializationFolderName(data) {
    if (typeof data?.initialization_folder === "string" && data.initialization_folder.trim()) {
        return data.initialization_folder.trim();
    }
    if (typeof data?.["initialization-folder"] === "string" && data["initialization-folder"].trim()) {
        return data["initialization-folder"].trim();
    }
    const flags = data?.flags ?? {};
    for (const namespace of Object.values(flags)) {
        const name = namespace?.["initialization-folder"] ?? namespace?.["initialization_folder"];
        if (typeof name === "string" && name.trim()) {
            return name.trim();
        }
    }
    return null;
}

const folderTranslationCatalogs = new Map();
const packFolderTranslationCatalogs = new Map();
const worldFolders = () => game.folders ?? game.collections?.get?.("Folder") ?? [];
const parentFolderId = folder => folder.folder?.id ?? folder.folder ?? folder._source?.folder ?? null;
const folderSource = folder => folder.getFlag?.("warhammer-lib", "source")
    ?? foundry.utils.getProperty(folder, "flags.warhammer-lib.source");

const translatedRootName = async (pack, originalName) => {
    if (game.i18n?.lang !== "pl" || !originalName) {
        return originalName;
    }
    const packId = pack?.metadata?.id ?? (typeof pack === "string" ? pack : null);
    const packageName = pack?.metadata?.packageName ?? pack?.metadata?.package ?? (packId ? packId.split('.')[0] : null);
    if (!packageName) {
        return originalName;
    }
    if (!folderTranslationCatalogs.has(packageName)) {
        folderTranslationCatalogs.set(packageName, (async () => {
            try {
                const response = await fetch(`${activeCorePlModulePath()}/compendium/${packageName}._packs-folders.json`);
                if (!response.ok) {
                    return {};
                }
                return (await response.json())?.entries ?? {};
            }
            catch (_error) {
                return {};
            }
        })());
    }
    const entries = await folderTranslationCatalogs.get(packageName);
    if (entries[originalName]) return entries[originalName];
    const lower = originalName.toLowerCase();
    for (const [k, v] of Object.entries(entries)) {
        if (k.toLowerCase() === lower) return v;
    }
    const norm = normalizeFolderName(originalName);
    for (const [k, v] of Object.entries(entries)) {
        if (normalizeFolderName(k) === norm) return v;
    }
    if (COMMON_FOLDER_TRANSLATIONS[originalName]) return COMMON_FOLDER_TRANSLATIONS[originalName];
    for (const [k, v] of Object.entries(COMMON_FOLDER_TRANSLATIONS)) {
        if (k.toLowerCase() === lower || normalizeFolderName(k) === norm) return v;
    }
    return originalName;
};

const ENEMY_WITHIN_MODULES = new Set([
    "wfrp4e-eis",
    "wfrp4e-dotr",
    "wfrp4e-pbtt",
    "wfrp4e-horned-rat",
    "wfrp4e-empire-ruins",
    "wfrp4e-eis-maps",
    "wfrp4e-dotr-maps",
]);

const ENEMY_WITHIN_FOLDER_COLOR = "#38005e";

const COMMON_FOLDER_TRANSLATIONS = {
    // Up in Arms
    "Hireling Profiles": "Wzorce najemników",
    "Up In Arms": "Pod Bronią",
    // Winds of Magic
    "Dramatis Personae": "Dramatis Personae",
    "Elementals": "Żywiołaki",
    "Familiar": "Chowańce",
    "Nemeses": "Nemezis",
    "Winds of Magic": "Wiatry Magii",
    // Imperial Zoo
    "The First Expedition": "Pierwsza Wyprawa",
    "The Second Expedition": "Druga Wyprawa",
    "The Third Expedition": "Trzecia Wyprawa",
    "Pre-Generated Characters": "Gotowe postacie",
    "Pregens": "Gotowe postacie",
    "The Imperial Zoo": "Imperialny Zwierzyniec",
    // Rough Nights & Hard Days
    "A Day at the Trials": "Dzień Ciężkiego Wymiaru Sprawiedliwości",
    "A Day At The Trials": "Dzień Ciężkiego Wymiaru Sprawiedliwości",
    "A Night at the Opera": "Niespokojna noc w Operze",
    "A Night At The Opera": "Niespokojna noc w Operze",
    "A Rough Night at the Three Feathers": "Ciężka noc w \"Gospodzie Pod Trzema Piórami\"",
    "A Rough Night At The Three Feathers": "Ciężka noc w \"Gospodzie Pod Trzema Piórami\"",
    "Lord of Ubersreik": "Władca Ubersreiku",
    "Nastassia's Wedding": "Ślub Nastassi",
    "Rough Nights & Hard Days": "Ciężkie Dnie i Niespokojne Noce",
    "RNHD Items": "Wyposażenie",
    // Ubersreik Adventures I & II
    "Ubersreik Adventures I": "Przygody w Ubersreiku I",
    "Ubersreik Adventures 1": "Przygody w Ubersreiku I",
    "Ubersreik Adventures Vol. 1": "Przygody w Ubersreiku I",
    "Ubersreik Adventures Vol 1": "Przygody w Ubersreiku I",
    "Ubersreik Adventures II": "Przygody w Ubersreiku II",
    "Ubersreik Adventures 2": "Przygody w Ubersreiku II",
    "Ubersreik Adventures  II": "Przygody w Ubersreiku II",
    "Ubersreik Adventures Vol. 2": "Przygody w Ubersreiku II",
    "Ubersreik Adventures Vol 2": "Przygody w Ubersreiku II",
    "Bait and Witch": "Przynęta i Zaklęcie",
    "Slaughter in Spittlefeld": "Jatka w Spittlefeld",
    "The Guilty Party": "Winna Strona",
    "Heart of Glass": "Serce ze Szkła",
    "The Mad Men of Gotheim": "Szaleńcy z Gotheim",
    "If Looks Could Kill": "Gdyby wzrok mógł zabijać",
    "Deadly Dispatch": "Śmiertelna przesyłka",
    "Fishrook Returns": "Rybowron powraca",
    "Double Trouble": "Zdublowane tarapaty",
    "The Blessings That Drew Blood": "Błogosławieństwo, które przelało krew",
    "The Blessings that Drew Blood": "Błogosławieństwo, które przelało krew",
    "The Grey Mountain Gold": "Złoto Gór Szarych",
    "A Guide to Black Rock": "Przewodnik po Czarnej Skale",
    // Archives of the Empire Vol. I
    "Archives of the Empire Vol. I": "Archiwa Imperium Tom I",
    "Archives of the Empire Vol. 1": "Archiwa Imperium Tom I",
    "Archives of the Empire Vol 1": "Archiwa Imperium Tom I",
    "Archives of the Empire Volume 1": "Archiwa Imperium Tom I",
    "Archives of the Empire: Vol 1": "Archiwa Imperium Tom I",
    "Archives of the Empire: Vol 1.": "Archiwa Imperium Tom I",
    "Archives of the Empire: Vol. 1": "Archiwa Imperium Tom I",
    "Archives of the Empire: Vol. I": "Archiwa Imperium Tom I",
    "Archives of the Empire: Vol I": "Archiwa Imperium Tom I",
    "Archives of the Empire: Volume 1": "Archiwa Imperium Tom I",
    "Archiwa Imperium Tom I": "Archiwa Imperium Tom I",
    "Archiwa Imperium Tom 1": "Archiwa Imperium Tom I",
    "Archives of the Empire": "Archiwa Imperium",
    "Dwarfs of the Empire": "Krasnoludy Imperium",
    "Wood Elves of the Laurelorn": "Leśne Elfy z Laurelornu",
    "Halflings of the Moot": "Niziołki z Krainy Zgromadzenia",
    // Lustria
    "Lustria": "Lustria",
    "Lustrian Adventures": "Przygody w Lustrii",
    // Starter Set
    "Starter Set": "Zestaw Startowy",
    "Making the Rounds": "Robiąc obchód",
    "Red Moon Burning": "Płonący Czerwony Księżyc",
    "Unions & Reunions": "Unie i pojednania",
    "Ubersreik NPCs": "BN-i z Ubersreiku",
    "Two Wrongs Make A Right": "Dwa zła dają jedno dobro",
    "Da Lit'lest Waaagh!": "Najmłodszy Waaagh!",
    "Old Blue Eyes Is Back!": "Błękitnooki powraca!",
    "Blood & Snow": "Krew i śnieg",
    "Memories of Blood": "Wspomnienia krwi",
    "The Riddle of Silver": "Zagadka srebra",
    "A Guide to Ubersreik": "Przewodnik po Ubersreiku",
    "Guide to Ubersreik": "Przewodnik po Ubersreiku",
    "Adventure Book": "Księga Przygód",
    // Enemy in Shadows
    "Enemy in Shadows": "Wróg w Cieniach",
    "Enemy In Shadows": "Wróg w Cieniach",
    "The Enemy Within": "Wewnętrzny Wróg",
    "Chapter 1 - Wanted: Bold Adventurers": "Rozdział 1 - Poszukiwani: Odważni Awanturnicy",
    "Chapter 2 - Mistaken Identity": "Rozdział 2 - Pomylona Tożsamość",
    "Chapter 3 - Heart of the Empire": "Rozdział 3 - W Sercu Imperium",
    "Chapter 4 - On To Bögenhafen": "Rozdział 4 - W drodze do Bögenhafen …",
    "Chapter 6 - The Schaffenfest": "Rozdział 6 - Schaffenfest",
    "Chapter 7 - Into The Darkness": "Rozdział 7 - W Ciemność",
    "Chapter 8 - Chasing Shadows": "Rozdział 8 - W pogoni za Cieniami",
    "Chapter 9 - The Darkest Hour": "Rozdział 9 - Najczarniejsza godzina",
    "Town Troublemakers": "Miejscy mąciciele",
    "Road Riffraff": "Szumowiny z traktu",
    "On The Road": "Na drodze",
    "Road Wardens": "Strażnicy dróg",
    "Daemons": "Demony",
    "The Pandemonium Carnival": "Piekielny karnawał",
    "The Affair of the Hidden Jewel": "Sprawa zaginionego klejnotu",
    "Adventure": "Przygoda",
    "Companion": "Niezbędnik",
    "Appendices": "Dodatki",
    "Bögenhafen": "Bögenhafen",
    // Core
    "Core Rulebook": "Podręcznik Podstawowy",
    "Rules": "Zasady",
    // Inne kategorie i pakiety
    "Weapons": "Broń",
    "Armour": "Pancerz",
    "Ammunition": "Amunicja",
    "Trappings": "Wyposażenie",
    "Trappingcs": "Wyposażenie",
    "Careers": "Kariery",
    "Skills": "Umiejętności",
    "Talents": "Talenty",
    "Traits": "Cechy",
    "Spells": "Czary",
    "Prayers": "Modlitwy",
    "Blessings": "Błogosławieństwa",
    "Diseases": "Choroby",
    "Injuries": "Rany",
    "Mutations": "Mutacje",
    "Psychologies": "Psychologia",
    "Criticals": "Trafienia Krytyczne",
    "Hireling": "Najemnik",
    "Job": "Praca",
    "Mounts and Vehicles": "Wierzchowce i pojazdy",
    "Vehicles": "Pojazdy",
    "Mounts": "Wierzchowce",
};

const translatedPackFolderName = async (pack, originalName) => {
    if (game.i18n?.lang !== "pl" || !originalName) {
        return originalName;
    }
    const packId = pack?.metadata?.id ?? (typeof pack === "string" ? pack : null);
    if (!packId) {
        return originalName;
    }
    const getFoldersFromPackId = async (id) => {
        if (!packFolderTranslationCatalogs.has(id)) {
            packFolderTranslationCatalogs.set(id, (async () => {
                try {
                    const response = await fetch(`${activeCorePlModulePath()}/compendium/${id}.json`);
                    if (!response.ok) {
                        return {};
                    }
                    return (await response.json())?.folders ?? {};
                }
                catch (_error) {
                    return {};
                }
            })());
        }
        return await packFolderTranslationCatalogs.get(id);
    };

    const folders = await getFoldersFromPackId(packId);
    if (folders[originalName]) return folders[originalName];
    const lower = originalName.toLowerCase();
    const norm = normalizeFolderName(originalName);
    for (const [k, v] of Object.entries(folders)) {
        if (k.toLowerCase() === lower || normalizeFolderName(k) === norm) return v;
    }

    // Fallback 1: sprawdź inne paczki tego samego modułu (np. actors, journals, scenes)
    const packageName = pack?.metadata?.packageName ?? pack?.metadata?.package ?? packId.split('.')[0];
    const candidatePacks = [`${packageName}.actors`, `${packageName}.journals`, `${packageName}.scenes`];
    for (const cand of candidatePacks) {
        if (cand === packId || !game.packs.has(cand)) continue;
        const candFolders = await getFoldersFromPackId(cand);
        if (candFolders[originalName]) return candFolders[originalName];
        for (const [k, v] of Object.entries(candFolders)) {
            if (k.toLowerCase() === lower || normalizeFolderName(k) === norm) return v;
        }
    }

    // Fallback 2: uniwersalny słownik znanych nazw folderów
    if (COMMON_FOLDER_TRANSLATIONS[originalName]) return COMMON_FOLDER_TRANSLATIONS[originalName];
    for (const [k, v] of Object.entries(COMMON_FOLDER_TRANSLATIONS)) {
        if (k.toLowerCase() === lower || normalizeFolderName(k) === norm) return v;
    }

    return originalName;
};

const mergeRootFolder = async (source, target) => {
    if (!source || !target || source.id === target.id) {
        return;
    }
    if (game.wfrp4eCorePl?.contentOrganization?.mergeModuleRoot) {
        if (!folderSource(source) || folderSource(source) !== folderSource(target)) return;
        return game.wfrp4eCorePl.contentOrganization.mergeModuleRoot(source, target);
    }
    for (const document of Array.from(source.contents ?? [])) {
        await document.update({folder: target.id});
    }
    for (const child of Array.from(worldFolders())) {
        if (parentFolderId(child) === source.id) {
            await child.update({folder: target.id});
        }
    }
    await CONFIG.Folder.documentClass.deleteDocuments([source.id]);
};

if (!WarhammerModuleContentHandler.prototype._wfrp4eCorePlInitializationFolderRouting) {
    const createOrUpdateDocuments = WarhammerModuleContentHandler.prototype.createOrUpdateDocuments;

    WarhammerModuleContentHandler.prototype.createOrUpdateDocuments = async function(documents, collection) {
        const packId = typeof documents[0]?.pack === "string"
            ? documents[0].pack
            : documents[0]?.pack?.collection ?? documents[0]?.pack?.metadata?.id;
        const pack = game.packs?.get?.(packId) ?? packId;
        const rootFolderId = this.rootFolders[packId];
        const documentType = documents[0]?.documentName;
        const folders = worldFolders();

        // Routing wg flagi `initialization-folder` dotyczy WYŁĄCZNIE dokumentów, które:
        // 1) Nie mają przypisanego folderu w compendium, ALBO
        // 2) Ich przypisany folder nie istnieje w strukturze folderów compendium ani świata.
        // Dokumenty posiadające prawidłowy folder z compendium są już zorganizowane
        // we właściwej przetłumaczonej strukturze utworzonej przez createFolders.
        const documentsNeedingRouting = documents.filter(document => {
            const data = document.toObject?.() ?? document;
            const docFolder = data.folder?.id ?? data.folder;
            if (docFolder && (pack?.folders?.has?.(docFolder) || folders.get?.(docFolder))) {
                return false;
            }
            return true;
        });

        if (documentsNeedingRouting.length) {
            const folderNames = [...new Set(documentsNeedingRouting
                .map(document => findInitializationFolderName(document.toObject?.() ?? document))
                .filter(Boolean))];

            this._wfrp4eCorePlInitializationFolders ??= {};
            this._wfrp4eCorePlInitializationFolders[packId] ??= {};
            const resolvedFolders = this._wfrp4eCorePlInitializationFolders[packId];
            const rootFolder = folders.get?.(rootFolderId);
            const moduleFolderFlagName = this.module?.flags?.folder?.name;

            const isRootModuleFolder = async (raw, trans) => {
                if (!raw) return false;
                if (raw === moduleFolderFlagName || raw === this.module?.title || raw === this.module?.id) return true;
                const rawNorm = normalizeFolderName(raw);
                const moduleNorm = normalizeFolderName(moduleFolderFlagName);
                if (rawNorm && moduleNorm && rawNorm === moduleNorm) return true;
                const titleNorm = normalizeFolderName(this.module?.title?.replace(/^wfrp4e\s*[-–]\s*/i, ""));
                if (rawNorm && titleNorm && rawNorm === titleNorm) return true;

                if (rootFolder) {
                    const rootNorm = normalizeFolderName(rootFolder.name);
                    if (rootFolder.name === raw || rootFolder.name?.toLowerCase() === raw.toLowerCase() || (rawNorm && rootNorm === rawNorm)) return true;
                    if (trans && (rootFolder.name === trans || rootFolder.name?.toLowerCase() === trans.toLowerCase() || (normalizeFolderName(trans) && rootNorm === normalizeFolderName(trans)))) return true;
                }
                const rootTranslated = await translatedRootName(pack, raw);
                if (rootFolder && rootTranslated && (rootFolder.name === rootTranslated || rootFolder.name?.toLowerCase() === rootTranslated?.toLowerCase() || (normalizeFolderName(rootFolder.name) && normalizeFolderName(rootFolder.name) === normalizeFolderName(rootTranslated)))) return true;
                return false;
            };

            for (const rawFolderName of folderNames) {
                const folderName = await translatedPackFolderName(pack, rawFolderName)
                    ?? await translatedRootName(pack, rawFolderName)
                    ?? rawFolderName;

                // Jeśli flaga odpowiada nazwie modułu / rootFolderu (np. Starter Set, Rough Nights & Hard Days),
                // to dokumenty należą bezpośrednio do rootFolderu – nie tworzymy zbędnego podfolderu!
                if (await isRootModuleFolder(rawFolderName, folderName)) {
                    resolvedFolders[rawFolderName] = rootFolderId;

                    // Posprzątaj niepotrzebne angielskie podfoldery utworzone wcześniej wewnątrz rootFolder
                    const rawNorm = normalizeFolderName(rawFolderName);
                    const duplicateSubfolders = Array.from(folders).filter(candidate =>
                        candidate.type === documentType
                        && candidate.id !== rootFolderId
                        && parentFolderId(candidate) === rootFolderId
                        && (
                            candidate.name === rawFolderName
                            || candidate.name === moduleFolderFlagName
                            || (candidate.name?.toLowerCase() === rawFolderName?.toLowerCase())
                            || (rawNorm && normalizeFolderName(candidate.name) === rawNorm)
                        )
                    );
                    for (const dup of duplicateSubfolders) {
                        await mergeRootFolder(dup, rootFolder);
                    }
                    continue;
                }

                // Dla prawdziwych podfolderów (np. przygody w RNHD: A Day at the Trials -> Dzień Ciężkiego Wymiaru Sprawiedliwości):
                // Sprawdź, czy folder już istnieje (pod nazwą polską LUB pod nazwą angielską)
                let folder = Array.from(folders).find(candidate =>
                    candidate.type === documentType
                    && parentFolderId(candidate) === rootFolderId
                    && (
                        candidate.name === folderName
                        || candidate.name === rawFolderName
                        || candidate.name?.toLowerCase() === folderName.toLowerCase()
                        || candidate.name?.toLowerCase() === rawFolderName.toLowerCase()
                    )
                );
                if (folder) {
                    if (folder.name !== folderName) {
                        await folder.update({name: folderName});
                    }
                }
                else {
                    [folder] = await CONFIG.Folder.documentClass.create([{
                        name: folderName,
                        type: documentType,
                        folder: rootFolderId,
                        flags: {"warhammer-lib": {source: this.module.id}},
                    }]);
                }
                resolvedFolders[rawFolderName] = folder.id;
            }

            await createOrUpdateDocuments.call(this, documents, collection);

            const moves = documentsNeedingRouting
                .map(document => {
                    const rawFolderName = findInitializationFolderName(document.toObject?.() ?? document);
                    const folderId = (rawFolderName ? resolvedFolders[rawFolderName] : null) ?? rootFolderId;
                    const imported = collection.get(document.id);
                    return folderId && imported?.folder?.id !== folderId && imported?.folder !== folderId
                        ? {_id: document.id, folder: folderId}
                        : null;
                })
                .filter(Boolean);
            if (moves.length) {
                await collection.documentClass.updateDocuments(moves);
            }
        }
        else {
            await createOrUpdateDocuments.call(this, documents, collection);
        }
    };

    WarhammerModuleContentHandler.prototype._wfrp4eCorePlInitializationFolderRouting = true;
}

// Resolve a package root before creating it. Applying Babele's public folder
// pass afterwards changes only the live Folder object and can leave the saved
// root under its English name. Reinitialization must also reuse/merge existing
// roots instead of producing one English and one Polish folder.
if (!WarhammerModuleContentHandler.prototype._wfrp4eCorePlFolderTranslation) {

    // Read-only companion to createFolders: content can be identical while
    // translated folder names/parents still need repair. Never call parentFor
    // here, as that API is allowed to create/update world categories.
    WarhammerModuleContentHandler.prototype.folderChangesRequired = async function(pack, {folderIds = null} = {}) {
        const type = pack.documentName ?? pack.metadata.type;
        const organization = game.wfrp4eCorePl?.contentOrganization;
        const group = organization?.category?.(this.module.id);
        const folders = Array.from(worldFolders());
        const parent = group ? folders.find(folder => folder.type === type
            && (folder.flags?.['warhammer-lib']?.contentCategory === group.id
                || (!parentFolderId(folder) && folder.name === group.name))) : null;
        if (group && (!parent || parent.name !== group.name || parentFolderId(parent)
            || parent.flags?.['warhammer-lib']?.contentCategory !== group.id
            || (parent.color?.css ?? parent.color ?? null) !== group.color)) return true;
        const layout = organization?.folderLayout?.(pack, {folderIds});
        const sourceFolders = layout?.sourceFolders ?? Array.from(pack.folders?.contents ?? pack.folders ?? [], folder => folder.toObject());
        const sourceIds = new Set(sourceFolders.map(folder => folder._id));
        const roots = folders.filter(folder => folder.type === type && (!sourceIds.has(folder.id) || folder.id === layout?.rootSourceId)
            && folderSource(folder) === this.module.id
            && (folder.id === layout?.rootSourceId || (organization?.isModuleRoot?.(folder, this.module.id)
                ?? (!parentFolderId(folder) || parentFolderId(folder) === parent?.id))));
        if (roots.length !== 1) return true;
        const root = roots[0];
        if (layout?.rootSourceId && (root.id !== layout.rootSourceId || root.flags?.['warhammer-lib']?.contentRootSource !== root.id)) return true;
        if (root.name !== await translatedRootName(pack, this.module.flags?.folder?.name)
            || root.flags?.['warhammer-lib']?.contentRoot !== true
            || (parent && parentFolderId(root) !== parent.id)) return true;
        const required = folderIds === null ? null : new Set(folderIds);
        const byId = new Map(sourceFolders.map(folder => [folder._id, folder]));
        if (required) for (const id of required) {
            const parent = byId.get(id)?.folder;
            if (parent) required.add(parent);
        }
        for (const source of sourceFolders) {
            if (source._id === layout?.rootSourceId) continue;
            if (required && !required.has(source._id)) continue;
            const current = worldFolders().get(source._id);
            const name = await translatedPackFolderName(pack, source.name);
            if (!current || current.type !== type || folderSource(current) !== this.module.id
                || current.name !== name
                || parentFolderId(current) !== (sourceIds.has(source.folder) ? source.folder : root.id)) return true;
            if (layout?.sortedFolderIds?.includes(source._id) && current.sort !== source.sort) return true;
            if (name !== source.name && folders.some(duplicate => duplicate.id !== current.id
                && !sourceIds.has(duplicate.id) && duplicate.type === type && duplicate.name === source.name
                && (folderSource(duplicate) === this.module.id || parentFolderId(duplicate) === root.id
                    || parentFolderId(duplicate) === current.id))) return true;
        }
        return false;
    };

    WarhammerModuleContentHandler.prototype.createFolders = async function(pack, options = {}) {
        const invoke = () => createManagedFolders.call(this, pack, options);
        const organization = game.wfrp4eCorePl?.contentOrganization;
        return organization?.withFolderWrites ? organization.withFolderWrites(invoke) : invoke();
    };

    async function updateManagedFolder(folder, data) {
        const patch = {};
        const same = foundry.utils.equals ?? ((a, b) => JSON.stringify(a) === JSON.stringify(b));
        for (const [key, value] of Object.entries(data)) {
            if (key === 'flags') {
                for (const [scope, flags] of Object.entries(value)) for (const [flag, wanted] of Object.entries(flags)) {
                    if (!same(folder.flags?.[scope]?.[flag], wanted)) patch[`flags.${scope}.${flag}`] = wanted;
                }
            } else if (!same(key === 'folder' ? parentFolderId(folder) : folder[key], value)) patch[key] = value;
        }
        if (Object.keys(patch).length) await folder.update(patch, {pack: null});
    }

    // organize: false lets a managed operation organize all its packs once.
    async function createManagedFolders(pack, {folderIds = null, organize = true} = {}) {
        const layout = game.wfrp4eCorePl?.contentOrganization?.folderLayout?.(pack, {folderIds});
        const root = foundry.utils.deepClone(this.module.flags.folder || {});
        root.type = pack.metadata.type;
        root._id = layout?.rootSourceId ?? foundry.utils.randomID();
        root.flags = {"warhammer-lib": {source: this.module.id, contentRoot: true}};
        if (layout?.rootSourceId) root.flags['warhammer-lib'].contentRootSource = layout.rootSourceId;

        const originalRootName = root.name;
        root.name = await translatedRootName(pack, originalRootName);

        let campaignFolderId = await game.wfrp4eCorePl?.contentOrganization?.parentFor(this.module.id, root.type) ?? null;
        if (!campaignFolderId && game.i18n?.lang !== "pl" && ENEMY_WITHIN_MODULES.has(this.module.id)) {
            const campaignName = game.i18n?.lang === "pl" ? "Wewnętrzny Wróg" : "The Enemy Within";
            let campaignFolder = Array.from(worldFolders()).find(f =>
                f.type === root.type
                && !parentFolderId(f)
                && (f.name === "Wewnętrzny Wróg" || f.name === "The Enemy Within" || f.name?.toLowerCase() === campaignName.toLowerCase())
            );
            if (!campaignFolder) {
                [campaignFolder] = await CONFIG.Folder.documentClass.create([{
                    name: campaignName,
                    type: root.type,
                    folder: null,
                    color: ENEMY_WITHIN_FOLDER_COLOR,
                    flags: {"warhammer-lib": {campaign: "enemy-within"}},
                }]);
            } else if (campaignFolder.color !== ENEMY_WITHIN_FOLDER_COLOR) {
                await campaignFolder.update({ color: ENEMY_WITHIN_FOLDER_COLOR });
            }
            campaignFolderId = campaignFolder.id;
            root.folder = campaignFolderId;
        }

        if (campaignFolderId) root.folder = campaignFolderId;

        const sourceFolderIds = new Set(pack.folders.contents.map(folder => folder.id ?? folder._id));
        const existingRoots = Array.from(worldFolders()).filter(folder =>
            folder.type === root.type
            && (!sourceFolderIds.has(folder.id) || folder.id === layout?.rootSourceId)
            && (folder.id === layout?.rootSourceId || (game.wfrp4eCorePl?.contentOrganization?.isModuleRoot(folder, this.module.id)
                ?? (!parentFolderId(folder) || parentFolderId(folder) === campaignFolderId)))
            && folderSource(folder) === this.module.id
        );
        let rootFolder = (layout?.rootSourceId ? existingRoots.find(folder => folder.id === layout.rootSourceId) : null)
            ?? (!layout?.rootSourceId ? game.wfrp4eCorePl?.contentOrganization?.chooseRoot?.(existingRoots)
            ?? existingRoots.find(folder => folder.name === root.name)
            ?? existingRoots.find(folder => folder.name === originalRootName)
            ?? existingRoots[0] : null);

        if (rootFolder) {
            const updates = {
                name: root.name,
                flags: {"warhammer-lib": {source: this.module.id, contentRoot: true}},
            };
            if (layout?.rootSourceId) updates.flags['warhammer-lib'].contentRootSource = layout.rootSourceId;
            if (campaignFolderId && parentFolderId(rootFolder) !== campaignFolderId) {
                updates.folder = campaignFolderId;
            }
            await updateManagedFolder(rootFolder, updates);
            for (const duplicate of existingRoots) {
                await mergeRootFolder(duplicate, rootFolder);
            }
        }
        else {
            [rootFolder] = await CONFIG.Folder.documentClass.create([root], {keepId: true});
            for (const duplicate of existingRoots) await mergeRootFolder(duplicate, rootFolder);
        }

        this.rootFolders[pack.metadata.id] = rootFolder.id;

        let packFolders = (layout?.folders ?? pack.folders.contents.map(folder => folder.toObject())).map(folder => {
            const data = foundry.utils.deepClone(folder);
            data._originalName = pack.folders.get?.(data._id)?.name ?? data.name;
            return data;
        }).filter(folder => folder._id !== layout?.rootSourceId);
        if (folderIds !== null) {
            const required = new Set(folderIds);
            const byId = new Map(packFolders.map(folder => [folder._id, folder]));
            for (const id of required) {
                const parent = byId.get(id)?.folder;
                if (parent) required.add(parent);
            }
            packFolders = packFolders.filter(folder => required.has(folder._id));
        }
        for (const folder of packFolders) {
            folder.name = await translatedPackFolderName(pack, folder._originalName ?? folder.name);
            if (!folder.folder || !sourceFolderIds.has(folder.folder)) {
                folder.folder = rootFolder.id;
            }
            folder.flags ??= {};
            foundry.utils.setProperty(folder.flags, "warhammer-lib.source", this.module.id);
        }

        // Shorten an existing branch before inserting a formerly adopted root
        // below a new book container. Otherwise the intermediate tree can hit
        // five levels even when the final hierarchy has only four.
        for (const data of packFolders) {
            const existing = worldFolders().get?.(data._id);
            const parent = worldFolders().get?.(data.folder);
            if (!existing || !parent || folderSource(existing) !== this.module.id
                || parentFolderId(existing) === data.folder) continue;
            const depth = folder => {
                const seen = new Set();
                while (folder && !seen.has(folder.id)) {
                    seen.add(folder.id); folder = worldFolders().get?.(parentFolderId(folder));
                }
                return seen.size;
            };
            if (depth(parent) + 1 <= depth(existing)) await updateManagedFolder(existing, {folder: parent.id,
                ...(layout?.sortedFolderIds?.includes(data._id) ? {sort: data.sort} : {})});
        }
        const folders = [rootFolder], pending = [...packFolders];
        // Restore parents before updating/creating their children. Foundry's
        // foreign-document getter returns null while an ancestor is missing.
        while (pending.length) {
            const pendingIds = new Set(pending.map(data => data._id));
            const ready = pending.filter(data => !pendingIds.has(data.folder) && worldFolders().get?.(data.folder));
            if (!ready.length) throw new Error(`Nie można odtworzyć hierarchii folderów modułu ${this.module.title}. Kopia operacji jest zachowana.`);
            const create = [];
            for (const data of ready) {
                const existing = worldFolders().get?.(data._id);
                if (existing) {
                    if (existing.type !== root.type) throw new Error(`Folder „${existing.name}” ma niezgodny typ. Kopia operacji jest zachowana.`);
                    const updates = {name: data.name, folder: data.folder, flags: data.flags};
                    if (existing.flags?.['warhammer-lib']?.contentRootSource === existing.id) {
                        updates.flags['warhammer-lib'].contentRoot = false;
                        updates.flags['warhammer-lib'].contentRootSource = null;
                    }
                    if (layout?.sortedFolderIds?.includes(data._id)) updates.sort = data.sort;
                    await updateManagedFolder(existing, updates);
                } else create.push(data);
            }
            if (create.length) await CONFIG.Folder.documentClass.create(create, {pack: null, keepId: true});
            for (const data of ready) {
                const saved = worldFolders().get?.(data._id);
                if (!saved || parentFolderId(saved) !== data.folder) throw new Error(`Foundry nie zapisało prawidłowego folderu „${data.name}”. Kopia operacji jest zachowana.`);
                folders.push(saved);
                pending.splice(pending.indexOf(data), 1);
            }
        }

        // Scal zawartość i usuń osierocone angielskie foldery utworzone przez błędny routing
        for (const folderData of packFolders) {
            const originalName = folderData._originalName;
            if (!originalName || originalName === folderData.name) continue;
            const targetFolder = worldFolders().get?.(folderData._id);
            if (!targetFolder) continue;

            const duplicateEnglishFolders = Array.from(worldFolders()).filter(f =>
                f.id !== targetFolder.id
                && !sourceFolderIds.has(f.id)
                && f.type === pack.metadata.type
                && f.name === originalName
                && (folderSource(f) === this.module.id || parentFolderId(f) === rootFolder.id || f.folder?.id === rootFolder.id)
            );
            for (const dup of duplicateEnglishFolders) {
                await mergeRootFolder(dup, targetFolder);
            }
        }

        if (!organize) return folders;
        if (game.i18n?.lang === 'pl' && game.wfrp4eCorePl?.contentOrganization) {
            await game.wfrp4eCorePl.contentOrganization.organizeWorldFolders({managed: true, moduleIds: [this.module.id]});
        } else await organizeEnemyWithinFolders();
        ui.sidebar?.render?.();
        return folders;
    }

    WarhammerModuleContentHandler.prototype._wfrp4eCorePlFolderTranslation = true;
}
// Journal, Actor, Scene and RollTable links in official WFRP content point to
// the source document IDs. Always retain those IDs during world initialization;
// otherwise every @UUID[Actor...], @UUID[Scene...] etc. becomes invalid.
if (!WarhammerModuleContentHandler.prototype._wfrp4eCorePlStableDocumentIds) {
    const createOrUpdateDocuments = WarhammerModuleContentHandler.prototype.createOrUpdateDocuments;

    WarhammerModuleContentHandler.prototype.createOrUpdateDocuments = async function(documents, collection) {
        const documentClass = collection.documentClass;
        const ownCreateDescriptor = Object.getOwnPropertyDescriptor(documentClass, "create");
        const create = documentClass.create;
        Object.defineProperty(documentClass, "create", {
            configurable: true,
            writable: true,
            value: function(data, options = {}) {
                return create.call(this, data, {...options, keepId: true, pack: null});
            },
        });

        try {
            return await createOrUpdateDocuments.call(this, documents, collection);
        }
        finally {
            if (ownCreateDescriptor) {
                Object.defineProperty(documentClass, "create", ownCreateDescriptor);
            }
            else {
                delete documentClass.create;
            }
        }
    };

    WarhammerModuleContentHandler.prototype._wfrp4eCorePlStableDocumentIds = true;
}

// Foundry V14 requires embedded documents to be updated through their parent.
// Journal pages and Scene Levels need explicit V14 synchronization after the
// original module resolver selects the source document. Actor initialization
// deliberately uses the library's original update path without a second Item
// merge: different modules can reuse an Actor ID with different embedded IDs.
if (!WarhammerModuleContentHandler.prototype._wfrp4eCorePlEmbeddedSync) {
    const createOrUpdateDocuments = WarhammerModuleContentHandler.prototype.createOrUpdateDocuments;

    WarhammerModuleContentHandler.prototype.createOrUpdateDocuments = async function(documents, collection) {
        if (!documents.length || !["JournalEntry", "Scene"].includes(documents[0].documentName)) {
            return createOrUpdateDocuments.call(this, documents, collection);
        }

        const documentName = documents[0].documentName;
        const incomingDocuments = new Map(documents.map(document => [document.id, document]));
        const updatedDocumentIds = new Set();
        const updateHook = `update${documentName}`;
        const updateMethodDescriptors = new Map();
        const trackUpdatedDocument = document => {
            if (incomingDocuments.has(document.id) && collection.get(document.id) === document) {
                updatedDocumentIds.add(document.id);
            }
        };

		// Record which documents the duplicate resolver actually selected. This
		// also works when Document#update finds no parent-level diff and therefore
		// emits no update hook (the embedded Items/Levels may still need syncing).
		for (const documentId of incomingDocuments.keys()) {
			const existingDocument = collection.get(documentId);
			if (!existingDocument) {
				continue;
			}
			try {
				const ownDescriptor = Object.getOwnPropertyDescriptor(existingDocument, "update");
				const updateDocument = existingDocument.update;
				Object.defineProperty(existingDocument, "update", {
					configurable: true,
					writable: true,
					value: function(...args) {
						updatedDocumentIds.add(this.id);
						return updateDocument.apply(this, args);
					}
				});
				updateMethodDescriptors.set(existingDocument, ownDescriptor);
			}
			catch (_error) {
				// The update hook below remains as a fallback for non-extensible docs.
			}
		}

        Hooks.on(updateHook, trackUpdatedDocument);
        try {
            await createOrUpdateDocuments.call(this, documents, collection);
        }
        finally {
            Hooks.off(updateHook, trackUpdatedDocument);
			for (const [document, descriptor] of updateMethodDescriptors) {
				if (descriptor) {
					Object.defineProperty(document, "update", descriptor);
				}
				else {
					delete document.update;
				}
			}
        }

        for (const documentId of updatedDocumentIds) {
            const document = collection.get(documentId);
            const incomingDocument = incomingDocuments.get(documentId);
            if (documentName === "JournalEntry") {
                await synchronizeJournalPages(document, incomingDocument);
            }
            else {
                await synchronizeSceneEmbeddedDocuments(document, incomingDocument);
            }
        }
    };

    WarhammerModuleContentHandler.prototype._wfrp4eCorePlEmbeddedSync = true;
}

async function synchronizeJournalPages(journal, incomingJournal) {
    const activeId = activeCorePlModuleId();
    const sanitizeText = (text) => {
        if (typeof text !== "string") return text;
        return text
            .replaceAll(/modules\/wfrp4e-core-pl(?:-dev)?\/images\//g, `modules/${activeId}/images/`)
            .replaceAll("wfrp4e-ua2.ua2-actors.", "wfrp4e-ua2.actors.")
            .replaceAll(".journals.JournalEntry.", ".journals.");
    };
    const incomingPages = Array.from(incomingJournal.pages || [], page => {
        const p = page.toObject?.() ?? foundry.utils.deepClone(page);
        if (p.text?.content) p.text.content = sanitizeText(p.text.content);
        if (p.text?.body) p.text.body = sanitizeText(p.text.body);
        if (p.src) p.src = sanitizeText(p.src);
        if (p.image?.caption) p.image.caption = sanitizeText(p.image.caption);
        return p;
    });
    const existingPageIds = new Set(Array.from(journal.pages || [], page => page.id));
    const pageUpdates = incomingPages.filter(page => existingPageIds.has(page._id));
    const pageCreates = incomingPages.filter(page => !existingPageIds.has(page._id));

    if (pageUpdates.length) {
        await journal.updateEmbeddedDocuments("JournalEntryPage", pageUpdates, {pack: null});
    }
    if (pageCreates.length) {
        await journal.createEmbeddedDocuments("JournalEntryPage", pageCreates, {keepId: true, pack: null});
    }
}

async function synchronizeSceneEmbeddedDocuments(scene, incomingScene) {
    const incomingDrawings = Array.from(incomingScene.drawings || [], drawing => drawing.toObject?.() ?? drawing);
    if (incomingDrawings.length) {
        const existingDrawings = new Map(Array.from(scene.drawings || [], drawing => [drawing.id, drawing]));
        const drawingUpdates = incomingDrawings
            .filter(drawing => {
                const existing = existingDrawings.get(drawing._id ?? drawing.id);
                return existing && (existing.text !== drawing.text || existing.hidden !== drawing.hidden);
            })
            .map(drawing => ({
                _id: drawing._id ?? drawing.id,
                text: drawing.text,
                hidden: drawing.hidden,
            }));
        const drawingCreates = incomingDrawings.filter(drawing => !existingDrawings.has(drawing._id ?? drawing.id));

        if (drawingUpdates.length) {
            await scene.updateEmbeddedDocuments("Drawing", drawingUpdates, {pack: null});
        }
        if (drawingCreates.length) {
            await scene.createEmbeddedDocuments("Drawing", drawingCreates, {keepId: true, pack: null});
        }
    }

    const incomingLevels = Array.from(incomingScene.levels || [], level => level.toObject?.() ?? level);
    if (!incomingLevels.length) {
        return;
    }

    const existingLevelIds = new Set(Array.from(scene.levels || [], level => level.id));
    // A translation owns only the map image on an existing Level. Preserve
    // dimensions, elevation, visibility and other world-specific changes.
    const levelUpdates = incomingLevels
        .filter(level => existingLevelIds.has(level._id) && level.background?.src)
        .map(level => ({_id: level._id, "background.src": level.background.src}));
    const levelCreates = incomingLevels.filter(level => !existingLevelIds.has(level._id));

    if (levelUpdates.length) {
        await scene.updateEmbeddedDocuments("Level", levelUpdates, {pack: null});
    }
    if (levelCreates.length) {
        await scene.createEmbeddedDocuments("Level", levelCreates, {keepId: true, pack: null});
    }
}

async function organizeEnemyWithinFolders() {
    if (!game.user?.isGM) return;
    const campaignName = game.i18n?.lang === "pl" ? "Wewnętrzny Wróg" : "The Enemy Within";
    const folders = worldFolders();
    const types = ["Actor", "JournalEntry", "Scene", "RollTable", "Item"];

    for (const type of types) {
        const typeFolders = Array.from(folders).filter(f => f.type === type);
        const ewFolders = typeFolders.filter(f => {
            const src = folderSource(f);
            return ENEMY_WITHIN_MODULES.has(src);
        });
        if (!ewFolders.length) continue;

        let campaignFolder = typeFolders.find(f =>
            !parentFolderId(f)
            && (f.name === "Wewnętrzny Wróg" || f.name === "The Enemy Within" || f.name?.toLowerCase() === campaignName.toLowerCase())
        );
        if (!campaignFolder) {
            [campaignFolder] = await CONFIG.Folder.documentClass.create([{
                name: campaignName,
                type,
                folder: null,
                color: ENEMY_WITHIN_FOLDER_COLOR,
                flags: {"warhammer-lib": {campaign: "enemy-within"}},
            }]);
        } else if (campaignFolder.color !== ENEMY_WITHIN_FOLDER_COLOR) {
            await campaignFolder.update({ color: ENEMY_WITHIN_FOLDER_COLOR });
        }

        for (const f of ewFolders) {
            if (f.id === campaignFolder.id) continue;
            const parentId = parentFolderId(f);
            if (parentId === campaignFolder.id) continue;

            const isChildOfEwFolder = ewFolders.some(other => other.id !== f.id && other.id === parentId);
            if (!isChildOfEwFolder) {
                await f.update({ folder: campaignFolder.id });
            }
        }
    }
}

// Polskie tytuły kafelków w oknie inicjalizacji (system bierze je z
// WFRP4E.premiumModules, którego nie nadpisujemy, bo służy też do etykiet źródeł).
// Moduły bez polskiego tłumaczenia celowo zostają z nazwą angielską.
const PREMIUM_MODULE_TITLES_PL = {
    "wfrp4e-core": "Podręcznik Podstawowy",
    "wfrp4e-starter-set": "Zestaw Startowy",
    "wfrp4e-rnhd": "Ciężkie Dnie i Niespokojne Noce",
    "wfrp4e-eis": "Wróg w Cieniach",
    "wfrp4e-ua1": "Przygody w Ubersreiku I",
    "wfrp4e-dotr": "Śmierć na rzece Reik",
    "wfrp4e-middenheim": "Middenheim: Miasto Białego Wilka",
    "wfrp4e-archives1": "Archiwa Imperium Tom I",
    "wfrp4e-pbtt": "Szara Eminencja",
    "wfrp4e-altdorf": "Altdorf: Korona Imperium",
    "wfrp4e-ua2": "Przygody w Ubersreiku II",
    "wfrp4e-owb1": "Pakiet Starego Świata I",
    "wfrp4e-horned-rat": "Rogaty Szczur",
    "wfrp4e-empire-ruins": "Imperium w Ruinie",
    "wfrp4e-archives2": "Archiwa Imperium Tom II",
    "wfrp4e-up-in-arms": "Pod Bronią",
    "wfrp4e-wom": "Wiatry Magii",
    "wfrp4e-zoo": "Imperialny Zwierzyniec",
    "wfrp4e-salzenmund": "Salzenmund: Miasto Soli i Srebra",
    "wfrp4e-lustria": "Lustria",
};

function premiumModuleTitle(key, fallback) {
    if (game.i18n?.lang !== "pl") return fallback;
    return PREMIUM_MODULE_TITLES_PL[key] ?? fallback;
}

const prepareInitializationContext = WarhammerModuleInitializationV2.prototype._prepareContext;
WarhammerModuleInitializationV2.prototype._prepareContext = async function(options) {
    const context = await prepareInitializationContext.call(this, options);
    for (const module of context.modules || []) {
        module.title = premiumModuleTitle(module.key, module.title);
        module.tooltip ??= module.title || "";
    }
    return context;
};

// Bezpiecznik: automatyczne przypisanie do właściwych folderów dokumentów
// posiadających nieistniejące (osierocone) ID folderu z oficjalnych paczek DLC (np. UA1, UA2, Zestaw Startowy, Archiwa).
// W polskiej wersji rozmieszczenie należy wyłącznie do zarządzanej operacji:
// aktualizacja książki odtwarza brakujące foldery, bez zgadywania po nazwach przy starcie.
Hooks.once("ready", async () => {
    if (!game.user?.isGM || game.i18n?.lang === "pl") return;

    for (const collection of [game.scenes, game.journal, game.actors, game.items, game.tables]) {
        if (!collection?.contents?.length) continue;
        const updates = [];
        for (const doc of collection) {
            const rawFolderId = doc._source?.folder;
            if (rawFolderId && !game.folders.has(rawFolderId)) {
                const initFolderName = findInitializationFolderName(doc);
                const transInitFolder = (initFolderName ? COMMON_FOLDER_TRANSLATIONS[initFolderName] : null) || initFolderName;
                const flags = doc.flags || {};
                const modFlag = Object.keys(flags).find(k => k.startsWith("wfrp4e-") && !k.includes("core-pl"));

                const target = game.folders.find(f => {
                    if (f.type !== doc.documentName) return false;
                    const fName = f.name.toLowerCase();
                    if (transInitFolder && (fName.includes(transInitFolder.toLowerCase()) || normalizeFolderName(f.name) === normalizeFolderName(transInitFolder))) return true;
                    if (initFolderName && (fName.includes(initFolderName.toLowerCase()) || normalizeFolderName(f.name) === normalizeFolderName(initFolderName))) return true;
                    if (modFlag === "wfrp4e-ua1" && (fName.includes("przygody w ubersreiku i") || fName.includes("ubersreik adventures i"))) return true;
                    if (modFlag === "wfrp4e-starter-set" && (fName.includes("zestaw startowy") || fName.includes("starter set") || fName.includes("mapy (zestaw startowy)"))) return true;
                    if (modFlag === "wfrp4e-ua2" && (fName.includes("przygody w ubersreiku ii") || fName.includes("ubersreik adventures ii"))) return true;
                    if (modFlag === "wfrp4e-archives1" && (fName.includes("archiwa imperium") || fName.includes("archiwa tom i") || fName.includes("archives of the empire"))) return true;
                    if (modFlag === "wfrp4e-rnhd" && (fName.includes("ciężkie dnie") || fName.includes("rough nights"))) return true;
                    if (modFlag === "wfrp4e-eis" && (fName.includes("wróg w cieniach") || fName.includes("wewnętrzny wróg") || fName.includes("enemy in shadows"))) return true;
                    if (modFlag === "wfrp4e-up-in-arms" && (fName.includes("pod bronią") || fName.includes("up in arms"))) return true;
                    if (modFlag === "wfrp4e-core" && (fName.includes("podręcznik podstawowy") || fName.includes("core rulebook"))) return true;
                    if (modFlag && f.flags?.["warhammer-lib"]?.source === modFlag) return true;
                    return false;
                });

                if (target) {
                    updates.push({ _id: doc.id, folder: target.id });
                }
            }
        }
        if (updates.length) {
            console.log(`wfrp4e-core-pl | Automatycznie naprawiono przypisanie do folderu dla ${updates.length} dokumentów w ${collection.documentName}`);
            await collection.documentClass.updateDocuments(updates);
        }
    }
});

