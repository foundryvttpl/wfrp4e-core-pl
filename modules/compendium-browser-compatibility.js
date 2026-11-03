/**
 * Compendium Browser Compatibility for Polish Localisation.
 *
 * Ensures that the Compendium Browser (warhammer.apps.CompendiumBrowser) correctly
 * finds and displays translated entries when searching and filtering by Polish
 * names as well as original English names.
 *
 * Resolves upstream issues:
 * 1. Babele MappedCompendium index translation cache: Babele caches translated
 *    index entries keyed only by ID/name/type. When the Compendium Browser requests
 *    extended index fields (e.g. system.class.value, system.careergroup.value,
 *    system.skills, system.talents, system.trappings), Babele was returning the
 *    minimal startup cached entry, leaving system data in English LevelDB raw values.
 * 2. CompendiumBrowser filters compatibility: Filter getters are enhanced so that
 *    searches on Career (class, career group, skills, talents, trappings, income skill),
 *    CareerPath (class), Actor details (species), and browser text search support
 *    both Polish and English queries seamlessly.
 * 3. Income Skill filter upstream defect: system.incomeSkill is an array of indices
 *    into system.skills (e.g. [2]), but CareerModel declared it as a plain text filter
 *    on system.incomeSkill without a getter. We provide a custom filter builder that
 *    indexes both system.skills and system.incomeSkill and resolves skill names in
 *    both Polish and English.
 */

const PATCH_MARK_INDEX = Symbol.for("wfrp4e-core-pl.babeleIndexPatch");
const PATCH_MARK_FILTERS = Symbol.for("wfrp4e-core-pl.browserFiltersPatched");
const PATCH_MARK_FETCH = Symbol.for("wfrp4e-core-pl.browserFetchPatched");

/**
 * Patch Babele's MappedCompendium.prototype.translateIndex so that compendium
 * index queries requesting extended fields (like entry.system) translate all mapped
 * system data instead of returning stale minimal startup entries.
 */
export function patchBabeleIndexTranslation(babele = globalThis.game?.babele) {
	const patchPrototype = proto => {
		if (!proto || proto[PATCH_MARK_INDEX] || typeof proto.translateIndex !== "function") return;
		const origTranslateIndex = proto.translateIndex;
		proto.translateIndex = function(index) {
			if (!Array.isArray(index)) return origTranslateIndex.call(this, index);
			for (const entry of index) {
				if (!entry) continue;
				const hasExtendedFields = Object.keys(entry).some(
					key => !["_id", "id", "name", "type", "img", "sort", "folder", "_stats", "flags"].includes(key)
				);
				if (entry.system || hasExtendedFields) {
					const toTranslate = entry.translated ? foundry.utils.mergeObject({}, entry, { inplace: false }) : entry;
					delete toTranslate.translated;
					const translated = this.translate(toTranslate, false);
					foundry.utils.mergeObject(entry, translated, { inplace: true });
				} else {
					origTranslateIndex.call(this, [entry]);
				}
			}
			return index;
		};
		proto[PATCH_MARK_INDEX] = true;
	};

	try {
		import("/modules/babele/script/compendium/mapped-compendium.js")
			.then(mod => {
				if (mod?.MappedCompendium?.prototype) {
					patchPrototype(mod.MappedCompendium.prototype);
				}
			})
			.catch(() => {});
	} catch (_err) {}

	const sample = babele?.mappedCompendiumFor?.("wfrp4e-core.items")
		|| babele?.translatedCompendiumFor?.("wfrp4e-core.items");
	if (sample) patchPrototype(Object.getPrototypeOf(sample));
}

/**
 * Income skill value getter: resolves skill names at the indices defined by system.incomeSkill.
 */
function getIncomeSkills(data) {
	const skills = Array.isArray(data.system?.skills) ? data.system.skills : [];
	const enSkills = Array.isArray(data.flags?.babele?.originalPayload?.skills) ? data.flags.babele.originalPayload.skills : [];
	const indices = Array.isArray(data.system?.incomeSkill) ? data.system.incomeSkill : [];
	const pl = indices.map(idx => skills[idx]).filter(Boolean);
	const en = indices.map(idx => enSkills[idx]).filter(Boolean);
	return [...pl, ...en];
}

/**
 * Patch Career and CareerPath filter definitions so that career search fields
 * (class, careergroup, skills, talents, trappings, incomeSkill) match both Polish
 * and English queries.
 */
export function patchCareerFilters() {
	const CareerModel = globalThis.CONFIG?.Item?.dataModels?.career;
	if (CareerModel && !CareerModel[PATCH_MARK_FILTERS]) {
		const origGetter = Object.getOwnPropertyDescriptor(CareerModel, "compendiumBrowserFilters")?.get;
		if (origGetter) {
			Object.defineProperty(CareerModel, "compendiumBrowserFilters", {
				get() {
					const filters = origGetter.call(this);

					// 1. Class
					const classFilter = filters.get("class");
					if (classFilter?.config) {
						classFilter.config.valueGetter = data => {
							const pl = data.system?.class?.value;
							const en = data.flags?.babele?.originalPayload?.class;
							return [pl, en].filter(Boolean).join(", ");
						};
					}

					// 2. Career Group
					const groupFilter = filters.get("careergroup");
					if (groupFilter?.config) {
						groupFilter.config.valueGetter = data => {
							const pl = data.system?.careergroup?.value;
							const en = data.flags?.babele?.originalPayload?.careergroup;
							return [pl, en].filter(Boolean).join(", ");
						};
					}

					// 3. Skills
					const skillsFilter = filters.get("skills");
					if (skillsFilter?.config) {
						skillsFilter.config.valueGetter = data => {
							const pl = Array.isArray(data.system?.skills) ? data.system.skills : [];
							const en = Array.isArray(data.flags?.babele?.originalPayload?.skills) ? data.flags.babele.originalPayload.skills : [];
							return [...pl, ...en];
						};
					}

					// 4. Talents
					const talentsFilter = filters.get("talents");
					if (talentsFilter?.config) {
						talentsFilter.config.valueGetter = data => {
							const pl = Array.isArray(data.system?.talents) ? data.system.talents : [];
							const en = Array.isArray(data.flags?.babele?.originalPayload?.talents) ? data.flags.babele.originalPayload.talents : [];
							return [...pl, ...en];
						};
					}

					// 5. Trappings
					const trappingsFilter = filters.get("trappings");
					if (trappingsFilter?.config) {
						trappingsFilter.config.valueGetter = data => {
							const pl = Array.isArray(data.system?.trappings) ? data.system.trappings : [];
							const en = Array.isArray(data.flags?.babele?.originalPayload?.trappings) ? data.flags.babele.originalPayload.trappings : [];
							return [...pl, ...en];
						};
					}

					// 6. Income Skill
					const incomeFilter = filters.get("incomeSkill");
					if (incomeFilter) {
						incomeFilter.createFilter = (fList, value, def) => {
							if (!value) return;
							const val = value.includes(",") ? value.split(",").map(s => s.trim()).filter(Boolean) : value;
							const operation = Array.isArray(val) ? (def.config.multiple ? "icontainsall" : "icontainsany") : "icontains";
							fList.push({
								k: "system.skills",
								v: val,
								o: operation,
								g: getIncomeSkills
							});
							fList.push({
								k: "system.incomeSkill",
								v: [true],
								o: "in",
								g: () => true
							});
						};
					}

					return filters;
				},
				configurable: true
			});
			CareerModel[PATCH_MARK_FILTERS] = true;
		}
	}

	const CareerPathModel = globalThis.CONFIG?.Item?.dataModels?.careerPath;
	if (CareerPathModel && !CareerPathModel[PATCH_MARK_FILTERS]) {
		const origPathGetter = Object.getOwnPropertyDescriptor(CareerPathModel, "compendiumBrowserFilters")?.get;
		if (origPathGetter) {
			Object.defineProperty(CareerPathModel, "compendiumBrowserFilters", {
				get() {
					const filters = origPathGetter.call(this);
					const classFilter = filters.get("class");
					if (classFilter?.config) {
						classFilter.config.valueGetter = data => {
							const pl = data.system?.class?.value;
							const en = data.flags?.babele?.originalPayload?.class;
							return [pl, en].filter(Boolean).join(", ");
						};
					}
					return filters;
				},
				configurable: true
			});
			CareerPathModel[PATCH_MARK_FILTERS] = true;
		}
	}
}

/**
 * Patch Actor filter definitions so that species searches match Polish, English,
 * and internal species keys.
 */
export function patchActorFilters() {
	const actorTypes = ["character", "npc", "creature"];
	for (const type of actorTypes) {
		const model = globalThis.CONFIG?.Actor?.dataModels?.[type];
		if (!model || model[PATCH_MARK_FILTERS]) continue;
		const origGetter = Object.getOwnPropertyDescriptor(model, "compendiumBrowserFilters")?.get;
		if (origGetter) {
			Object.defineProperty(model, "compendiumBrowserFilters", {
				get() {
					const filters = origGetter.call(this);
					const speciesFilter = filters.get("species");
					if (speciesFilter?.config) {
						speciesFilter.config.valueGetter = data => {
							const pl = data.system?.details?.species?.value;
							const en = data.flags?.babele?.originalPayload?.species;
							const speciesMap = globalThis.game?.wfrp4e?.config?.species || {};
							const mappedKey = Object.entries(speciesMap).find(([, v]) => typeof v === "string" && v.toLowerCase() === pl?.toLowerCase?.())?.[0];
							return [pl, en, mappedKey].filter(Boolean).join(", ");
						};
					}
					return filters;
				},
				configurable: true
			});
			model[PATCH_MARK_FILTERS] = true;
		}
	}
}

/**
 * Wrap warhammer.apps.CompendiumBrowser.fetch so that name search queries match
 * both Polish translated names and original English names.
 */
export function patchCompendiumBrowserFetch() {
	const CompendiumBrowser = globalThis.warhammer?.apps?.CompendiumBrowser;
	if (!CompendiumBrowser || CompendiumBrowser[PATCH_MARK_FETCH] || typeof CompendiumBrowser.fetch !== "function") return;
	const origFetch = CompendiumBrowser.fetch;
	CompendiumBrowser.fetch = async function(documentClass, options = {}) {
		if (Array.isArray(options.filters)) {
			for (const filter of options.filters) {
				if (filter && filter.k === "name" && !filter.g) {
					filter.g = data => [data?.name, data?.flags?.babele?.originalName, data?.originalName].filter(Boolean).join(", ");
				}
			}
		}
		return origFetch.call(this, documentClass, options);
	};
	CompendiumBrowser[PATCH_MARK_FETCH] = true;
}

function installBrowserCompatibility() {
	patchCareerFilters();
	patchActorFilters();
	patchCompendiumBrowserFetch();
}

Hooks.once("init", installBrowserCompatibility);
Hooks.once("setup", installBrowserCompatibility);
Hooks.once("ready", () => {
	installBrowserCompatibility();
	patchBabeleIndexTranslation();
});
Hooks.once("babele.init", (babele) => patchBabeleIndexTranslation(babele));
Hooks.once("babele.ready", (babele) => patchBabeleIndexTranslation(babele));
