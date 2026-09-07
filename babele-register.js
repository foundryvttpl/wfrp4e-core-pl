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
		const localizeKnownSpecification = value => {
			if (typeof value === "string" && game.i18n.has?.(value)) {
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

			// PBTT contains a repeatable upstream data defect: some Actors have both
			// the real Melee (Basic) skill and an obsolete, zero-advance Melee skill.
			// They legitimately become the same Polish name, which exposes the bad
			// source record. Remove only that exact legacy pair; never deduplicate by
			// translated name. Persist the verified source IDs so reinitialization can
			// also migrate Actors which were imported before this correction.
			const sourceItems = valuesOf(context.source?.items);
			const canonicalMeleeIds = sourceItems
				.filter(item => isMeleeSkill(item, "Melee (Basic)"))
				.map(itemId)
				.filter(Boolean);
			const hasCanonicalMelee = canonicalMeleeIds.length > 0;
			const legacyMeleeIds = hasCanonicalMelee
				? sourceItems
					.filter(item => isMeleeSkill(item, "Melee")
						&& Number(foundry.utils.getProperty(item, "system.advances.value")) === 0)
					.map(itemId)
					.filter(Boolean)
				: [];
			if (legacyMeleeIds.length) {
				const legacyIdSet = new Set(legacyMeleeIds);
				context.translated.items = removeItemsById(context.translated?.items, legacyIdSet);
				foundry.utils.setProperty(
					context.translated,
					`flags.${MODULE_ID}.legacyMeleeItemIds`,
					legacyMeleeIds
				);
				foundry.utils.setProperty(
					context.translated,
					`flags.${MODULE_ID}.canonicalMeleeItemIds`,
					canonicalMeleeIds
				);
				foundry.utils.setProperty(
					context.translated,
					"flags.wfrp4e-core-pl.legacyMeleeItemIds",
					legacyMeleeIds
				);
				foundry.utils.setProperty(
					context.translated,
					"flags.wfrp4e-core-pl.canonicalMeleeItemIds",
					canonicalMeleeIds
				);
			}

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

				let value = foundry.utils.getProperty(item, "system.specification.value");
				if (hasOwn(translation, "specification_value")) {
					value = translation.specification_value;
				}
				// Older actor catalogs used `specification` for both the field label
				// and its actor-specific value. Never replace a real value such as 8
				// with the source label "Rating". New catalogs use the unambiguous
				// `specification_value` key above.
				else if (hasOwn(translation, "specification")
					&& translation.specification !== sourceSpecificationLabel) {
					value = translation.specification;
				}
				if (value !== undefined) {
					foundry.utils.setProperty(item, "system.specification.value", localizeKnownSpecification(value));
				}
			}
		});
	}

	function resolveModuleAssetPath(val) {
		if (typeof val !== "string") return val;
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
	
	babele.registerConverters({
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

		tableResults: (results, translations) => {
  			return results.map(data => {
				if (translations) {
					const translation = translations[data._id] || translations[`${data.range[0]}-${data.range[1]}`];
					if (translation) {
						if (translation.name) {
							data = foundry.utils.mergeObject(data, translation, {translated: true});
						}
						else {
							data = foundry.utils.mergeObject(data, foundry.utils.mergeObject({'description': translation}, {translated: true}));
						}
					}
				}
				if (data.documentUuid) {
					const text = game.babele.translateField('name', foundry.utils.parseUuid(data.documentUuid).collection.collection, {'name': data.name});
					if (text) {
						return foundry.utils.mergeObject(data, foundry.utils.mergeObject({'name': text}, {translated: true}));
					} else {
						return data;
					}
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
	});
});
