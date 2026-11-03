import "./modules/content-lifecycle.js";
import {registerLegacyActorItemsConverter} from "./modules/legacy-actor-items-converter.js";
import "./modules/bulk-content-update.js";
import "./modules/content-organization.js";
import "./modules/scene-map-compatibility.js";
import "./modules/folder-compatibility.js";
import "./modules/orphaned-test-messages.js";
import { patchBabeleIndexTranslation } from "./modules/compendium-browser-compatibility.js";

const MODULE_ID = import.meta.url.match(/modules\/([^/]+)/)?.[1] || "wfrp4e-core-pl";
const MODULE_PATH = `modules/${MODULE_ID}`;

game.wfrp4eCorePl = game.wfrp4eCorePl || {};
game.wfrp4eCorePl.MODULE_ID = MODULE_ID;
game.wfrp4eCorePl.MODULE_PATH = MODULE_PATH;


game.wfrp4eCorePl.effectChangePath = () => game.release?.generation >= 14 ? "system.changes" : "changes";

game.wfrp4eCorePl.effectChanges = (effect) => {
	return foundry.utils.getProperty(effect, game.wfrp4eCorePl.effectChangePath()) || effect.changes || [];
};

game.wfrp4eCorePl.setEffectChanges = (effect, changes, {source = false} = {}) => {
	const update = {[game.wfrp4eCorePl.effectChangePath()]: changes};
	return source && effect.updateSource ? effect.updateSource(update) : effect.update(update);
};

game.wfrp4eCorePl.setEffectDuration = (effect, value, units = "rounds", {source = false} = {}) => {
	if (game.release?.generation >= 14) {
		const update = {"duration.value": value, "duration.units": units};
		if (effect.updateSource && source) {
			return effect.updateSource(update);
		}
		if (effect.update) {
			return effect.update(update);
		}
		effect.duration ??= {};
		effect.duration.value = value;
		effect.duration.units = units;
		return effect;
	}

	const update = units === "rounds" ? {"duration.rounds": value} : {"duration.seconds": value};
	if (effect.updateSource && source) {
		return effect.updateSource(update);
	}
	if (effect.update) {
		return effect.update(update);
	}
	effect.duration ??= {};
	if (units === "rounds") {
		effect.duration.rounds = value;
	}
	else {
		effect.duration.seconds = value;
	}
	return effect;
};

Hooks.once("babele.init", (babele) => {
    if (game.release?.generation >= 14) registerLegacyActorItemsConverter(babele);
	patchBabeleIndexTranslation(babele);
	const origIsTranslated = babele.isTranslated;
	if (typeof origIsTranslated === "function") {
		babele.isTranslated = function(pack) {
			const key = pack?.collection ?? pack?.metadata?.id ?? pack;
			return origIsTranslated.call(this, key);
		};
	}

	babele.register({
		module: MODULE_ID,
		lang: "pl",
		dir: "compendium",
	});

	if (game.release?.generation >= 14 && babele.registerMapping) {
		babele.registerMapping({
				Item: {
					_identity: {
						export: ["name", "_id", "id"],
						match: ["_id", "id", "name", "sourceId"]
					},
					gmdescription: "system.gmdescription.value",
					skills: {
						path: "system.skills",
						converter: "templateSkills"
					},
					talents: {
						path: "system.talents",
						converter: "templateTalents"
					},
					class: "system.class.value",
					careergroup: "system.careergroup.value",
					trappings: {
						path: "system.trappings",
						converter: "templateTrappings"
					},
					wounds: "system.wounds.value",
					location: "system.location.value",
					effects: {
						path: "effects",
						converter: "effects"
					},
					duration_value: "system.duration.value",
					duration_unit: "system.duration.unit",
					incubation_value: "system.incubation.value",
					incubation_unit: "system.incubation.unit",
					duration_text: "system.duration.text",
					incubation_text: "system.incubation.text",
					contraction: "system.contraction.value",
					symptoms: "system.symptoms.value",
					permanent: "system.permanent.value",
					penalty: "system.penalty.value",
					duration: "system.duration.value",
					modifier: "system.modifier.value",
					range: "system.range.value",
					target: "system.target.value",
					damage: "system.damage.value",
					god: "system.god.value",
					overcast: "system.overcast.label",
					overcastvalue: "system.overcast.valuePerOvercast.type",
					overcastinitial: "system.overcast.initial.type",
					overcastvaluevalue: "system.overcast.valuePerOvercast.additional",
					overcastinitialvalue: "system.overcast.initial.additional",
					specification_label: "system.specification.label",
					// Legacy catalogs store the human-readable specification label here, not the actor-specific mechanical value.
					// (for example 'Value #' or 'Corruption Strength'). Preserve values such as 3 or 'minor' in V14.
					specification: "system.specification.label",
					tests: "system.tests.value",
					alterNamePost: "system.alterName.post",
					alterNamePre: "system.alterName.pre",
					traits: {
						path: "system.traits",
						converter: "templateTraits"
					},
					roll: "system.rollable.skill",
					penalties: "system.penalty.value",
					special: "system.special.value"
				},
				ActiveEffect: {
					changes: {
						path: "system.changes",
						converter: "structured",
						cardinality: "many",
						container: "array",
						key: "key",
						valuePath: "value"
					}
				}
		});
	}

	// Actor catalogs store per-instance values (for example Enormous -> Wielki
	// or Challenging -> Wymagający) under items.<id>.specification. The legacy
	// Item mapping uses that same key for system.specification.label, so Babele
	// cannot infer that embedded Actor values belong in `.value`. Correct the
	// translated document after the normal converter pass. This applies to every
	// embedded Item type and also localizes known system values when a catalog
	// does not need an explicit override.
	if (game.release?.generation >= 14) {
		const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object || {}, key);
		const SIZE_MAP = {
			"Tiny": "Drobny",
			"Little": "Niewielki",
			"Small": "Mały",
			"Average": "Średni",
			"Large": "Duży",
			"Enormous": "Wielki",
			"Monstrous": "Monstrualny"
		};
		const KNOWN_SPECS = {
			"Beasts": "Zwierząt",
			"Heavens": "Niebios",
			"Life": "Życia",
			"Light": "Światła",
			"Death": "Śmierci",
			"Fire": "Ognia",
			"Metal": "Metalu",
			"Shadow": "Cienia",
			"Aqshy": "Aqshy",
			"Chamon": "Chamon",
			"Ghur": "Ghur",
			"Ghyran": "Ghyran",
			"Hysh": "Hysh",
			"Shyish": "Shyish",
			"Ulgu": "Ulgu",
			"Azyr": "Azyr",
			"Petty": "Prosta",
			"Challenging": "Wymagający",
			"Hard": "Trudny",
			"Difficult": "Trudny",
			"Very Hard": "Bardzo trudny",
			"Average": "Przeciętny",
			"Mount": "Wierzchowiec",
			"War": "Bojowy",
			"Guard": "Strażnik",
			"Broken": "Ujeżdżony",
			"Drive": "Powożenie",
			"Magic": "Magia",
			"Dwarfs": "Krasnoludy",
			"Greenskins": "Zielonoskórzy",
			"Moderate": "Umiarkowane",
			"Minor": "Niewielkie",
			"Major": "Poważne",
			"Cataleptic Ague": "Katatoniczna febra",
			"Fungal Takeover": "Grzybicze przejęcie",
			"Ratte Fever": "Szczurza gorączka",
			"Yellow Skull Fever": "Gorączka żółtej czaszki",
			"Bloody Flux": "Krwawa biegunka"
		};
		const PLACEHOLDER_SPECS = new Set([
			"#", "Rozmiar", "Wiedza", "Trudność", "Umiejętności Wyuczone",
			"Obrażenia", "Typ", "Wartość", "Cel", "Siła Korupcji", "Wartość #",
			"Specification", "Rating", "Value", "Difficulty", "Target", "Damage"
		]);
		const localizeKnownSpecification = value => {
			if (typeof value !== "string") return value;
			if (SIZE_MAP[value]) return SIZE_MAP[value];
			if (KNOWN_SPECS[value]) return KNOWN_SPECS[value];
			if (value.includes(",")) {
				return value.split(",").map(s => {
					const trimmed = s.trim();
					return SIZE_MAP[trimmed] || KNOWN_SPECS[trimmed] || (game.i18n.has?.("SPEC." + trimmed) ? game.i18n.localize("SPEC." + trimmed) : (game.i18n.has?.(trimmed) ? game.i18n.localize(trimmed) : trimmed));
				}).join(", ");
			}
			if (game.i18n.has?.("SPEC." + value)) {
				return game.i18n.localize("SPEC." + value);
			}
			if (game.i18n.has?.(value)) {
				return game.i18n.localize(value);
			}
			return value;
		};
		const valuesOf = collection => {
			if (Array.isArray(collection)) return collection;
			if (typeof collection?.values === "function") return Array.from(collection.values());
			return Object.values(collection || {});
		};
		const itemId = item => item?._id ?? item?.id;
		const isMeleeSkill = (item, name) => item?.type === "skill"
			&& item?.name === name
			&& foundry.utils.getProperty(item, "system.characteristic.value") === "ws"
			&& foundry.utils.getProperty(item, "system.grouped.value") === "isSpec";
		const removeItemsById = (collection, ids) => {
			if (Array.isArray(collection)) return collection.filter(item => !ids.has(itemId(item)));
			if (collection && collection.constructor === Object) {
				return Object.fromEntries(Object.entries(collection).filter(([key, item]) => !ids.has(itemId(item) ?? key)));
			}
			return collection;
		};

		Hooks.on("babele.translateDocumentData", context => {
			if (context.metadata?.type === "Item") {
				const path = "system.specification.value";
				const value = foundry.utils.getProperty(context.translated, path);
				if (value !== undefined) {
					foundry.utils.setProperty(context.translated, path, localizeKnownSpecification(value));
				}
				return;
			}
			if (context.metadata?.type !== "Actor") return;

			const sourceItems = valuesOf(context.source?.items);
			const itemTranslations = context.translation?.items || {};
			const sourceItemsById = new Map(
				sourceItems.map(item => [itemId(item), item]).filter(([id]) => id)
			);
			for (const item of valuesOf(context.translated?.items)) {
				const itemId = item?._id ?? item?.id;
				if (!itemId) continue;
				const translation = itemTranslations[itemId]
					?? valuesOf(itemTranslations).find(entry => (entry?._id ?? entry?.id) === itemId);
				const sourceItem = sourceItemsById.get(itemId);
				const sourceSpecificationLabel = foundry.utils.getProperty(
					sourceItem,
					"system.specification.label"
				);
				const sourceValue = foundry.utils.getProperty(sourceItem, "system.specification.value");

				let value = foundry.utils.getProperty(item, "system.specification.value");
				if (hasOwn(translation, "specification_value") && !PLACEHOLDER_SPECS.has(translation.specification_value)) {
					value = translation.specification_value;
				}
				// Older actor catalogs used `specification` for both the field label
				// and its actor-specific value. Never replace a real value such as 8
				// with template placeholders like '#' or source labels like 'Rating'.
				else if (hasOwn(translation, "specification")
					&& translation.specification !== sourceSpecificationLabel
					&& !PLACEHOLDER_SPECS.has(translation.specification)) {
					value = translation.specification;
				}
				else if (sourceValue !== undefined && (value === undefined || value === "" || PLACEHOLDER_SPECS.has(value))) {
					value = sourceValue;
				}
				if (value !== undefined) {
					foundry.utils.setProperty(item, "system.specification.value", localizeKnownSpecification(value));
				}

				// Localize embedded item effects if their name is still untranslated
				if (item.effects) {
					for (const effect of valuesOf(item.effects)) {
						if (!effect.name) continue;
						if (effect.name === "We See You") {
							effect.name = "Widzimy Was";
						} else if (effect.name === "Magical") {
							effect.name = "Magiczny";
						} else if (effect.name === "Bite") {
							effect.name = "Ugryzienie";
						} else if (effect.name === "Size") {
							effect.name = "Rozmiar";
						} else if (effect.name === "Flying" || effect.name === "Flight") {
							effect.name = "Latanie";
						} else if (item.originalName && effect.name === item.originalName && item.name) {
							effect.name = item.name;
						}
					}
				}
			}
		});
	}

	function resolveModuleAssetPath(val) {
		if (typeof val !== "string") return val;
		// Repair verified asset renames only in standalone paths and HTML image sources.
		const assetAliases = {
		  "modules/wfrp4e-eis/assets/actors/gottri-gurnisson.webp": "modules/wfrp4e-core-pl/images/eis/gottri-gurnisson.webp",
		  "modules/wfrp4e-eis/assets/set-pictures/gottri-gurnisson2.webp": "modules/wfrp4e-core-pl/images/eis/gottri-gurnisson2.webp",
		  "modules/wfrp4e-eis/assets/handouts/purple-hand.webp": "modules/wfrp4e-core-pl/images/eis/handouts/purple-hand.webp",
		  "modules/wfrp4e-horned-rat/assets/maps/middenheim-karak-skygg.webp": "modules/wfrp4e-core-pl/images/horned-rat/maps/middenheim-karak-skygg.webp",
		  "modules/wfrp4e-horned-rat/assets/maps/road-to-brasskeep.webp": "modules/wfrp4e-core-pl/images/horned-rat/maps/road-to-brasskeep.webp",
		  "modules/wfrp4e-horned-rat/assets/misc/council-vote.webp": "modules/wfrp4e-core-pl/images/horned-rat/misc/council-vote.webp",
		  "modules/wfrp4e-middenheim/assets/handouts/rudolf-wanted.webp": "modules/wfrp4e-core-pl/images/middenheim/handouts/rudolf-wanted.webp",
		  "modules/wfrp4e-pbtt/assets/images/dwarf-valley-choirs.webp": "modules/wfrp4e-core-pl/images/pbtt/images/dwarf-valley-choirs.webp",
		  "modules/wfrp4e-pbtt/assets/images/festival-of-fine-ales.webp": "modules/wfrp4e-core-pl/images/pbtt/images/festival-of-fine-ales.webp",
		  "modules/wfrp4e-pbtt/assets/images/handout-menu.webp": "modules/wfrp4e-core-pl/images/pbtt/images/handout-menu.webp",
		  "modules/wfrp4e-pbtt/assets/images/party-invitation.webp": "modules/wfrp4e-core-pl/images/pbtt/images/party-invitation.webp",
		  "modules/wfrp4e-pbtt/assets/images/powers-that-be.webp": "modules/wfrp4e-core-pl/images/pbtt/images/powers-that-be.webp",
		  "modules/wfrp4e-pbtt/assets/images/schedule-royal-college.webp": "modules/wfrp4e-core-pl/images/pbtt/images/schedule-royal-college.webp",
		  "modules/wfrp4e-pbtt/assets/images/schedule-royal-gardens.webp": "modules/wfrp4e-core-pl/images/pbtt/images/schedule-royal-gardens.webp",
		  "modules/wfrp4e-pbtt/assets/images/schedule-square-of-martials.webp": "modules/wfrp4e-core-pl/images/pbtt/images/schedule-square-of-martials.webp",
		  "modules/wfrp4e-pbtt/assets/images/schedule-the-great-park.webp": "modules/wfrp4e-core-pl/images/pbtt/images/schedule-the-great-park.webp",
		  "modules/wfrp4e-pbtt/assets/images/templars-arms.webp": "modules/wfrp4e-core-pl/images/pbtt/images/templars-arms.webp",
		  "modules/wfrp4e-pbtt/assets/maps/altdorf-to-middenheim.webp": "modules/wfrp4e-core-pl/images/pbtt/maps/altdorf-to-middenheim.webp",
		  "modules/wfrp4e-pbtt/assets/maps/lair-of-the-pawns.webp": "modules/wfrp4e-core-pl/images/pbtt/maps/lair-of-the-pawns.webp",
		  "modules/wfrp4e-core/icons/traits/trait.webp": "modules/wfrp4e-core/icons/traits/trait.png",
		  "modules/wfrp4e-core/icons/equipment/weapons/quarterstaff.png": "modules/wfrp4e-core/icons/equipment/weapons/quarter-staff.png",
		  "modules/wfrp4e-soc/assets/items/upgrade.png": "modules/wfrp4e-soc/assets/icons/upgrade.png",
		  "modules/wfrp4e-core/icons/equipment/armour/open-plate-helm.png": "modules/wfrp4e-core/icons/equipment/armour/plate-open-helm.png",
		  "modules/wfrp4e-core/icons/equipment/money/silver-shilling.png": "modules/wfrp4e-core/icons/currency/silvershilling.png",
		  "modules/wfrp4e-zoo/assets/actors/chameleoleech.webp": "modules/wfrp4e-zoo/assets/actors/chameleo_leeches.webp",
		  "modules/wfrp4e-zoo/assets/actors/amoebae.webp": "modules/wfrp4e-zoo/assets/actors/amoeba.webp",
		  "modules/wfrp4e-zoo/assets/actors/il-potente-granchio.webp": "modules/wfrp4e-zoo/assets/actors/leviathan.webp",
		  "modules/wfrp4e-core/icons/effects/miscast.png": "modules/wfrp4e-core/art/other/miscast.webp",
		  "modules/wfrp4e-wom/assets/misc/wheel-of-magic.webp": "modules/wfrp4e-core-pl/images/wom/the Colleges of Magic.webp",
		  "modules/wfrp4e-ua2/assets/images/fishrook-returns.webp": "modules/wfrp4e-core-pl/images/ua2/maps/fishrook-sightings.webp",
		  "modules/wfrp4e-horned-rat/assets/handouts/web.webp": "modules/wfrp4e-core-pl/images/horned-rat/handouts/web.webp",
		  "modules/wfrp4e-horned-rat/assets/handouts/handout2.webp": "modules/wfrp4e-core-pl/images/horned-rat/handouts/handout2.webp",
		  "modules/wfrp4e-rnhd/assets/images/ambosstein.webp": "modules/wfrp4e-core-pl/images/rnhd/dom-ambosstein.webp",
		  "modules/wfrp4e-middenheim/assets/misc/low-king-turf.webp": "modules/wfrp4e-core-pl/images/middenheim/misc/low-king-turf.webp",
		  "modules/wfrp4e-middenheim/assets/misc/purple-hand-org.webp": "modules/wfrp4e-core-pl/images/middenheim/misc/purple-hand-org.webp",
		  "modules/wfrp4e-middenheim/assets/misc/middenball-kicking.webp": "modules/wfrp4e-core-pl/images/middenheim/misc/middenball-kicking.webp",
		  "modules/wfrp4e-middenheim/assets/misc/middenball-pursuits.webp": "modules/wfrp4e-core-pl/images/middenheim/misc/middenball-pursuits.webp",
		  "modules/wfrp4e-middenheim/assets/misc/middenball-throwing.webp": "modules/wfrp4e-core-pl/images/middenheim/misc/middenball-throwing.webp"
		};
		if (Object.hasOwn(assetAliases, val)) val = assetAliases[val];
		else if (val.includes("<img")) {
			val = val.replace(/(<img\b[^>]*?\bsrc\s*=\s*)(["'])([^"']+)\2/gi,
				(match, prefix, quote, src) => Object.hasOwn(assetAliases, src) ? prefix + quote + assetAliases[src] + quote : match);
		}
		const activeId = game.wfrp4eCorePl?.MODULE_ID 
			|| (game.modules.get("wfrp4e-core-pl")?.active ? "wfrp4e-core-pl" : "wfrp4e-core-pl");
		return val
			.replaceAll(/modules\/wfrp4e-core-pl(?:-dev)?\/images\//g, `modules/${activeId}/images/`)
			.replace(/-vtt\.webp$/i, ".webp");
	}

	function sanitizeHtmlOrText(text) {
		if (typeof text !== "string") return text;
		let updated = resolveModuleAssetPath(text);
		if (updated.includes("wfrp4e-ua2.ua2-actors.")) {
			updated = updated.replaceAll("wfrp4e-ua2.ua2-actors.", "wfrp4e-ua2.actors.");
		}
		if (updated.includes(".journals.JournalEntry.")) {
			updated = updated.replaceAll(".journals.JournalEntry.", ".journals.");
		}
		if (updated.includes("\\n")) {
			updated = updated.replaceAll(/>\\n/g, ">\n").replaceAll(/\\n</g, "\n<");
		}
		return updated;
	}

	function sanitizeDocumentData(obj) {
		if (!obj || typeof obj !== "object") return;
		for (const [key, val] of Object.entries(obj)) {
			if (typeof val === "string") {
				obj[key] = sanitizeHtmlOrText(val);
			} else if (Array.isArray(val)) {
				for (let i = 0; i < val.length; i++) {
					if (typeof val[i] === "string") {
						val[i] = sanitizeHtmlOrText(val[i]);
					} else if (typeof val[i] === "object" && val[i] !== null) {
						sanitizeDocumentData(val[i]);
					}
				}
			} else if (typeof val === "object" && val !== null) {
				sanitizeDocumentData(val);
			}
		}
	}

	// Foundry V14 moved the Scene background into the embedded Level document.
	// Babele's static field mapper cannot safely build an array element from a
	// dotted path, so replace the translated levels payload with a copy of the
	// source levels and change the background on the scene's initial level.
	// Dynamically routes modules/wfrp4e-core-pl/images to the currently active module ID
	// and sanitizes journal pages, links, and embedded documents.
	Hooks.on("babele.translateDocumentData", context => {
// These three embedded traits were verified against their EN rule text,
// effect identities and the exact Middenheim actor/item source identities.
// A local name does not prevent a generic same-name pack from supplying
// another rule's description or specification before the local override.
if (context.metadata.type === "Item" && context.metadata.id !== "wfrp4e-core.items") {
    const verifiedTraits = {
        "Compendium.wfrp4e-middenheim.actors.Actor.AGyoIt9stdSin46x.Item.qfIcOnnYrq1gizBb": { sourceName: "Terror", name: "Groza" },
        "Compendium.wfrp4e-middenheim.actors.Actor.3v8tiA5R7By89Jba.Item.ZIR0P9o1RS6zd9fY": { sourceName: "Terror", name: "Groza" },
        "Compendium.wfrp4e-middenheim.actors.Actor.yKhanffLSWLcsY1C.Item.9MjH4xyVrd3Inzak": { sourceName: "Fast", name: "Szybki" }
    };
    const sourceUuid = context.source?.flags?.core?.sourceId || context.source?._stats?.compendiumSource;
    const sourceId = context.source?.flags?.core?.sourceId;
    const compendiumSource = context.source?._stats?.compendiumSource;
    const consistentSource = !sourceId || !compendiumSource || sourceId === compendiumSource;
    const rule = verifiedTraits[sourceUuid];
    const originalName = context.source?.flags?.babele?.originalName ?? context.source?.name;
    if (rule && consistentSource && context.source?._id === sourceUuid.split(".").at(-1)
        && context.source?.type === "trait" && originalName === rule.sourceName) {
        const corePack = babele.mappedCompendiumFor("wfrp4e-core.items");
        const lookup = foundry.utils.mergeObject(context.source, { name: rule.sourceName }, { inplace: false });
        if (corePack?.translated && corePack.hasTranslation(lookup, "Item")) {
            // Translate the actual embedded document through the verified Core
            // pack; existing effect IDs and mechanics come from this document.
            context.translated = corePack.translate(lookup, true);
            return;
        }
        // Missing Core is incomplete localisation, never permission to use
        // an unrelated rule. Only the already approved local name is applied.
        context.translated = { name: rule.name };
        console.warn("WFRP4e PL: verified Core trait translation unavailable", sourceUuid);
        return;
    }
}

		if (context.metadata?.type === "Scene") {
			if (context.translation?.image) {
				const sourceLevels = Array.isArray(context.source?.levels)
					? context.source.levels
					: Array.from(context.source?.levels || [], level => level.toObject?.() ?? level);
				if (sourceLevels.length) {
					const levels = foundry.utils.deepClone(sourceLevels);
					const initialLevelId = context.source.initialLevel ?? levels[0]._id;
					const level = levels.find(candidate => candidate._id === initialLevelId) ?? levels[0];
					level.background ??= {};
					level.background.src = resolveModuleAssetPath(context.translation.image);
					context.translated.levels = levels;
				} else if (context.translated.background) {
					context.translated.background.src = resolveModuleAssetPath(context.translation.image);
				}
			}
// QA proposal only. Insert inside the existing Scene branch of
// babele.translateDocumentData, after the image/Level compatibility block.
// Scope comes from Babele's actual pack metadata plus document type and ID.
if (context.metadata.id === "wfrp4e-middenheim.scenes"
    && context.translation?.id === context.source?._id) {
    if (typeof context.translation.level_name === "string") {
        const sourceLevels = context.translated.levels ?? context.source.levels ?? [];
        const levels = foundry.utils.deepClone(Array.isArray(sourceLevels)
            ? sourceLevels : Array.from(sourceLevels, level => level.toObject?.() ?? level));
        const level = levels.find(level => level._id === context.source.initialLevel) ?? levels[0];
        if (level) {
            level.name = context.translation.level_name;
            context.translated.levels = levels;
        }
    }
    const sourceTiles = context.source.tiles ?? [];
    const tiles = foundry.utils.deepClone(Array.isArray(sourceTiles)
        ? sourceTiles : Array.from(sourceTiles, tile => tile.toObject?.() ?? tile));
    let changedTile = false;
    for (const tile of tiles) {
        const original = tile.texture?.src;
        const resolved = resolveModuleAssetPath(original);
        if (resolved !== original) {
            tile.texture.src = resolved;
            changedTile = true;
        }
    }
    if (changedTile) context.translated.tiles = tiles;
}

		}

		if (context.source?.img) {
			const resolvedImg = resolveModuleAssetPath(context.source.img);
			if (resolvedImg !== context.source.img) {
				context.translated.img = resolvedImg;
			}
		}

		if (context.translated && typeof context.translated === "object") {
			sanitizeDocumentData(context.translated);
		}
	});

	const ensureEffectSystem = (effect) => {
		effect.system ??= {};
		effect.system.transferData ??= {};
		effect.system.scriptData ??= [];
		effect.system.condition ??= {};
		effect.system.sourceData ??= {};
		return effect.system;
	};

	const applyEffectTranslation = (effect, translation) => {
		const originalName = effect.name ?? effect.label;
		const result = foundry.utils.mergeObject(effect, translation, {inplace: false});
		const system = ensureEffectSystem(result);

		result.translated = true;
		if (result.img) {
			result.img = resolveModuleAssetPath(result.img);
		}
		if (translation.name) {
			result.name = translation.name;
			if (originalName && originalName !== translation.name) {
				result.originalName ??= originalName;
				result.flags ??= {};
				result.flags.babele ??= {};
				result.flags.babele.originalName ??= originalName;
			}
		}
		if (translation.description) {
			result.description = translation.description;
		}
		if (translation.duration) {
			result.duration = foundry.utils.mergeObject(result.duration || {}, translation.duration, {inplace: false});
		}
		if (translation.changes) {
			foundry.utils.setProperty(result, game.wfrp4eCorePl.effectChangePath(), translation.changes);
		}
		if (translation.transferData) {
			system.transferData = foundry.utils.mergeObject(system.transferData, translation.transferData, {inplace: false});
		}
		if (translation.condition) {
			system.condition = foundry.utils.mergeObject(system.condition, translation.condition, {inplace: false});
		}
		if (translation.filter) {
			system.transferData.filter = translation.filter;
		}
		if (translation.enableConditionScript) {
			system.transferData.enableConditionScript = translation.enableConditionScript;
		}
		if (translation.preApplyScript) {
			system.transferData.preApplyScript = translation.preApplyScript;
		}
		if (translation.scriptData) {
			for (let i = 0; i < translation.scriptData.length; i++) {
				const transScript = translation.scriptData[i];
				const script = system.scriptData[i];
				if (script) {
					script.options ??= {};
					script.label = transScript.label ?? transScript.name ?? script.label;
					if (transScript.hideScript) {
						script.options.hideScript = transScript.hideScript;
					}
					if (transScript.activationScript) {
						script.options.activateScript = transScript.activationScript;
					}
					if (transScript.submissionScript) {
						script.options.submissionScript = transScript.submissionScript;
					}
					if (transScript.script) {
						script.script = transScript.script;
					}
				}
			}
		}
		return result;
	};
	
	const contentConverters = {
		effects: (effects, translations) => {
			return effects.map((data) => {
				if (translations){
					const effectName = data.name ?? data.label ?? "";
					const translation = translations[effectName] || translations[data.id] || translations[data._id];
					if (translation) {
						let result = foundry.utils.deepClone(data);
						if (result.name == null) {
							result.name = effectName;
						}
						return applyEffectTranslation(result, translation);
					}
				}
				return data;
			});
		},

		notes: (notes, translations) => {
			// TODO: notes on map.
			return notes.map((data) => {
				data = foundry.utils.deepClone(data);
				if (translations){ 
					const translation = translations[data.id] ?? translations[data._id];
					if (translation) {
						return foundry.utils.mergeObject(
							data,
							foundry.utils.mergeObject(translation, { translated: true }),
						);
					}
				}
				return data;
			});
		},
		
		// Babele 2.9.1 (Foundry V14) removed the built-in "drawings" converter and
		// now maps Scene drawings/notes through the generic "textCollection", which
		// matches by the English text value. Our translation packs are keyed by the
		// drawing _id with a { text } payload (the pre-V14 format), so we restore a
		// dedicated "drawings" converter that matches by _id, mirroring "notes" above.
		drawings: (drawings, translations) => {
			return drawings.map((data) => {
				data = foundry.utils.deepClone(data);
				if (translations){
					const translation = translations[data.id] ?? translations[data._id];
					if (translation) {
						return foundry.utils.mergeObject(
							data,
							foundry.utils.mergeObject(translation, { translated: true }),
						);
					}
				}
				return data;
			});
		},

		tableResults: (results, translations, source, context, allTranslations) => {
			const isV13Plus = Boolean(game.release?.generation >= 13);
			const restoring = allTranslations && allTranslations === source?.flags?.babele?.originalPayload;
			return results.map(data => {
				data = foundry.utils.deepClone(data);
				if (translations) {
					const translation = translations[data._id] || translations[`${data.range?.[0]}-${data.range?.[1]}`];
					if (translation) {
						if (typeof translation === "object" && translation !== null) {
							const patch = { ...translation, translated: true };
							if (isV13Plus) {
								if (patch.text && !patch.description) {
									patch.description = patch.text;
								}
								delete patch.text;
							} else if (patch.name && !patch.text) {
								patch.text = patch.name;
							}
							data = foundry.utils.mergeObject(data, patch);
						} else if (typeof translation === "string") {
							const str = translation.trim();
							const isUuidLink = /@(?:UUID|Compendium)\[[^\]]+\](?:\{([^}]+)\})?/i.test(str);
							if (isUuidLink) {
								const labelMatch = str.match(/\{([^}]+)\}/);
								const label = labelMatch ? labelMatch[1].trim() : str.replace(/<[^>]+>/g, "").trim();
								const desc = str.startsWith("<p") ? str : `<p>${str}</p>`;
								const patch = {
									name: label,
									description: desc,
									translated: true
								};
								if (!isV13Plus) patch.text = str;
								data = foundry.utils.mergeObject(data, patch);
							} else {
								// Keep the paragraph wrapper in the description when splitting its title.
								const boldMatch = str.match(/^\s*(<p(?:\s[^>]*)?>\s*)?<(b|strong)(?:\s[^>]*)?>(.*?)<\/\2>\s*[:\-–—.]?\s*(.*)$/s);
								if (boldMatch) {
									const title = boldMatch[3].replace(/<[^>]+>/g, "").trim();
									const desc = ((boldMatch[1] || "") + boldMatch[4]).trim();
									const patch = {
										name: title,
										description: desc,
										translated: true
									};
									if (!isV13Plus) patch.text = str;
									data = foundry.utils.mergeObject(data, patch);
								} else {
									const hasName = Boolean(data.name && data.name.trim());
									const hasDesc = Boolean(data.description && data.description.trim());
									const colonMatch = hasName ? str.match(/^([^<:\n]{2,50}):\s*(.+)$/s) : null;
									if (colonMatch) {
										const title = colonMatch[1].trim();
										const desc = colonMatch[2].trim();
										const patch = {
											name: title,
											description: desc,
											translated: true
										};
										if (!isV13Plus) patch.text = str;
										data = foundry.utils.mergeObject(data, patch);
									} else if (hasName && !hasDesc) {
										const patch = {
											name: str,
											description: "",
											translated: true
										};
										if (!isV13Plus) patch.text = str;
										data = foundry.utils.mergeObject(data, patch);
									} else if (!hasName && hasDesc) {
										const patch = {
											description: str,
											translated: true
										};
										if (!isV13Plus) patch.text = str;
										data = foundry.utils.mergeObject(data, patch);
									} else {
										if (hasName) {
											const patch = {
												name: str,
												translated: true
											};
											if (!isV13Plus) patch.text = str;
											data = foundry.utils.mergeObject(data, patch);
										} else {
											const patch = {
												description: str,
												translated: true
											};
											if (!isV13Plus) patch.text = str;
											data = foundry.utils.mergeObject(data, patch);
										}
									}
								}
							}
						}
					}
				}
				if (data.documentUuid && !restoring) {
					try {
						const parsed = foundry.utils.parseUuid(data.documentUuid);
						if (parsed?.collection?.collection) {
							const text = game.babele.translateField("name", parsed.collection.collection, { name: data.name });
							if (text) {
								const patch = { name: text, translated: true };
								if (!isV13Plus) patch.text = text;
								return foundry.utils.mergeObject(data, patch);
							}
						}
					} catch (e) {}
					return data;
				}
				return data;
			});
		},

		templateSkills: (skills, translations) => {
			if (skills?.list) {
				let result = foundry.utils.deepClone(skills);
				for (let i = 0; i < result.list.length; i++) {
					if (translations?.[i] != null) {
						result.list[i].name = translations[i];
					}
				}
				return result;
			}
			else if (Array.isArray(skills) && Array.isArray(translations)) {
				return translations;
			}
			return skills;
		},

		templateTalents: (talents, translations) => {
			if (talents?.list) {
				let result = foundry.utils.deepClone(talents);
				for (let i = 0; i < result.list.length; i++) {
					if (translations?.[i] != null) {
						result.list[i].name = translations[i];
					}
				}
				return result;
			}
			else if (Array.isArray(talents) && Array.isArray(translations)) {
				return translations;
			}
			return talents;
		},

		templateTraits: (traits, translations) => {
			if (traits?.list) {
				let result = foundry.utils.deepClone(traits);
				for (let i = 0; i < result.list.length; i++) {
					if (translations?.[i] != null) {
						result.list[i].name = translations[i];
					}
				}
				return result;
			}
			else if (Array.isArray(traits) && Array.isArray(translations)) {
				return translations;
			}
			return traits;
		},

		templateTrappings: (trappings, translations) => {
			if (trappings?.options && Array.isArray(translations)) {
				let result = foundry.utils.deepClone(trappings);
				for (let i = 0; i < trappings.options.length; i++) {
					const o = trappings.options[i];
					const t = translations.find(t => t.Id == o.id);
					if (t) {
						result.options[i].name = t.Name;
					}
				}
				return result;
			}
			else if (Array.isArray(trappings) && Array.isArray(translations)) {
				return translations;
			}
			return trappings;
		},
	};
	// Custom collection converters also need an export phase. Babele uses it
	// to retain the native source for rollback and safe update comparisons.
	for (const name of ['effects', 'notes', 'drawings', 'tableResults']) {
		contentConverters[name].extract = values => Object.fromEntries((values ?? []).map(value =>
			[value._id ?? value.id ?? value.name, foundry.utils.deepClone(value)]));
	}
	for (const name of ['templateSkills', 'templateTalents', 'templateTrappings', 'templateTraits']) {
		contentConverters[name].extract = values => values != null ? foundry.utils.deepClone(values) : values;
	}
	babele.registerConverters(contentConverters);
});
