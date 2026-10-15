// WOM 8.0.0 calculation aliases: leave printed Polish catalogue values intact.
// Each entry is bound to a verified package/document/field and exact current
// Polish value. Source: QA mechanics-20261005, live WOM8.0.0 and formula matrix.
const PATCH_MARK = Symbol.for("wfrp4e-core-pl.womFormulaCompatibility");
const SOURCE_VERSION = "8.0.0";
const FORMULAS = Object.freeze({
  "JzUOxYn7XE3Zhg3W": {
    "target": {
      "polish": "2 * Liczba metrów równa Bonusowi z Siły Woli",
      "source": "2 * Willpower Bonus yards"
    }
  },
  "UYcCoPIU04pVkO2o": {
    "duration": {
      "polish": "Liczba Rund równa Bonusowi z Siły Woli",
      "source": "Willpower Bonus rounds"
    }
  },
  "COaNkxIMFeozaMf7": {
    "target": {
      "polish": "Obszarowy (liczba metrów równa podwojonemu Bonusowi z Siły Woli)",
      "source": "2 * Willpower Bonus yards",
      "legacy_polish": [
        "2 * Liczba metrów równa Bonusowi z Siły Woli"
      ]
    }
  },
  "zfmssBqegTtEZi3J": {
    "duration": {
      "polish": "Liczba godzin równa Bonusowi z Siły Woli",
      "source": "Willpower Bonus hours"
    }
  },
  "9qkCLz7PBn5sZn5F": {
    "duration": {
      "polish": "Liczba minut równa Bonusowi z Wytrzymałości",
      "source": "Toughness Bonus minutes"
    }
  },
  "Mz8nhhrRQ6fNNLT5": {
    "duration": {
      "polish": "Liczba godzin równa Bonusowi z Siły Woli",
      "source": "Willpower Bonus hours"
    }
  },
  "8SCyGqSBjYnj4KQn": {
    "duration": {
      "polish": "Liczba godzin równa Bonusowi z Siły Woli",
      "source": "Willpower Bonus hours"
    }
  },
  "0bF9Xv1PDUAMpoje": {
    "duration": {
      "polish": "Liczba Rund równa Bonusowi z Ogłady",
      "source": "Fellowship Bonus rounds"
    }
  },
  "YbwJulz5rceQvGoj": {
    "duration": {
      "polish": "Liczba Rund równa Bonusowi z Inicjatywy",
      "source": "Initiative Bonus rounds"
    }
  },
  "7GeXB8GydAG4D5lj": {
    "target": {
      "polish": "Obszarowy (liczba metrów równa Bonusowi z Siły Woli)",
      "source": "Willpower Bonus yards",
      "legacy_polish": [
        "Obszarowy (liczba metrów równa Bonusowi z Siły Woli) Czas: Liczba Rund równa Bonusowi z Siły Woli"
      ]
    }
  },
  "PSVw1sGzaSNiys35": {
    "duration": {
      "polish": "Liczba minut równa Bonusowi z Siły Woli",
      "source": "Willpower bonus minutes"
    }
  },
  "l4LjbYvFarD0d1r2": {
    "duration": {
      "polish": "Liczba minut równa Inicjatywie",
      "source": "Initiative minutes"
    }
  },
  "1NLkoyAF4VBErEfK": {
    "duration": {
      "polish": "Liczba godzin równa Bonusowi z Siły Woli",
      "source": "Willpower Bonus hours"
    }
  },
  "2t3wuPlBohihPhza": {
    "target": {
      "polish": "Obszarowy (liczba metrów równa podwojonemu Bonusowi z Siły Woli)",
      "source": "2 * Willpower Bonus yards",
      "legacy_polish": [
        "2 * Liczba metrów równa Bonusowi z Siły Woli"
      ]
    }
  },
  "h6SqKnUHlmRHYGIq": {
    "duration": {
      "polish": "Liczba godzin równa Bonusowi z Siły Woli",
      "source": "Willpower Bonus hours"
    }
  },
  "r0A4KwXt2woncVoz": {
    "duration": {
      "polish": "Liczba godzin równa Bonusowi z Siły Woli",
      "source": "Willpower Bonus hours"
    }
  },
  "NuHhIlQYYtIVBxiy": {
    "duration": {
      "polish": "Liczba godzin równa Bonusowi z Siły Woli",
      "source": "Willpower Bonus hours"
    },
    "target": {
      "polish": "Obszarowy (liczba kilometrów równa półtorakrotnemu Bonusowi z Siły Woli)",
      "source": "1500 * Willpower Bonus yards",
      "kilometres_note": true,
      "legacy_polish": [
        "Liczba kilometrów równa Bonusowi z Siły Woli"
      ]
    }
  },
  "085HM0937rTJZOg9": {
    "range": {
      "polish": "2 * Liczba metrów równa Bonusowi z Ogłady",
      "source": "2 * Fellowship Bonus yards"
    }
  },
  "Z6LsJmN1Dkmd2Y8I": {
    "duration": {
      "polish": "Liczba godzin równa Bonusowi z Siły Woli",
      "source": "Willpower Bonus hours"
    }
  },
  "S548dPRBpyJRnKCI": {
    "duration": {
      "polish": "Liczba godzin równa Bonusowi z Siły Woli",
      "source": "Willpower Bonus hours"
    }
  },
  "Kt61ifWQpjaaxOO7": {
    "duration": {
      "polish": "Liczba minut równa Bonusowi z Siły Woli",
      "source": "Willpower bonus minutes"
    }
  },
  "qfRrKg7Fx6qfXQ8C": {
    "target": {
      "polish": "2 * Liczba metrów równa Bonusowi z Siły Woli",
      "source": "2 * Willpower Bonus yards"
    }
  },
  "9d9TgE2h6n5pFsy3": {
    "duration": {
      "polish": "Liczba Rund równa Bonusowi z Siły",
      "source": "Strength Bonus rounds"
    }
  },
  "jXmMvcMsrCG4iZPI": {
    "duration": {
      "polish": "Liczba godzin równa Bonusowi z Siły Woli",
      "source": "Willpower Bonus hours"
    }
  },
  "q8yqpvBgYOEpCj7x": {
    "duration": {
      "polish": "Liczba Rund równa Bonusowi z Ogłady",
      "source": "Fellowship Bonus rounds"
    },
    "range": {
      "polish": "Liczba kilometrów równa półtorakrotności Siły Woli",
      "source": "1500 * Willpower yards",
      "kilometres_note": true,
      "legacy_polish": [
        "Liczba kilometrów równa wartości Siły Woli"
      ]
    }
  },
  "ATUOUwSEwK5FtiNS": {
    "duration": {
      "polish": "Liczba godzin równa Bonusowi z Siły Woli",
      "source": "Willpower Bonus hours"
    }
  },
  "OUlPM5woG08xN0KR": {
    "duration": {
      "polish": "Liczba Rund równa Bonusowi z Inicjatywy",
      "source": "Initiative Bonus rounds"
    }
  },
  "AFq5y4Zo911IJiq0": {
    "duration": {
      "polish": "Liczba godzin równa Bonusowi z Siły Woli",
      "source": "Willpower Bonus hours"
    }
  },
  "Y0Ic07GPtt528zbJ": {
    "duration": {
      "polish": "Liczba Rund równa Bonusowi z Inicjatywy",
      "source": "Initiative Bonus rounds"
    }
  },
  "okGsHEo5smeofHN8": {
    "duration": {
      "polish": "Liczba Rund równa Bonusowi z Inicjatywy",
      "source": "Initiative Bonus rounds"
    }
  },
  "sAQ62zV9dsOatdGg": {
    "duration": {
      "polish": "Liczba Rund równa Bonusowi z Inicjatywy",
      "source": "Initiative Bonus rounds"
    }
  },
  "eQZ5KAbB5Fpk1iII": {
    "target": {
      "polish": "Obszarowy (liczba metrów równa podwojonemu Bonusowi z Siły Woli)",
      "source": "2 * Willpower Bonus yards",
      "legacy_polish": [
        "2 * Liczba metrów równa Bonusowi z Siły Woli"
      ]
    }
  },
  "9gT8ylZXOj4NfL1w": {
    "duration": {
      "polish": "Liczba godzin równa Bonusowi z Siły Woli",
      "source": "Willpower Bonus hours"
    }
  },
  "AOQAOZKufhmgsfs4": {
    "duration": {
      "polish": "2 x liczba Rund równa Bonusowi z Siły Woli",
      "source": "2 * Willpower Bonus rounds"
    }
  },
  "Oy8i8PXkl5DdBrkN": {
    "duration": {
      "polish": "Liczba godzin równa Bonusowi z Siły Woli",
      "source": "Willpower Bonus hours"
    }
  },
  "dDLaRppoyHM5aiEo": {
    "duration": {
      "polish": "Liczba godzin równa Bonusowi z Siły Woli",
      "source": "Willpower Bonus hours"
    }
  },
  "aWfWprh5tTrW9BhX": {
    "range": {
      "polish": "Liczba metrów równa Sile Woli / 2",
      "source": "Willpower / 2 yards"
    }
  },
  "zoOcTnMzgNo64qXv": {
    "range": {
      "polish": "Liczba metrów równa połowie Siły Woli albo podwojony Bonus z Siły Woli",
      "source": "Willpower / 2 yards",
      "alternatives": [
        "2 * Willpower Bonus yards"
      ],
      "legacy_polish": [
        "Liczba metrów równa Sile Woli / 2"
      ]
    },
    "target": {
      "polish": "Podwojony Bonus z Inicjatywy albo Bonus z Inicjatywy",
      "source": "2 * Initiative Bonus",
      "alternatives": [
        "Initiative Bonus"
      ],
      "legacy_polish": [
        "2 * Bonus z Inicjatywy lub Bonus z Inicjatywy"
      ]
    }
  },
  "yaPGJQJhxy5dhc6I": {
    "range": {
      "polish": "Liczba metrów równa Sile Woli / 2",
      "source": "Willpower / 2 yards"
    }
  },
  "hrpvbTvv8dukcU5o": {
    "range": {
      "polish": "Liczba metrów równa połowie Siły Woli",
      "source": "Willpower / 2 yards"
    }
  },
  "i0qcoo5xj2wqJDEn": {
    "range": {
      "polish": "Liczba metrów równa połowie Inicjatywy",
      "source": "Initiative / 2 yards"
    },
    "duration": {
      "polish": "Liczba godzin albo dni, albo tygodni równa Bonusowi z Siły Woli",
      "source": "Willpower Bonus godzin albo dni, albo tygodni",
      "legacy_polish": [
        "Liczba godzin, dni, albo tygodni równa Bonusowi z Siły Woli"
      ]
    }
  },
  "6jcYMUcwGFVaX4CO": {
    "range": {
      "polish": "Liczba metrów równa połowie Inicjatywy",
      "source": "Initiative / 2 yards"
    }
  },
  "LhO1OGKBuzrIjIX0": {
    "range": {
      "polish": "Liczba metrów równa połowie Inteligencji albo Dotyk",
      "source": "Intelligence / 2 yards albo Dotyk"
    }
  },
  "LKe93CD18ubGCFnz": {
    "range": {
      "polish": "Liczba metrów równa połowie Siły Woli",
      "source": "Willpower / 2 yards"
    }
  },
  "ISH764ntFjCp39B7": {
    "range": {
      "polish": "Liczba metrów równa połowie Inicjatywy",
      "source": "Initiative / 2 yards"
    }
  },
  "SZmeiuQjc56sUwZk": {
    "duration": {
      "polish": "Liczba godzin albo dni, albo tygodni, albo miesięcy równa Bonusowi z Siły Woli",
      "source": "Willpower Bonus godzin albo dni, albo tygodni, albo miesięcy",
      "legacy_polish": [
        "Liczba godzin, dni, tygodni albo miesięcy równa Bonusowi z Siły Woli"
      ]
    }
  },
  "wVLz4jKnECTH4Ede": {
    "duration": {
      "polish": "Liczba minut albo dni równa Bonusowi z Siły Woli",
      "source": "Willpower Bonus minut albo dni",
      "legacy_polish": [
        "Liczba minut lub dni równa Bonusowi z Siły Woli"
      ]
    }
  },
  "3cNnjiiE8UcHt1Xg": {
    "duration": {
      "polish": "Liczba lat równa Bonusowi z Siły Woli",
      "source": "Willpower Bonus lat"
    }
  },
  "CyBnyWBZOc8kAwRF": {
    "target": {
      "polish": "1 i Obszarowy (liczba metrów równa Bonusowi z Siły Woli)",
      "source": "1 i Obszarowy (Willpower Bonus yards)"
    }
  },
  "0p28jwpHtbMCY8KN": {
    "range": {
      "polish": "Obszarowy (liczba metrów równa Sile Woli)",
      "source": "Obszarowy (Willpower yards)"
    }
  },
  "actor-acceptance": {
    "range": {
      "polish": "Obszarowy (liczba metrów równa podwojonemu Bonusowi z Siły Woli)",
      "source": "2 * Willpower Bonus yards",
      "wrap": "Obszarowy",
      "legacy_polish": [
        "Ty"
      ]
    },
    "target": {
      "polish": "Rzucający",
      "source": "2 * Willpower Bonus yards",
      "caster_area": true,
      "legacy_polish": [
        "2 * Liczba metrów równa Bonusowi z Siły Woli"
      ]
    }
  },
  "JFbQIzH3eX1dSH9I": {
    "duration": {
      "polish": "Liczba minut równa Sile Woli ×1k10",
      "source": "Willpower",
      "manual_dice": true,
      "legacy_polish": [
        "Siła Woli * 1k10 minut"
      ]
    }
  },
  "pant6LhZCPn1Jicc": {
    "target": {
      "polish": "4 x Obszarowy (liczba metrów równa Bonusowi z Siły Woli)",
      "source": "Willpower Bonus yards",
      "areas_count": 4,
      "legacy_polish": [
        "4 * Liczba metrów równa Bonusowi z Siły Woli (Obszarowy)"
      ]
    }
  }
});
const EMBEDDED_ORIGINS = Object.freeze({
  "Compendium.wfrp4e-wom.actors.Actor.vErRQ0QEVapPSdkM.Item.QyA6LNvVaxZhswg8": {
    "id": "UYcCoPIU04pVkO2o",
    "fields": [
      "duration"
    ]
  },
  "Compendium.wfrp4e-wom.actors.Actor.06edHNTIJFOTKH9w.Item.BUVzWpBAmmXczw6Z": {
    "id": "OUlPM5woG08xN0KR",
    "fields": [
      "duration"
    ]
  },
  "Compendium.wfrp4e-wom.actors.Actor.9u5V79gIzWHDLWqH.Item.tGZJOzt1t3WwMrMr": {
    "id": "2t3wuPlBohihPhza",
    "fields": [
      "target"
    ]
  },
  "Compendium.wfrp4e-wom.actors.Actor.oldtgeL8W8JqlmMA.Item.48Va8zEv1GJ9StjT": {
    "id": "COaNkxIMFeozaMf7",
    "fields": [
      "target"
    ]
  },
  "Compendium.wfrp4e-wom.actors.Actor.06edHNTIJFOTKH9w.Item.tz45YTdQ1agY4atP": {
    "id": "zoOcTnMzgNo64qXv",
    "fields": [
      "target",
      "range"
    ]
  },
  "Compendium.wfrp4e-wom.actors.Actor.06edHNTIJFOTKH9w.Item.mcOlHqa4FGk5s6n7": {
    "id": "eQZ5KAbB5Fpk1iII",
    "fields": [
      "target"
    ]
  },
  "Compendium.wfrp4e-wom.actors.Actor.oldtgeL8W8JqlmMA.Item.lmQaqMsYxaBDsFcV": {
    "id": "actor-acceptance",
    "fields": [
      "range",
      "target"
    ]
  },
  "Compendium.wfrp4e-wom.actors.Actor.OtBqhr035Qdf3XNo.Item.R5JZo4ylTzda3EJs": {
    "id": "8SCyGqSBjYnj4KQn",
    "fields": [
      "duration"
    ]
  },
  "Compendium.wfrp4e-wom.actors.Actor.oldtgeL8W8JqlmMA.Item.Uq3xmEWfquBvxAE4": {
    "id": "6jcYMUcwGFVaX4CO",
    "fields": [
      "range"
    ]
  },
  "Compendium.wfrp4e-wom.actors.Actor.oldtgeL8W8JqlmMA.Item.m5l0nfbMflIj6HZm": {
    "id": "0bF9Xv1PDUAMpoje",
    "fields": [
      "duration"
    ]
  },
  "Compendium.wfrp4e-wom.actors.Actor.oldtgeL8W8JqlmMA.Item.3qhcaDpw1VZsTMVl": {
    "id": "wVLz4jKnECTH4Ede",
    "fields": [
      "duration"
    ]
  },
  "Compendium.wfrp4e-wom.actors.Actor.oldtgeL8W8JqlmMA.Item.dGy0TElRdL3X5oc0": {
    "id": "ISH764ntFjCp39B7",
    "fields": [
      "range"
    ]
  },
  "Compendium.wfrp4e-wom.actors.Actor.oldtgeL8W8JqlmMA.Item.bDpcJd9uBgbOMylE": {
    "id": "yaPGJQJhxy5dhc6I",
    "fields": [
      "range"
    ]
  },
  "Compendium.wfrp4e-wom.actors.Actor.vErRQ0QEVapPSdkM.Item.n3MaajRLFcNR1t5C": {
    "id": "Oy8i8PXkl5DdBrkN",
    "fields": [
      "duration"
    ]
  },
  "Compendium.wfrp4e-wom.actors.Actor.kjfBuKJKt3u3sQQz.Item.DewZYdbpkFvQBXFW": {
    "id": "NuHhIlQYYtIVBxiy",
    "fields": [
      "duration",
      "target"
    ]
  },
  "Compendium.wfrp4e-wom.actors.Actor.kjfBuKJKt3u3sQQz.Item.jaKs1pV6T8sHoSCG": {
    "id": "3cNnjiiE8UcHt1Xg",
    "fields": [
      "duration"
    ]
  },
  "Compendium.wfrp4e-wom.actors.Actor.kjfBuKJKt3u3sQQz.Item.nf4Jz81ZqWF1lHNO": {
    "id": "9gT8ylZXOj4NfL1w",
    "fields": [
      "duration"
    ]
  },
  "Compendium.wfrp4e-wom.actors.Actor.06edHNTIJFOTKH9w.Item.xdbWExy8rPbfTlWk": {
    "id": "aWfWprh5tTrW9BhX",
    "fields": [
      "range"
    ]
  },
  "Compendium.wfrp4e-wom.actors.Actor.06edHNTIJFOTKH9w.Item.rJSt3JjTou6BmOXG": {
    "id": "LhO1OGKBuzrIjIX0",
    "fields": [
      "range"
    ]
  }
});

const deepFreeze = object => {
    for (const value of Object.values(object)) if (value && typeof value === "object") deepFreeze(value);
    return Object.freeze(object);
};
deepFreeze(FORMULAS); deepFreeze(EMBEDDED_ORIGINS);
const normalizedOrigin = ref => ref.replace(/^Compendium\.wfrp4e-wom\.actors\.([A-Za-z0-9]{16})\.Item\./,
    "Compendium.wfrp4e-wom.actors.Actor.$1.Item.");
function formulaRow(item, field, current) {
    if (game.modules?.get("wfrp4e-wom")?.version !== SOURCE_VERSION
        || item?.type !== "spell" || !["range", "target", "duration"].includes(field)) return undefined;
    const refs = [item.flags?.core?.sourceId, item._stats?.compendiumSource];
    if (item.uuid?.startsWith("Compendium.")) refs.push(item.uuid);
    const present = refs.filter(ref => typeof ref === "string" && ref.length > 0);
    if (!present.length) return undefined;
    const identities = present.map(ref => normalizedOrigin(ref).replace(
        /^Compendium\.wfrp4e-wom\.items\.([A-Za-z0-9]{16})$/, "Compendium.wfrp4e-wom.items.Item.$1"));
    if (new Set(identities).size !== 1) return undefined;
    const ids = present.map(ref => {
        const origin = EMBEDDED_ORIGINS[normalizedOrigin(ref)];
        return origin ? (origin.fields.includes(field) ? origin.id : undefined)
            : ref.match(/^Compendium\.wfrp4e-wom\.items\.(?:Item\.)?([A-Za-z0-9]{16})$/)?.[1];
    });
    if (ids.some(id => !id) || new Set(ids).size !== 1) return undefined;
    const row = FORMULAS[ids[0]]?.[field];
    return row && (current === row.polish || row.legacy_polish?.includes(current)) ? row : undefined;
}
export function sourceFormula(item, field, current) {
    return formulaRow(item, field, current)?.source;
}
export function installWomFormulaCompatibility() {
    const prototype = globalThis.CONFIG?.Item?.dataModels?.spell?.prototype;
    if (!prototype || prototype[PATCH_MARK]
        || typeof prototype.computeSpellPrayerFormula !== "function") return false;
    const original = prototype.computeSpellPrayerFormula;
    prototype.computeSpellPrayerFormula = function(type, options = {}) {
        const current = options.formulaOverride ?? this[type]?.value;
        const row = formulaRow(this.parent, type, current);
        if (!row) return original.call(this, type, options);
        const compute = formula => original.call(this, type, {...options, aoe: false, formulaOverride: formula});
        let result = compute(row.source);
        if (row.manual_dice) result = `(${result} × 1k10) minut`;
        if (row.areas_count) result += ` — ${row.areas_count} obszary`;
        if (row.alternatives) result = [result, ...row.alternatives.map(compute)].join(" albo ");
        if (row.kilometres_note) {
            const metres = Number.parseFloat(result);
            if (Number.isFinite(metres)) result += ` (${metres / 1000} kilometrów)`;
        }
        if (row.wrap) result = `${row.wrap} (${result})`;
        // Foundry consumes a numeric diameter from the same method that displays
        // the target. Keep the caster caption and existing target.aoe mechanics.
        if (row.caster_area && options.aoe) return `Rzucający: AoE (${result})`;
        return options.aoe ? `AoE (${result})` : result;
    };
    const originalOvercasting = prototype.computeOvercastingData;
    if (typeof originalOvercasting === "function") {
        prototype.computeOvercastingData = function(actor) {
            const usage = originalOvercasting.call(this, actor);
            const row = formulaRow(this.parent, "range", this.range?.value);
            if (!row || !usage?.range) return usage;
            const distance = Number.parseFloat(this.computeSpellPrayerFormula("range", {actor}));
            // The installed consumer truncates half-metre ranges. Correct only
            // a verified alias and its untouched initial range calculation.
            if (Number.isFinite(distance) && distance > 0 && !Number.isInteger(distance)
                && usage.range.initial === Math.trunc(distance)
                && usage.range.current === Math.trunc(distance)) {
                usage.range.initial = distance;
                usage.range.current = distance;
            }
            return usage;
        };
    }
    Object.defineProperty(prototype, PATCH_MARK, {value: true});
    return true;
}
if (globalThis.Hooks) {
    Hooks.once("init", installWomFormulaCompatibility);
    Hooks.once("ready", installWomFormulaCompatibility);
}
