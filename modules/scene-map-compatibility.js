// Polish map corrections. Source compendia and English games stay unchanged.
const SCENE_MAP_MODULE_ID = import.meta.url.match(/modules\/([^/]+)/)?.[1] ?? "wfrp4e-core-pl";
const MILES_TO_KM = 1.609344;
const isMiles = units => /^(?:mi\.?|miles?|mile|mila|mile|mil|mili|mils|miles?\s*\(.*\))$/iu.test(String(units ?? "").trim());
const kilometers = distance => Math.round(Number(distance) * MILES_TO_KM * 1e6) / 1e6;
// Verified source scene IDs and original distances; also repairs older imports
// whose catalogs changed only the unit label, leaving mile-valued distances.
const MILE_SCENE_RULES = {
    "SmQJpAnynYyOBusA": {
        "pack": "wfrp4e-archives1.scenes",
        "originalName": "The Mootland",
        "distance": 5,
        "kmDistance": 8.04672
    },
    "h9ZlLGfW0lZKIG4k": {
        "pack": "wfrp4e-archives1.scenes",
        "originalName": "The Laurelorn",
        "distance": 5,
        "kmDistance": 8.04672
    },
    "vGrxlojYtdObKLF6": {
        "pack": "wfrp4e-core.scenes",
        "originalName": "Reikland",
        "distance": 2.5,
        "kmDistance": 4.02336
    },
    "yP2ara84Sj86X6ZE": {
        "pack": "wfrp4e-dotr.scenes",
        "originalName": "The Devil's Bowl",
        "distance": 1,
        "kmDistance": 1.609344
    },
    "3c6zrSdav47pSYaK": {
        "pack": "wfrp4e-eis.scenes",
        "originalName": "Altdorf to Bögenhafen",
        "distance": 2.5,
        "kmDistance": 4
    },
    "wCv7C3xQbpK5mEIw": {
        "pack": "wfrp4e-eis.scenes",
        "originalName": "Duchy of Saponatheim",
        "distance": 1.25,
        "kmDistance": 2
    },
    "ogsSCBC6huv9uASx": {
        "pack": "wfrp4e-horned-rat.scenes",
        "originalName": "Middenland",
        "distance": 2,
        "kmDistance": 3.2
    },
    "KIXHWLTroXF59wDs": {
        "pack": "wfrp4e-middenheim.scenes",
        "originalName": "Grand Duchy of Middenheim",
        "distance": 2,
        "kmDistance": 3.218688
    },
    "wKIRZs2Jo7MPZG1Q": {
        "pack": "wfrp4e-pbtt.scenes",
        "originalName": "Altdorf to Middenheim",
        "distance": 10,
        "kmDistance": 16.09344
    },
    "1PWK0cDuQmNiQJGy": {
        "pack": "wfrp4e-salzenmund.scenes",
        "originalName": "Grand Barony of Nordland",
        "distance": 10,
        "kmDistance": 16.09344
    },
    "NaLtcXkZdcnvHL5Y": {
        "pack": "wfrp4e-soc.scenes",
        "originalName": "Sea of Claws",
        "distance": 32,
        "kmDistance": 51.499008
    },
    "fOaKiEBW8tAY2sus": {
        "pack": "wfrp4e-soc.scenes",
        "originalName": "The Southern Coast",
        "distance": 44,
        "kmDistance": 70.811136
    },
    "LyOavLLMR3Y5Hq09": {
        "pack": "wfrp4e-starter-set.scenes",
        "originalName": "Ubersreik Duchy",
        "distance": 0.1,
        "kmDistance": 0.160934
    },
    "dffFQGeXYq79AE8p": {
        "pack": "wfrp4e-starter-set.scenes",
        "originalName": "Ubersreik Surrounds",
        "distance": 5,
        "kmDistance": 8.04672
    },
    "hxmQBCH1wF5PL6g9": {
        "pack": "wfrp4e-ua1.scenes",
        "originalName": "Road to the Tower of Vane",
        "distance": 0.5,
        "kmDistance": 0.75
    },
    "jZWoauy9VMH1hCIm": {
        "pack": "wfrp4e-ua1.scenes",
        "originalName": "Grausee Environs",
        "distance": 0.25,
        "kmDistance": 0.402336
    }
};
const MAP_MARKERS = {
    k6lxEoUkjJBgFFff: {pack: "wfrp4e-dotr.scenes", originalName: "Under The Castle", drawings: {}, labels: {
        TjfdDBZUgb9b6yE9: {from: ["Half a mile", "Pół mili"], to: "0,8 km"}
    }},
    XeqaGwPkcvKcnPLd: {pack: "wfrp4e-dotr.scenes", originalName: "Elvyra's House", drawings: {
        fsg5cZoqjQEMFiRM: "A", "48VRHHTFYy5BY55x": "B", Z0AcBiv3sMupOZvs: "C", wcJPXuE25zTufZd8: "D", "2c1N2LB55AHJfDjF": "E"
    }},
    "8MQkKCUMV45D08D2": {pack: "wfrp4e-dotr.scenes", originalName: "The Signal Tower", image: "images/dotr/maps/signal-tower-clean-pl.webp", drawings: {
        "5yJocye0b5lCJxA5": "A", DJ609CQf3inlOKRF: "B", P5vcRHlSd7ZVu7GD: "C", BTe11QXxtqNTYjLT: "D", ZiB049fQxGxvRVCu: "E", Zf6xOynMolShMGad: "F", IRahad9pUnKPRSs2: "G", tU3fBUBViOOfCvNF: "H", ahjD8pfzlZOuvJn7: "1", "1dXBhek5RT6Ak6RX": "2", carsjebR6XO8rOkU: "3"
    }}
};

function mapModuleIdentity(scene, rule) {
    const sourceModule = scene.flags?.["warhammer-lib"]?.source;
    const originalName = scene.flags?.babele?.originalName ?? scene.name;
    const sourceUuid = scene._stats?.compendiumSource ?? scene.flags?.core?.sourceId;
    return sourceModule === rule.pack.split(".")[0]
        || originalName === rule.originalName
        || sourceUuid?.startsWith(`Compendium.${rule.pack}.`);
}

Hooks.on("babele.translateDocumentData", context => {
    if (game.i18n?.lang !== "pl" || context.metadata?.type !== "Scene"
        || !context.metadata.id?.startsWith("wfrp4e-")) return;
    const source = context.source;
    context.translated ??= {};
    if (isMiles(source?.grid?.units) && Number.isFinite(Number(source.grid.distance)) && Number(source.grid.distance) > 0) {
        const authoredDistance = context.translation?.units === "km" ? Number(context.translation?.distance) : NaN;
        const distance = Number.isFinite(authoredDistance) && authoredDistance > 0 && authoredDistance !== Number(source.grid.distance)
            ? authoredDistance : kilometers(source.grid.distance);
        context.translated.grid = {...(context.translated.grid ?? {}), units: "km", distance};
    }
    const rule = MAP_MARKERS[source?._id];
    if (!rule || context.metadata.id !== rule.pack) return;
    const drawings = Array.from(source.drawings ?? [], drawing => foundry.utils.deepClone(drawing.toObject?.() ?? drawing));
    const translatedDrawings = new Map(Array.from(context.translated.drawings ?? [], drawing => [drawing._id, drawing]));
    for (const drawing of drawings) {
        Object.assign(drawing, translatedDrawings.get(drawing._id) ?? {});
        if (rule.drawings[drawing._id] === drawing.text) drawing.text = "";
        const label = rule.labels?.[drawing._id];
        if (label?.from.includes(drawing.text)) drawing.text = label.to;
    }
    context.translated.drawings = drawings;
});

// Apply corrections to imported scenes on reload through Foundry's public API.
// A single active GM performs the migration; each operation is idempotent.
Hooks.once("ready", async () => {
    if (game.i18n?.lang !== "pl" || !game.user?.isGM
        || (game.users?.activeGM && game.users.activeGM.id !== game.user.id)) return;
    try {
        for (const scene of game.scenes ?? []) {
            const updates = {};
            const grid = scene.grid ?? {};
            const mileRule = MILE_SCENE_RULES[scene.id];
            const legacy = mileRule && mapModuleIdentity(scene, mileRule)
                && grid.units === "km" && Number(grid.distance) === mileRule.distance;
            if ((isMiles(grid.units) || legacy) && Number.isFinite(Number(grid.distance)) && Number(grid.distance) > 0) {
                updates["grid.units"] = "km";
                updates["grid.distance"] = legacy ? mileRule.kmDistance : kilometers(grid.distance);
            }
            const markerRule = MAP_MARKERS[scene.id];
            if (markerRule && mapModuleIdentity(scene, markerRule)) {
                const drawings = Array.from(scene.drawings ?? []).flatMap(drawing => {
                    if (markerRule.drawings[drawing.id] === drawing.text) return [{_id: drawing.id, text: ""}];
                    const label = markerRule.labels?.[drawing.id];
                    return label?.from.includes(drawing.text) ? [{_id: drawing.id, text: label.to}] : [];
                });
                if (drawings.length) await scene.updateEmbeddedDocuments("Drawing", drawings, {pack: null});
                if (markerRule.image) {
                    const image = `modules/${SCENE_MAP_MODULE_ID}/${markerRule.image}`;
                    const levels = Array.from(scene.levels ?? []);
                    const initialLevel = levels.find(level => level.id === scene.initialLevel?.id || level.id === scene.initialLevel) ?? levels[0];
                    // Preserve a custom background; replace only the supplied
                    // module assets that were verified as the annotated map.
                    const isOriginal = src => /^(?:modules\/(?:wfrp4e-core-pl(?:-dev)?\/images\/dotr\/maps|wfrp4e-dotr\/assets\/maps)\/signal-tower(?:-unlabeled|-vtt)?\.webp)$/u.test(src ?? "");
                    if (initialLevel && isOriginal(initialLevel.background?.src)) {
                        await scene.updateEmbeddedDocuments("Level", [{_id: initialLevel.id, "background.src": image}], {pack: null});
                    } else if (!levels.length && isOriginal(scene.background?.src)) updates["background.src"] = image;
                }
            }
            if (Object.keys(updates).length) await scene.update(updates, {pack: null});
        }
    } catch (error) {
        console.error(`${SCENE_MAP_MODULE_ID} | Nie udało się zastosować poprawek map.`, error);
        ui.notifications?.warn("Nie udało się zastosować wszystkich poprawek map. Szczegóły znajdują się w konsoli.");
    }
});
