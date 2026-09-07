const EMBEDDED_ACTOR_TRANSLATION_VERSION = 2;
const TRANSLATED_ACTOR_MODULES = [
    "wfrp4e-core",
    "wfrp4e-up-in-arms",
    "wfrp4e-archives1",
    "wfrp4e-dotr",
    "wfrp4e-dwarfs",
    "wfrp4e-eis",
    "wfrp4e-empire-ruins",
    "wfrp4e-horned-rat",
    "wfrp4e-lustria",
    "wfrp4e-pbtt",
    "wfrp4e-rnhd",
    "wfrp4e-salzenmund",
    "wfrp4e-soc",
    "wfrp4e-starter-set",
    "wfrp4e-ua1",
    "wfrp4e-ua2",
    "wfrp4e-wom",
];

function activeCorePlModuleId() {
    return game.wfrp4eCorePl?.MODULE_ID
        ?? (game.modules.get("wfrp4e-core-pl")?.active ? "wfrp4e-core-pl" : "wfrp4e-core-pl");
}

function activeCorePlModulePath() {
    return game.wfrp4eCorePl?.MODULE_PATH ?? `modules/${activeCorePlModuleId()}`;
}

function getTranslatedActorModules() {
    const modules = new Set(TRANSLATED_ACTOR_MODULES);
    for (const module of game.modules?.values() ?? []) {
        if (!module.active || module.id === activeCorePlModuleId()) continue;
        if (!module.id.startsWith("wfrp4e-")) continue;
        const actorPack = (module.flags?.initializationPacks || [])
            .map(id => game.packs.get(id))
            .find(p => p?.documentName === "Actor") ?? game.packs.get(`${module.id}.actors`);
        if (actorPack && game.babele?.isTranslated?.(actorPack)) {
            modules.add(module.id);
        }
    }
    return modules;
}

Hooks.on("init", () => {
	CONFIG.supportedLanguages["pl"] = "Polski";
    if (game.data?.packs) {
        game.data.packs = game.data.packs.filter(i => i.name != "basic" || i.system != "wfrp4e");
    }
    game.settings.register(activeCorePlModuleId(), "embeddedActorTranslationVersions", {
        scope: "world",
        config: false,
        type: Object,
        default: {},
    });
});

WarhammerModuleInitializationV2.initialize = async function (ev, target) {
    let key = target.closest("[data-module]").dataset.module;
    let module = game.modules.get(key);
    let dialogContent = game.i18n.format("WH.Initializer.DialogContent", {title : module.title, description : module.description});
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
    if (await foundry.applications.api.DialogV2.confirm({window: {title : `${game.i18n.localize("WH.Initialize")} ${module.title}`}, content : dialogContent, classes : ["initialization"]}))
    {
        try {
            const completed = await new WarhammerModuleContentHandler(module).initialize();
            if (completed) {
                await game.settings.set(key, "initialized", true);
                ui.notifications.info(`${module.title}: ${game.i18n.localize("WH.Initialization.Complete")}`);
            }
        }
        catch(error) {
            console.error(`Could not initialize ${module.title}`, error);
            ui.notifications.error(`${module.title}: initialization failed. Check console for details.`);
        }
    }
}
WarhammerModuleInitializationV2.DEFAULT_OPTIONS.actions.initialize = WarhammerModuleInitializationV2.initialize;

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
            ui.notifications.notify(`${this.module.title}: ${game.i18n.localize(target[1])}`);
            await this.createOrUpdateDocuments(documents, target[0]);
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
const parentFolderId = folder => folder.folder?.id ?? folder.folder ?? null;
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
        if (cand === packId) continue;
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

    WarhammerModuleContentHandler.prototype.createFolders = async function(pack) {
        const root = foundry.utils.deepClone(this.module.flags.folder || {});
        root.type = pack.metadata.type;
        root._id = foundry.utils.randomID();
        root.flags = {"warhammer-lib": {source: this.module.id}};

        const originalRootName = root.name;
        root.name = await translatedRootName(pack, originalRootName);

        let campaignFolderId = null;
        if (ENEMY_WITHIN_MODULES.has(this.module.id)) {
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

        const existingRoots = Array.from(worldFolders()).filter(folder =>
            folder.type === root.type
            && (!parentFolderId(folder) || parentFolderId(folder) === campaignFolderId)
            && folderSource(folder) === this.module.id
        );
        let rootFolder = existingRoots.find(folder => folder.name === root.name)
            ?? existingRoots.find(folder => folder.name === originalRootName)
            ?? existingRoots[0];

        if (rootFolder) {
            const updates = {
                name: root.name,
                flags: {"warhammer-lib": {source: this.module.id}},
            };
            if (campaignFolderId && parentFolderId(rootFolder) !== campaignFolderId) {
                updates.folder = campaignFolderId;
            }
            await rootFolder.update(updates);
            for (const duplicate of existingRoots) {
                await mergeRootFolder(duplicate, rootFolder);
            }
        }
        else {
            [rootFolder] = await CONFIG.Folder.documentClass.create([root], {keepId: true});
        }

        this.rootFolders[pack.metadata.id] = rootFolder.id;

        const packFolders = pack.folders.contents.map(folder => {
            const data = folder.toObject();
            data._originalName = folder.name;
            return data;
        });
        for (const folder of packFolders) {
            folder.name = await translatedPackFolderName(pack, folder._originalName ?? folder.name);
            if (!folder.folder) {
                folder.folder = rootFolder.id;
            }
            folder.flags ??= {};
            foundry.utils.setProperty(folder.flags, "warhammer-lib.source", this.module.id);
        }

        const folders = [rootFolder];
        const foldersToCreate = [];
        for (const folderData of packFolders) {
            const existingFolder = worldFolders().get?.(folderData._id);
            if (existingFolder) {
                await existingFolder.update({
                    name: folderData.name,
                    folder: folderData.folder,
                    flags: folderData.flags,
                });
                folders.push(existingFolder);
            }
            else {
                foldersToCreate.push(folderData);
            }
        }
        if (foldersToCreate.length) {
            folders.push(...await CONFIG.Folder.documentClass.create(foldersToCreate, {keepId: true}));
        }

        // Scal zawartość i usuń osierocone angielskie foldery utworzone przez błędny routing
        for (const folderData of packFolders) {
            const originalName = folderData._originalName;
            if (!originalName || originalName === folderData.name) continue;
            const targetFolder = worldFolders().get?.(folderData._id);
            if (!targetFolder) continue;

            const duplicateEnglishFolders = Array.from(worldFolders()).filter(f =>
                f.id !== targetFolder.id
                && f.type === pack.metadata.type
                && f.name === originalName
                && (folderSource(f) === this.module.id || parentFolderId(f) === rootFolder.id || f.folder?.id === rootFolder.id)
            );
            for (const dup of duplicateEnglishFolders) {
                await mergeRootFolder(dup, targetFolder);
            }
        }

        await organizeEnemyWithinFolders();
        ui.sidebar?.render?.();
        return folders;
    };

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
// A parent update does not reliably persist Actor Items, Journal pages or Scene
// Levels, so explicitly synchronize them after the module resolver selects the
// source document.
if (!WarhammerModuleContentHandler.prototype._wfrp4eCorePlEmbeddedSync) {
    const createOrUpdateDocuments = WarhammerModuleContentHandler.prototype.createOrUpdateDocuments;

    WarhammerModuleContentHandler.prototype.createOrUpdateDocuments = async function(documents, collection) {
        if (!documents.length || !["Actor", "JournalEntry", "Scene"].includes(documents[0].documentName)) {
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
            if (documentName === "Actor") {
                await synchronizeActorItems(document, incomingDocument);
            }
            else if (documentName === "JournalEntry") {
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

const LOCALIZED_ITEM_PATHS = [
    "name",
    "flags.babele.originalName",
    "system.description",
    "system.gmdescription",
    "system.skills",
    "system.talents",
    "system.class",
    "system.careergroup",
    "system.trappings",
    "system.wounds",
    "system.location",
    "system.duration",
    "system.incubation",
    "system.contraction",
    "system.symptoms",
    "system.permanent",
    "system.penalty",
    "system.modifier",
    "system.range",
    "system.target",
    "system.damage",
    "system.god",
    "system.overcast",
    "system.specification",
    "system.tests",
    "system.alterName",
    "system.traits",
    "system.rollable.skill",
    "system.special"
];

const LOCALIZED_ACTOR_PATHS = [
    "name",
    "system.details.species.value",
    "system.details.gender.value",
    "system.details.status.value",
    "system.details.gmnotes.value",
];

const LOCALIZED_EFFECT_PATHS = [
    "name",
    "flags.babele.originalName",
    "description",
    "duration",
    "system.changes",
    "system.transferData",
    "system.scriptData",
    "system.condition",
    "system.sourceData"
];

function localizedEmbeddedUpdate(data, paths) {
    const update = {_id: data._id};
    for (const path of paths) {
        if (foundry.utils.hasProperty(data, path)) {
            foundry.utils.setProperty(update, path, foundry.utils.deepClone(foundry.utils.getProperty(data, path)));
        }
    }
    return update;
}

async function synchronizeActorItems(actor, incomingActor) {
    const incomingItems = Array.from(incomingActor.items || []).map(item => item.toObject());
    if (!incomingItems.length) {
        return;
    }

    // The Babele Actor correction records only IDs of a verified upstream
    // PBTT defect: a zero-advance legacy `Melee` beside `Melee (Basic)`. This
    // narrowly scoped migration removes that obsolete embedded Item from Actors
    // imported before the correction. It does not perform name-based deduping
    // and therefore cannot remove a user's legitimate second specialization.
    const moduleId = activeCorePlModuleId();
    let legacyMeleeItemIds = [];
    let canonicalMeleeItemIds = [];
    try {
        legacyMeleeItemIds = incomingActor.getFlag?.(moduleId, "legacyMeleeItemIds") ?? [];
        canonicalMeleeItemIds = incomingActor.getFlag?.(moduleId, "canonicalMeleeItemIds") ?? [];
    } catch (_error) {
        // Bezpieczne pominięcie, jeśli getFlag rzuci błąd nieaktywnego scope
    }
    if (!legacyMeleeItemIds?.length) {
        legacyMeleeItemIds = foundry.utils.getProperty(incomingActor, `flags.${moduleId}.legacyMeleeItemIds`)
            ?? foundry.utils.getProperty(incomingActor, "flags.wfrp4e-core-pl.legacyMeleeItemIds")
            ?? [];
    }
    if (!canonicalMeleeItemIds?.length) {
        canonicalMeleeItemIds = foundry.utils.getProperty(incomingActor, `flags.${moduleId}.canonicalMeleeItemIds`)
            ?? foundry.utils.getProperty(incomingActor, "flags.wfrp4e-core-pl.canonicalMeleeItemIds")
            ?? [];
    }
    const canonicalMeleeIdSet = new Set(canonicalMeleeItemIds);
    const hasCanonicalMelee = incomingItems.some(item => canonicalMeleeIdSet.has(item._id)
        && item.type === "skill"
        && foundry.utils.getProperty(item, "system.characteristic.value") === "ws"
        && foundry.utils.getProperty(item, "system.grouped.value") === "isSpec");
    if (hasCanonicalMelee && legacyMeleeItemIds.length) {
        const removableIds = legacyMeleeItemIds.filter(id => {
            const item = actor.items.get(id);
            return item?.type === "skill"
                && Number(foundry.utils.getProperty(item, "system.advances.value")) === 0
                && foundry.utils.getProperty(item, "system.characteristic.value") === "ws"
                && foundry.utils.getProperty(item, "system.grouped.value") === "isSpec";
        });
        if (removableIds.length) {
            await actor.deleteEmbeddedDocuments("Item", removableIds);
        }
    }

    const existingItemIds = new Set(actor.items.map(item => item.id));
    // Synchronize localization-owned fields without resetting quantities,
    // advances, equipped state or other world-specific item data. Items and
    // effects added by the user are deliberately never deleted.
    const itemUpdates = incomingItems
        .filter(item => existingItemIds.has(item._id))
        .map(item => localizedEmbeddedUpdate(item, LOCALIZED_ITEM_PATHS));
    const itemCreates = incomingItems.filter(item => !existingItemIds.has(item._id));

    if (itemUpdates.length) {
        for (const update of itemUpdates) {
            const item = actor.items.get(update._id);
            if (item?.type === "spell") {
                update.system ??= {};
                update.system.lore ??= {};
            }
        }
        await actor.updateEmbeddedDocuments("Item", itemUpdates, {pack: null});
    }
    if (itemCreates.length) {
        await actor.createEmbeddedDocuments("Item", itemCreates, {keepId: true, pack: null});
    }

    // Active Effects are descendants of the embedded Items in V14. Keep their
    // translated names, descriptions, and scripts in sync as well.
    for (const incomingItemData of incomingItems) {
        const item = actor.items.get(incomingItemData._id);
        const incomingEffects = incomingItemData.effects || [];
        if (!item || !incomingEffects.length) {
            continue;
        }

        const existingEffectIds = new Set(item.effects.map(effect => effect.id));
        const effectUpdates = incomingEffects
            .filter(effect => existingEffectIds.has(effect._id))
            .map(effect => localizedEmbeddedUpdate(effect, LOCALIZED_EFFECT_PATHS));
        const effectCreates = incomingEffects.filter(effect => !existingEffectIds.has(effect._id));

        if (effectUpdates.length) {
            await item.updateEmbeddedDocuments("ActiveEffect", effectUpdates);
        }
        if (effectCreates.length) {
            await item.createEmbeddedDocuments("ActiveEffect", effectCreates, {keepId: true});
        }
    }
}

async function synchronizeWorldJournals() {
    if (!game.user?.isGM || game.i18n?.lang !== "pl") return;

    for (const pack of game.packs) {
        if (pack.documentName !== "JournalEntry" || !game.babele?.isTranslated?.(pack)) {
            continue;
        }
        const moduleId = pack.metadata.packageName;
        if (!game.modules.get(moduleId)?.active) {
            continue;
        }

        try {
            const translatedJournals = await pack.getDocuments();
            for (const incomingJournal of translatedJournals) {
                const journal = game.journal.get(incomingJournal.id);
                if (!journal) {
                    continue;
                }

                const nameDiffers = journal.name !== incomingJournal.name;
                const incomingPages = Array.from(incomingJournal.pages || []);
                const pagesDiffer = incomingPages.some(ip => {
                    const ep = journal.pages.get(ip.id);
                    return !ep || ep.name !== ip.name || (ip.text?.content && ep.text?.content !== ip.text.content);
                });

                if (nameDiffers || pagesDiffer) {
                    if (nameDiffers) {
                        await journal.update({ name: incomingJournal.name }, { pack: null });
                    }
                    await synchronizeJournalPages(journal, incomingJournal);
                }
            }
        } catch (error) {
            console.error(`Błąd synchronizacji dzienników z ${pack.collection}:`, error);
        }
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

// Actor links in initialized Journals resolve to world Actors rather than the
// live translated compendium. Imports made by an older initializer retained a
// translated Actor name but left embedded Skills, Talents and trappings in
// English. Repair those legacy Actors once, using the same narrow set of
// localization-owned fields as normal reinitialization.
Hooks.once("ready", async () => {
    if (!game.user?.isGM || game.i18n?.lang !== "pl") {
        return;
    }

    await organizeEnemyWithinFolders();
    await synchronizeWorldJournals();

    const translationModuleId = activeCorePlModuleId();
    const versions = foundry.utils.deepClone(
        game.settings.get(translationModuleId, "embeddedActorTranslationVersions") || {}
    );
    let versionsChanged = false;
    let repairedActors = 0;

    for (const moduleId of getTranslatedActorModules()) {
        if (versions[moduleId] >= EMBEDDED_ACTOR_TRANSLATION_VERSION) {
            continue;
        }
        const module = game.modules.get(moduleId);
        if (!module?.active) {
            continue;
        }
        const declaredActorPackId = (module.flags?.initializationPacks || []).find(packId =>
            game.packs.get(packId)?.documentName === "Actor"
        );
        // Some official modules (notably Winds of Magic) expose an Actor pack
        // but omit it from initializationPacks because Journals import those
        // Actors lazily. Still use that pack as the localization source.
        const actorPack = game.packs.get(declaredActorPackId)
            ?? game.packs.get(`${moduleId}.actors`);
        if (!actorPack || !game.babele?.isTranslated?.(actorPack)) {
            continue;
        }

        try {
            const translatedActors = await actorPack.getDocuments();
            for (const incomingActor of translatedActors) {
                const actor = game.actors.get(incomingActor.id);
                if (!actor || actor.getFlag("warhammer-lib", "source") !== moduleId) {
                    continue;
                }
                if (actorEmbeddedTranslationDiffers(actor, incomingActor)) {
                    await synchronizeActorLocalization(actor, incomingActor);
                    await synchronizeActorItems(actor, incomingActor);
                    repairedActors++;
                }
            }
            versions[moduleId] = EMBEDDED_ACTOR_TRANSLATION_VERSION;
            versionsChanged = true;
        }
        catch (error) {
            console.error(`${translationModuleId} | Nie udało się naprawić osadzonych tłumaczeń aktorów z ${moduleId}.`, error);
        }
    }

    if (versionsChanged) {
        await game.settings.set(translationModuleId, "embeddedActorTranslationVersions", versions);
    }
    if (repairedActors) {
        ui.notifications.info(`Naprawiono osadzone tłumaczenia ${repairedActors} aktorów WFRP.`);
    }
});

function actorEmbeddedTranslationDiffers(actor, incomingActor) {
    const incomingActorData = incomingActor.toObject();
    const actorData = actor.toObject();
    for (const path of LOCALIZED_ACTOR_PATHS) {
        if (foundry.utils.hasProperty(incomingActorData, path)
            && JSON.stringify(foundry.utils.getProperty(incomingActorData, path))
                !== JSON.stringify(foundry.utils.getProperty(actorData, path))) {
            return true;
        }
    }
    const incomingItems = Array.from(incomingActor.items || []);
    for (const incomingItem of incomingItems) {
        const existingItem = actor.items.get(incomingItem.id);
        if (!existingItem) {
            return true;
        }
        for (const path of LOCALIZED_ITEM_PATHS) {
            if (!foundry.utils.hasProperty(incomingItem, path)) {
                continue;
            }
            const incomingValue = foundry.utils.getProperty(incomingItem, path);
            const existingValue = foundry.utils.getProperty(existingItem, path);
            if (JSON.stringify(incomingValue) !== JSON.stringify(existingValue)) {
                return true;
            }
        }
    }
    return false;
}

async function synchronizeActorLocalization(actor, incomingActor) {
    const incomingActorData = incomingActor.toObject();
    const update = {};
    for (const path of LOCALIZED_ACTOR_PATHS) {
        if (foundry.utils.hasProperty(incomingActorData, path)) {
            foundry.utils.setProperty(
                update,
                path,
                foundry.utils.deepClone(foundry.utils.getProperty(incomingActorData, path))
            );
        }
    }
    if (Object.keys(update).length) {
        await actor.update(update);
    }
}

const prepareInitializationContext = WarhammerModuleInitializationV2.prototype._prepareContext;
WarhammerModuleInitializationV2.prototype._prepareContext = async function(options) {
    const context = await prepareInitializationContext.call(this, options);
    for (const module of context.modules || []) {
        module.tooltip ??= module.title || "";
    }
    return context;
};

// Bezpiecznik: automatyczne przypisanie do właściwych folderów dokumentów
// posiadających nieistniejące (osierocone) ID folderu z oficjalnych paczek DLC (np. UA1, UA2, Zestaw Startowy, Archiwa).
Hooks.once("ready", async () => {
    if (!game.user?.isGM) return;

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

