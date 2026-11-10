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
        "distance": 5,
        "kmDistance": 8.04672
    },
    "h9ZlLGfW0lZKIG4k": {
        "pack": "wfrp4e-archives1.scenes",
        "distance": 5,
        "kmDistance": 8.04672
    },
    "vGrxlojYtdObKLF6": {
        "pack": "wfrp4e-core.scenes",
        "distance": 2.5,
        "kmDistance": 4.02336
    },
    "yP2ara84Sj86X6ZE": {
        "pack": "wfrp4e-dotr.scenes",
        "distance": 1,
        "kmDistance": 1.609344
    },
    "3c6zrSdav47pSYaK": {
        "pack": "wfrp4e-eis.scenes",
        "distance": 2.5,
        "kmDistance": 4
    },
    "wCv7C3xQbpK5mEIw": {
        "pack": "wfrp4e-eis.scenes",
        "distance": 1.25,
        "kmDistance": 2
    },
    "ogsSCBC6huv9uASx": {
        "pack": "wfrp4e-horned-rat.scenes",
        "distance": 2,
        "kmDistance": 3.2
    },
    "KIXHWLTroXF59wDs": {
        "pack": "wfrp4e-middenheim.scenes",
        "distance": 2,
        "kmDistance": 3.218688
    },
    "wKIRZs2Jo7MPZG1Q": {
        "pack": "wfrp4e-pbtt.scenes",
        "distance": 10,
        "kmDistance": 16.09344
    },
    "1PWK0cDuQmNiQJGy": {
        "pack": "wfrp4e-salzenmund.scenes",
        "distance": 10,
        "kmDistance": 16.09344
    },
    "NaLtcXkZdcnvHL5Y": {
        "pack": "wfrp4e-soc.scenes",
        "distance": 32,
        "kmDistance": 51.499008
    },
    "fOaKiEBW8tAY2sus": {
        "pack": "wfrp4e-soc.scenes",
        "distance": 44,
        "kmDistance": 70.811136
    },
    "LyOavLLMR3Y5Hq09": {
        "pack": "wfrp4e-starter-set.scenes",
        "distance": 0.1,
        "kmDistance": 0.160934
    },
    "dffFQGeXYq79AE8p": {
        "pack": "wfrp4e-starter-set.scenes",
        "distance": 5,
        "kmDistance": 8.04672
    },
    "hxmQBCH1wF5PL6g9": {
        "pack": "wfrp4e-ua1.scenes",
        "distance": 0.5,
        "kmDistance": 0.75
    },
    "jZWoauy9VMH1hCIm": {
        "pack": "wfrp4e-ua1.scenes",
        "distance": 0.25,
        "kmDistance": 0.402336
    }
};
const MAP_MARKERS = {
    k6lxEoUkjJBgFFff: {pack: "wfrp4e-dotr.scenes", drawings: {}, labels: {
        TjfdDBZUgb9b6yE9: {from: ["Half a mile", "Pół mili"], to: "0,8 km"}
    }},
    XeqaGwPkcvKcnPLd: {pack: "wfrp4e-dotr.scenes", drawings: {
        fsg5cZoqjQEMFiRM: "A", "48VRHHTFYy5BY55x": "B", Z0AcBiv3sMupOZvs: "C", wcJPXuE25zTufZd8: "D", "2c1N2LB55AHJfDjF": "E"
    }},
    "8MQkKCUMV45D08D2": {pack: "wfrp4e-dotr.scenes", image: "images/dotr/maps/signal-tower-clean-pl.webp", drawings: {
        "5yJocye0b5lCJxA5": "A", DJ609CQf3inlOKRF: "B", P5vcRHlSd7ZVu7GD: "C", BTe11QXxtqNTYjLT: "D", ZiB049fQxGxvRVCu: "E", Zf6xOynMolShMGad: "F", IRahad9pUnKPRSs2: "G", tU3fBUBViOOfCvNF: "H", ahjD8pfzlZOuvJn7: "1", "1dXBhek5RT6Ak6RX": "2", carsjebR6XO8rOkU: "3"
    }}
};

// Prepare source data before it reaches the managed Scene writer.
export function applySceneMapCorrections(pack, data, source = data, translation = null) {
    if (game.i18n?.lang !== "pl" || !pack?.startsWith("wfrp4e-")) return;
    const grid = source.grid;
    const rule = MILE_SCENE_RULES[source._id];
    const known = rule?.pack === pack;
    const authored = translation?.units === "km" ? Number(translation.distance) : NaN;
    const distance = Number(grid?.distance);
    if (distance > 0 && Number.isFinite(distance) && isMiles(grid.units)) {
        const converted = Number.isFinite(authored) && authored > 0 && authored !== distance
            ? authored : known && distance === rule.distance ? rule.kmDistance : kilometers(distance);
        data.grid = {...data.grid, units: "km", distance: converted};
    } else if (known && grid?.units === "km" && distance === rule.distance) {
        data.grid = {...data.grid, units: "km", distance: rule.kmDistance};
    }

    const marker = MAP_MARKERS[source._id];
    if (marker?.pack !== pack) return;
    const translated = new Map((data.drawings ?? []).map(drawing => [drawing._id, drawing]));
    data.drawings = (source.drawings ?? []).map(drawing => {
        const result = {...drawing, ...translated.get(drawing._id)};
        if (marker.drawings[result._id] === result.text) result.text = "";
        const label = marker.labels?.[result._id];
        if (label?.from.includes(result.text)) result.text = label.to;
        return result;
    });
    if (!marker.image) return;
    const image = `modules/${SCENE_MAP_MODULE_ID}/${marker.image}`;
    const isOriginal = src => /^(?:modules\/(?:wfrp4e-core-pl(?:-dev)?\/images\/dotr\/maps|wfrp4e-dotr\/assets\/maps)\/signal-tower(?:-unlabeled|-vtt)?\.webp)$/u.test(src ?? "");
    const levels = data.levels ?? source.levels ?? [];
    const initial = levels.find(level => level._id === source.initialLevel) ?? levels[0];
    if (initial && isOriginal(initial.background?.src)) {
        data.levels = levels.map(level => level === initial ? {...level, background: {...level.background, src: image}} : level);
    } else if (!levels.length && isOriginal((data.background ?? source.background)?.src)) {
        data.background = {...source.background, ...data.background, src: image};
    }
}

Hooks.on("babele.translateDocumentData", context => {
    if (context.metadata?.type !== "Scene" || !context.source) return;
    context.translated ??= {};
    applySceneMapCorrections(context.metadata.id, context.translated, context.source, context.translation);
});
