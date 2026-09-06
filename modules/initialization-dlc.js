// Zunifikowany inicjalizator tłumaczeń dla oficjalnych modułów (DLC) WFRP4e.
// Obsługuje wyłącznie te moduły, które są aktualnie zainstalowane i aktywne w świecie gry.
// Dynamicznie korzysta ze ścieżki aktywnego modułu tłumaczącego (wfrp4e-core-pl).

function getModulePath() {
    return game.wfrp4eCorePl?.MODULE_PATH ?? `modules/${game.wfrp4eCorePl?.MODULE_ID ?? "wfrp4e-core-pl"}`;
}

function getLogPrefix() {
    return `${game.wfrp4eCorePl?.MODULE_ID ?? "wfrp4e-core-pl"} |`;
}

// ---------------------------------------------------------------------------
// 1. Tłumaczenia ustawień modułów (Hooks.on("init"))
// ---------------------------------------------------------------------------
Hooks.on("init", () => {
    if (game.i18n?.lang !== "pl") return;

    // --- Rough Nights & Hard Days ---
    if (game.modules.get("wfrp4e-rnhd")?.active) {
        const rnhdSettings = {
            clock: { name: "WFRP4E_RNHD_PL.Clock" },
            clockApp: { name: "WFRP4E_RNHD_PL.ClockApp" },
            showClock: { name: "WFRP4E_RNHD_PL.ShowClock", hint: "WFRP4E_RNHD_PL.ShowClockHint" },
            syncClock: { name: "WFRP4E_RNHD_PL.SyncClock", hint: "WFRP4E_RNHD_PL.SyncClockHint" },
        };
        for (const [key, text] of Object.entries(rnhdSettings)) {
            const setting = game.settings.settings.get("wfrp4e-rnhd." + key);
            if (!setting) continue;
            setting.name = game.i18n.localize(text.name);
            if (text.hint) setting.hint = game.i18n.localize(text.hint);
        }
    }

    // --- Enemy in Shadows (dharRules rejestrowane po init, gotowe na ready) ---
    if (game.modules.get("wfrp4e-eis")?.active) {
        Hooks.once("ready", () => {
            const dharRulesSetting = game.settings.settings.get("wfrp4e-eis.dharRules");
            if (dharRulesSetting) {
                dharRulesSetting.name = "Zasady splatania Dhar";
                dharRulesSetting.hint = "Użyj specjalnych zasad splatania Dhar opisanych na stronie 78 Niezbędnika";
            }
        });
    }
});

// ---------------------------------------------------------------------------
// 2. Tłumaczenia konfiguracji systemowej, karier i handlu (Hooks.once("ready"))
// ---------------------------------------------------------------------------
Hooks.once("ready", async () => {
    if (game.i18n?.lang !== "pl") return;

    const utility = game.wfrp4e?.utility;
    const config = game.wfrp4e?.config;

    /** Pomocnik do bezpiecznego usuwania i dodawania zamienników karier */
    function applyCareerReplacements(toRemove, toMerge) {
        const replacements = config?.speciesCareerReplacements;
        if (!replacements || typeof utility?.mergeCareerReplacements !== "function") return;

        for (const [species, careers] of Object.entries(toRemove)) {
            if (!replacements[species]) continue;
            for (const career of careers) {
                delete replacements[species][career];
            }
        }
        utility.mergeCareerReplacements(toMerge);
    }

    let gazetteerLoaded = false;
    /** Pomocnik do wczytywania gazetteer.json dla handlu rzecznego (DotR / Up in Arms) */
    async function loadRiverGazetteer() {
        if (gazetteerLoaded) return;
        gazetteerLoaded = true;
        try {
            const response = await fetch(`${getModulePath()}/gazetteer.json`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const translatedGazetteer = await response.json();
            const gazetteer = game.wfrp4e?.trade?.gazetteers?.river;
            if (!Array.isArray(gazetteer)) throw new Error("Brak tablicy gazetteers.river");

            for (const record of translatedGazetteer) {
                const existing = gazetteer.find(entry => entry.name === record.name);
                if (existing) {
                    foundry.utils.mergeObject(existing, record);
                } else {
                    gazetteer.push(record);
                }
            }
        } catch (error) {
            console.warn(`${getLogPrefix()} Nie udało się wczytać gazetteer.json dla handlu rzecznego.`, error);
        }
    }

    // =======================================================================
    // Death on the Reik
    // =======================================================================
    if (game.modules.get("wfrp4e-dotr")?.active) {
        const river = game.wfrp4e?.trade?.tradeData?.river;
        if (river) {
            Object.assign(river.cargoTypes ??= {}, {
                grain: "Zboże",
                armaments: "Uzbrojenie",
                luxuries: "Luksusy",
                metal: "Metal",
                timber: "Drewno",
                wine: "Wino",
                brandy: "Brandy",
                wool: "Wełna",
            });

            river.trade ??= {};
            Object.assign(river.trade.qualities ??= {}, {
                swill: "Podły",
                passable: "Znośny",
                average: "Przeciętny",
                good: "Dobry",
                excellent: "Doskonały",
                topshelf: "Najwyższej jakości",
            });

            await loadRiverGazetteer();
        }
    }

    // =======================================================================
    // Up in Arms
    // =======================================================================
    if (game.modules.get("wfrp4e-up-in-arms")?.active) {
        // Akcje Przewagi
        const configuredActions = game.wfrp4e?.config?.groupAdvantageActions;
        if (Array.isArray(configuredActions)) {
            const batter = configuredActions.find(a => a.name === "Batter");
            const trick = configuredActions.find(a => a.name === "Trick");
            const additionalEffort = configuredActions.find(a => a.name === "Additional Effort");
            const fleeFromHarm = configuredActions.find(a => a.name === "Flee from Harm");
            const additionalAction = configuredActions.find(a => a.name === "Additional Action");

            if (batter) {
                batter.name = "Grzmotnięcie";
                batter.description = "Kiedy masz do czynienia z bardziej uzdolnionym przeciwnikiem, czasem brutalna siła pozwala zwyciężyć tam, gdzie inne podejścia zawiodą.";
                batter.effect = "<strong>Akcja Specjalna</strong>: Aby postać Grzmotnęła przeciwnika, musi wykonać Test Przeciwstawny Siła/Siła. Jeśli Bohater wygrał w Teście, to jego przeciwnik otrzymuje +1 do Przewagi oraz Stan @Condition[Powalenie]. Jeżeli Bohater przegra Test Przeciwstawny, to jego przeciwnik otrzymuje +1 do Przewagi, a Akcja się kończy. Postać nie otrzymuje Przewagi za Wygraną, gdy wygrywa ten Test Przeciwstawny";
            }
            if (trick) {
                trick.name = "Sztuczka";
                trick.description = "Poświęcasz moment na rzucenie przeciwnikowi ziemią w oczy albo podpalenie go chluśniętym płonącym olejem. To ryzykowny manewr i niewielu wrogów da się oszukać w ten sam sposób więcej niż raz.";
                trick.effect = "<strong>Akcja Specjalna</strong>: Sztuczka wymaga wykonania Testu Przeciwstawnego Zwinność/Zwinność z przeciwnikiem. Jeśli Bohater wygra w Teście, otrzymuje +1 do Przewagi. Jeżeli MG uzna, że okoliczności to uzasadniają, może również przyznać przeciwnikowi jeden z podanych Stanów: @Condition[Podpalenie], @Condition[Oślepienie] albo @Condition[Pochwycenie]. Jeśli Bohater przegra Test Przeciwstawny, to przeciwnik otrzymuje +1 do Przewagi, a Akcja się kończy. MG może nie zgodzić się na przyznanie żadnego z wymienionych wyżej Stanów, jeżeli postać nie ma pod ręką odpowiedniego przedmiotu albo przyznała wcześniej ten Stan temu samemu przeciwnikowi. Postać nie otrzymuje Przewagi za Wygraną, gdy wygrywa ten Test Przeciwstawny.";
            }
            if (additionalEffort) {
                additionalEffort.name = "Dodatkowy Wysiłek";
                additionalEffort.description = "W desperackich okolicznościach możesz wykorzystać swój impet, by zwiększyć szanse na sukces.";
                additionalEffort.effect = "<strong>Darmowa Akcja</strong>: Postać otrzymuje premię +10 do dowolnego Testu, zanim go wykona. Może wydać dodatkowe punkty, aby otrzymać kumulatywną premię +10 za każdy wydany punkt Przewagi. Dla przykładu, postać może wydać 3 punkty Przewagi, aby otrzymać premię +20, albo 4 punkty Przewagi, by otrzymać premię +30. Test, do którego została użyta ta premia, nigdy nie generuje Przewagi wykonującemu go Bohaterowi.";
            }
            if (fleeFromHarm) {
                fleeFromHarm.name = "Ucieczka przed Zagrożeniem";
                fleeFromHarm.description = "Wykorzystujesz moment chwilowego spokoju albo rozproszenie uwagi przeciwnika i wycofujesz się z walki.";
                fleeFromHarm.effect = "<strong>Ruch</strong>: Postać może odsunąć się od przeciwnika bez żadnych kar. Ta Akcja ignoruje zasady @UUID[Compendium.wfrp4e-core.journals.NS3YGlJQxwTggjRX.JournalEntryPage.bdfiyhEYtKs7irqc#disengaging]{Odwrotu}.";
            }
            if (additionalAction) {
                additionalAction.name = "Dodatkowa Akcja";
                additionalAction.description = "Wykorzystujesz okazję do działania, żeby osiągnąć coś wyjątkowego.";
                additionalAction.effect = "<strong>Darmowa Akcja</strong>: Postać może wykonać dodatkową Akcję. Ta Akcja nigdy nie generuje Przewagi wykonującemu ją Bohaterowi. Postać może wydać punkty Przewagi, by wykonać dodatkową Akcję, tylko raz na Turę.";
            }
        }

        // Dodatkowe typy ładunków
        const cargoTypes = game.wfrp4e?.trade?.tradeData?.river?.cargoTypes;
        if (cargoTypes) {
            cargoTypes.citrusFruit = "Cytrusy";
            cargoTypes.olives = "Oliwki";
            cargoTypes.saltfish = "Solone Ryby";
            cargoTypes.stone = "Kamień";
        }

        // Zamienniki karier
        applyCareerReplacements(
            {
                human: ["Engineer", "Scholar", "Pedlar", "Cavalryman", "Knight", "Soldier", "Warrior Priest"],
                dwarf: ["Engineer", "Scholar", "Pedlar", "Soldier"],
                helf: ["Scholar", "Pedlar", "Cavalryman", "Soldier"],
                welf: ["Scholar", "Pedlar", "Soldier"],
                halfling: ["Engineer", "Scholar", "Pedlar", "Soldier"],
                "human-tilean": ["Flagellant"],
            },
            {
                human: {
                    "Inżynier": ["Artylerzysta"],
                    "Uczony": ["Kartografka"],
                    "Domokrążca": ["Ciura Obozowa"],
                    "Kawalerzysta": ["Lekki Kawalerzysta"],
                    "Rycerz": ["Rycerz Najemny", "Rycerz Płonącego Słońca", "Rycerz Białego Wilka", "Rycerz Pantery"],
                    "Żołnierz": ["Łuczniczka", "Halabardnik", "Strzelec", "Gwardzista Elektorski", "Pikinier", "Specjalista Oblężniczy"],
                    "Kapłan Bitewny": ["Kapłan Myrmidii"],
                },
                dwarf: {
                    "Inżynier": ["Artylerzysta"],
                    "Uczony": ["Kartografka"],
                    "Domokrążca": ["Ciura Obozowa"],
                    "Żołnierz": ["Halabardnik", "Strzelec", "Specjalista Oblężniczy"],
                },
                helf: {
                    "Uczony": ["Kartografka"],
                    "Domokrążca": ["Ciura Obozowa"],
                    "Kawalerzysta": ["Lekki Kawalerzysta"],
                    "Żołnierz": ["Łuczniczka", "Specjalista Oblężniczy", "Artylerzysta"],
                },
                welf: {
                    "Uczony": ["Kartografka"],
                    "Domokrążca": ["Ciura Obozowa"],
                    "Żołnierz": ["Łuczniczka"],
                    "Kawalerzysta": ["Lekki Kawalerzysta"],
                },
                halfling: {
                    "Inżynier": ["Artylerzysta"],
                    "Uczony": ["Kartografka"],
                    "Domokrążca": ["Ciura Obozowa"],
                    "Żołnierz": ["Łuczniczka", "Halabardnik", "Strzelec", "Specjalista Oblężniczy"],
                },
                "human-tilean": {
                    "Biczownik": ["Mniszka", "Kapłan"],
                },
            }
        );

        await loadRiverGazetteer();
    }

    // =======================================================================
    // Winds of Magic
    // =======================================================================
    if (game.modules.get("wfrp4e-wom")?.active) {
        if (config?.loreEffectDescriptions) {
            config.loreEffectDescriptions["shadow"] = game.i18n.localize("WFRP4E.LoreDescription.ShadowWoM");
        }

        applyCareerReplacements(
            {
                human: ["Apothecary", "Wizard", "Mystic", "Guard"],
                gnome: ["Wizard"],
                dwarf: ["Apothecary", "Guard"],
                halfling: ["Apothecary", "Guard"],
            },
            {
                human: {
                    "Aptekarka": ["Świecka Alchemiczka"],
                    "Czarodziej": ["Hierofant", "Alchemik", "Druidka", "Astromanta", "Czarodziej Kolegium Cieni", "Spirytysta", "Piromanta", "Szamanka", "Magister Rewizor"],
                    "Mistyczka": ["Jasnowidząca"],
                    "Ochroniarz": ["Bedel"],
                },
                gnome: {
                    "Czarodziej": ["Czarodziej Kolegium Cieni"],
                },
                dwarf: {
                    "Aptekarka": ["Świecka Alchemiczka"],
                    "Ochroniarz": ["Bedel"],
                },
                halfling: {
                    "Aptekarka": ["Świecka Alchemiczka"],
                    "Ochroniarz": ["Bedel"],
                },
            }
        );
    }

    // =======================================================================
    // Archives of the Empire: Vol I
    // =======================================================================
    if (game.modules.get("wfrp4e-archives1")?.active) {
        applyCareerReplacements(
            {
                dwarf: ["Messenger"],
                welf: ["Bounty Hunter"],
                halfling: ["Road Warden", "Road warden", "Soldier"],
            },
            {
                dwarf: {
                    "Posłaniec": ["Zwiadowczyni z Karaku"],
                },
                welf: {
                    "Łowczyni Nagród": ["Wędrowny Duch"],
                },
                halfling: {
                    "Strażniczka Dróg": ["Strażniczka Pól"],
                    "Żołnierz": ["Borsuczy Jeździec"],
                },
            }
        );
    }
});
