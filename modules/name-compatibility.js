const MODULE_ID = "wfrp4e-core-pl";
const PATCH_MARK = Symbol.for(MODULE_ID + ".nameCompatibility");
const FORMULA_PATCH_MARK = Symbol.for(MODULE_ID + ".formulaCompatibility");
const MIGRATION_PATCH_MARK = Symbol.for(MODULE_ID + ".migrationCompatibility");

// Formula fields in the official compendia are system data, so Babele leaves
// them in English. WFRP4e, however, compares those fields with the currently
// localized characteristic labels. Keep the stored formula untouched and
// translate only the tokens passed to the v14 formula parser.
const ENGLISH_CHARACTERISTICS = Object.freeze({
	ws: "Weapon Skill",
	bs: "Ballistic Skill",
	s: "Strength",
	t: "Toughness",
	i: "Initiative",
	ag: "Agility",
	dex: "Dexterity",
	int: "Intelligence",
	wp: "Willpower",
	fel: "Fellowship",
});

// Stable WFRP lore keys are stored in system data, while generated document
// names use human-readable specializations. Accept all three forms (key,
// English label and current localized label), but only localize the display
// name. This keeps scripts and system fields language-independent.
const ENGLISH_MAGIC_LORES = Object.freeze({
	petty: "Petty",
	beasts: "Beasts",
	death: "Death",
	fire: "Fire",
	heavens: "Heavens",
	metal: "Metal",
	life: "Life",
	light: "Light",
	shadow: "Shadow",
	hedgecraft: "Hedgecraft",
	witchcraft: "Witchcraft",
	daemonology: "Daemonology",
	necromancy: "Necromancy",
	undivided: "Undivided",
	nurgle: "Nurgle",
	slaanesh: "Slaanesh",
	tzeentch: "Tzeentch",
});

export function localizedSpecialization(value) {
	if (typeof value !== "string") {
		return value;
	}
	const expected = value.trim().toLocaleLowerCase();
	for (const [key, english] of Object.entries(ENGLISH_MAGIC_LORES)) {
		const configured = game.wfrp4e?.config?.magicLores?.[key]
			?? "WFRP4E.MagicLores." + key;
		const localized = game.i18n?.localize?.(configured) ?? configured;
		if ([key, english, key === "petty" ? "Petty Magic" : null, configured, localized].some(candidate =>
			typeof candidate === "string" && candidate.toLocaleLowerCase() === expected
		)) {
			return localized;
		}
	}
	return value.trim();
}

function replaceFormulaToken(formula, token, replacement) {
	if (!token || !replacement || token.toLocaleLowerCase() === replacement.toLocaleLowerCase()) {
		return formula;
	}
	const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return formula.replace(new RegExp("\\b" + escaped + "\\b", "giu"), replacement);
}

export function normalizeSpellFormula(formula) {
	if (typeof formula !== "string") {
		return formula;
	}

	let normalized = formula;
	for (const [key, english] of Object.entries(ENGLISH_CHARACTERISTICS)) {
		// Bonuses must be handled first so "Willpower" is not consumed from
		// the longer "Willpower Bonus" token.
		normalized = replaceFormulaToken(
			normalized,
			english + " Bonus",
			game.wfrp4e?.config?.characteristicsBonus?.[key],
		);
		normalized = replaceFormulaToken(
			normalized,
			english,
			game.wfrp4e?.config?.characteristics?.[key],
		);
	}

	// Units are labels, not control tokens. Localizing them here makes an
	// original formula display naturally without changing compendium data.
	for (const key of ["yards", "Rounds", "Seconds", "Minutes", "Hours", "Days"]) {
		normalized = replaceFormulaToken(normalized, game.i18n?._fallback?.[key] ?? key, game.i18n?.localize?.(key));
	}
	return normalized;
}

export function installFormulaCompatibility() {
	const models = [globalThis.CONFIG?.Item?.dataModels?.spell, globalThis.CONFIG?.Item?.dataModels?.prayer]
		.filter(Boolean);
	let installed = false;

	for (const Model of new Set(models)) {
		const prototype = Model.prototype;
		if (prototype[FORMULA_PATCH_MARK]) {
			continue;
		}

		let patched = false;
		const originalCompute = prototype.computeSpellPrayerFormula;
		if (typeof originalCompute === "function") {
			prototype.computeSpellPrayerFormula = function (type, options = {}) {
				const source = options.formulaOverride ?? this[type]?.value;
				return originalCompute.call(this, type, {
					...options,
					formulaOverride: normalizeSpellFormula(source),
				});
			};
			patched = true;
		}

		const originalDamage = prototype.computeSpellDamage;
		if (typeof originalDamage === "function") {
			prototype.computeSpellDamage = function (formula, options) {
				return originalDamage.call(this, normalizeSpellFormula(formula), options);
			};
			patched = true;
		}

		if (patched) {
			Object.defineProperty(prototype, FORMULA_PATCH_MARK, {value: true});
			installed = true;
		}
	}
	return installed;
}

export function installMigrationCompatibility() {
	const modelMaps = [
		globalThis.CONFIG?.Actor?.dataModels,
		globalThis.CONFIG?.Item?.dataModels,
	].filter(Boolean);
	const models = new Set(modelMaps.flatMap(modelMap => Object.values(modelMap)));
	let installed = false;

	for (const Model of models) {
		const originalMigrate = Model?.migrateData;
		if (!Model || Object.hasOwn(Model, MIGRATION_PATCH_MARK) || typeof originalMigrate !== "function") {
			continue;
		}

		Model.migrateData = function (data, ...args) {
			return originalMigrate.call(this, data, ...args) ?? data;
		};
		Object.defineProperty(Model, MIGRATION_PATCH_MARK, {value: true});
		installed = true;
	}
	return installed;
}
function valueAt(object, path) {
	return path.split(".").reduce((value, key) => value?.[key], object);
}

function sourceIndexEntry(document) {
	const sourceId = valueAt(document, "flags.core.sourceId")
		?? valueAt(document, "_stats.compendiumSource");
	if (!sourceId || !globalThis.foundry?.utils?.parseUuid) {
		return null;
	}

	try {
		const parsed = foundry.utils.parseUuid(sourceId);
		const collection = parsed?.collection;
		const documentId = parsed?.documentId ?? parsed?.id;
		return collection?.index?.get?.(documentId)
			?? collection?.index?.find?.(entry => (entry._id ?? entry.id) === documentId)
			?? null;
	}
	catch (_error) {
		return null;
	}
}

/**
 * Return every name by which a translated document may safely be addressed.
 * Current names come first so a real Polish name always wins over an alias.
 */
export function aliases(document) {
	if (!document) {
		return [];
	}

	const indexEntry = sourceIndexEntry(document);
	const dynamicAliases = valueAt(document, "flags." + MODULE_ID + ".nameAliases") ?? [];
	const candidates = [
		document.name,
		document.originalName,
		valueAt(document, "flags.babele.originalName"),
		...(Array.isArray(dynamicAliases) ? dynamicAliases : []),
		indexEntry?.name,
		indexEntry?.originalName,
		valueAt(indexEntry, "flags.babele.originalName"),
	];

	return candidates.filter((name, index) =>
		typeof name === "string" && name.length > 0 && candidates.indexOf(name) === index
	);
}

export function original(document) {
	if (!document) {
		return undefined;
	}
	const indexEntry = sourceIndexEntry(document);
	return document.originalName
		?? valueAt(document, "flags.babele.originalName")
		?? indexEntry?.originalName
		?? valueAt(indexEntry, "flags.babele.originalName")
		?? indexEntry?.name
		?? document.name;
}

export function matches(document, query, {caseInsensitive = false} = {}) {
	if (typeof query !== "string") {
		return false;
	}
	if (caseInsensitive) {
		const expected = query.toLocaleLowerCase();
		return aliases(document).some(name => name.toLocaleLowerCase() === expected);
	}
	return aliases(document).includes(query);
}

export function includes(document, query, {caseInsensitive = false} = {}) {
	if (typeof query !== "string") {
		return false;
	}
	if (caseInsensitive) {
		const expected = query.toLocaleLowerCase();
		return aliases(document).some(name => name.toLocaleLowerCase().includes(expected));
	}
	return aliases(document).some(name => name.includes(query));
}

export function oneOf(document, queries, options) {
	return Array.isArray(queries) && queries.some(query => matches(document, query, options));
}

export function find(collection, query) {
	const exact = collection?.getName?.(query);
	if (exact) {
		return exact;
	}
	const documents = Array.isArray(collection?.contents)
		? collection.contents
		: typeof collection?.values === "function"
			? collection.values()
			: collection ?? [];
	return Array.from(documents).find(document => matches(document, query));
}

function collectionValues(collection) {
	if (!collection) {
		return [];
	}
	if (Array.isArray(collection.contents)) {
		return collection.contents;
	}
	if (typeof collection.values === "function") {
		return collection.values();
	}
	return collection;
}

function indexedNameDocuments() {
	const documents = [...collectionValues(globalThis.game?.items)];
	for (const actor of collectionValues(globalThis.game?.actors)) {
		documents.push(...collectionValues(actor.items));
	}
	for (const pack of collectionValues(globalThis.game?.packs)) {
		documents.push(...collectionValues(pack.index));
	}
	return documents;
}

function translatedCompendiumName(query, types) {
	const translateField = game.babele?.translateField;
	if (typeof translateField !== "function") {
		return null;
	}

	const collections = ["wfrp4e-core.items"];
	for (const pack of game.wfrp4e?.tags?.getPacksWithTag?.(types) ?? []) {
		const collection = pack?.collection;
		if (typeof collection === "string" && !collections.includes(collection)) {
			collections.push(collection);
		}
	}

	for (const collection of collections) {
		const translated = translateField.call(game.babele, "name", collection, {name: query});
		if (typeof translated === "string" && translated.length > 0 && translated !== query) {
			return translated;
		}
	}
	return null;
}

/**
 * Resolve an original or translated label to the current document language.
 * This is intentionally synchronous: Foundry's already loaded compendium
 * indexes are consulted, but this helper never triggers a pack load while an
 * effect script is running.
 */
export function display(query, type) {
	if (typeof query !== "string") {
		return query;
	}
	const types = normalizeTypes(type);
	const translated = translatedCompendiumName(query, types);
	if (translated) {
		return translated;
	}
	const documents = indexedNameDocuments().filter(document => hasType(document, types));
	const exact = documents.find(document => document?.name === query);
	const alias = exact ?? documents.find(document => matches(document, query));
	if (alias) {
		return alias.name;
	}

	const utility = game.wfrp4e?.utility;
	const baseDocument = utility
		? documents.find(document => matchingBaseAlias(utility, document, query))
		: null;
	if (baseDocument) {
		const matchedAlias = matchingBaseAlias(utility, baseDocument, query);
		return localizedSpecializedName(utility, baseDocument, query, matchedAlias);
	}
	return query;
}

function localizedChoice(value, type) {
	if (typeof value !== "string" || /^random\[|^\d+$/.test(value.trim())) {
		return value;
	}
	const direct = game.i18n?.localize?.(value) ?? value;
	if (direct !== value) {
		return direct;
	}
	return value.split(/\s*,\s*/).map(part => {
		const localized = game.i18n?.localize?.(part) ?? part;
		return localized !== part ? localized : display(part, type);
	}).join(", ");
}

export function localizeSpeciesSkillsTalents(data) {
	if (!data || game.i18n?.lang !== "pl") {
		return data;
	}
	const talentReplacement = {};
	for (const [source, replacement] of Object.entries(data.talentReplacement ?? {})) {
		const localizedSource = localizedChoice(source, "talent");
		const localizedReplacement = localizedChoice(replacement, "talent");
		talentReplacement[source] = localizedReplacement;
		talentReplacement[localizedSource] = localizedReplacement;
	}
	return {
		...data,
		skills: (data.skills ?? []).map(value => localizedChoice(value, "skill")),
		talents: (data.talents ?? []).map(value => localizedChoice(value, "talent")),
		traits: (data.traits ?? []).map(value => localizedChoice(value, "trait")),
		randomTalents: {...(data.randomTalents ?? {})},
		talentReplacement,
	};
}

function normalizeTypes(type) {
	if (typeof type === "string") {
		return [type];
	}
	return Array.isArray(type) ? type : [];
}

function hasType(document, types) {
	return types.length === 0 || types.includes(document?.type);
}

function extractBaseName(utility, name) {
	return utility.extractBaseName(String(name ?? ""));
}

export function matchingBaseAlias(utility, document, query) {
	const base = extractBaseName(utility, query);
	return aliases(document).find(name => extractBaseName(utility, name) === base);
}

export function localizedSpecializedName(utility, document, query, matchedAlias) {
	const requested = String(query ?? "");
	const displayName = String(document?.name ?? requested);
	const displayBase = extractBaseName(utility, displayName);
	const matchedBase = extractBaseName(utility, matchedAlias);
	const opening = requested.indexOf("(");

	if (matchedBase === displayBase) {
		return requested;
	}
	if (opening < 0) {
		return displayBase;
	}

	const closing = requested.lastIndexOf(")");
	if (closing < opening) {
		return displayBase + " " + requested.slice(opening);
	}
	const specialization = requested.slice(opening + 1, closing);
	const suffix = "(" + localizedSpecialization(specialization) + ")" + requested.slice(closing + 1);
	return displayBase + " " + suffix;
}

function addRequestedAlias(item, query) {
	if (!item || typeof query !== "string" || !query.length) {
		return;
	}
	const path = "flags." + MODULE_ID + ".nameAliases";
	const current = valueAt(item, path) ?? [];
	const nameAliases = Array.from(new Set([...(Array.isArray(current) ? current : []), query]));
	item.updateSource?.({[path]: nameAliases});
}

async function findAliasExact(name, type) {
	const types = normalizeTypes(type);
	const worldItem = game.items.contents.find(item => hasType(item, types) && matches(item, name));
	if (worldItem) {
		return worldItem;
	}

	for (const pack of game.wfrp4e.tags.getPacksWithTag(types)) {
		const index = pack.indexed ? pack.index : await pack.getIndex();
		const entry = index.find(item => hasType(item, types) && matches(item, name));
		if (entry) {
			return pack.getDocument(entry._id);
		}
	}
}

async function findAliasBase(utility, name, type) {
	const types = normalizeTypes(type);
	let document;
	let matchedAlias;

	for (const item of game.items.contents) {
		if (hasType(item, types)) {
			matchedAlias = matchingBaseAlias(utility, item, name);
			if (matchedAlias) {
				document = item;
				break;
			}
		}
	}

	if (!document) {
		for (const pack of game.wfrp4e.tags.getPacksWithTag(types)) {
			const index = pack.indexed ? pack.index : await pack.getIndex();
			const entry = index.find(item => hasType(item, types) && matchingBaseAlias(utility, item, name));
			if (entry) {
				matchedAlias = matchingBaseAlias(utility, entry, name);
				document = await pack.getDocument(entry._id);
				break;
			}
		}
	}

	if (!document) {
		return undefined;
	}

	const item = document.clone();
	item.updateSource({name: localizedSpecializedName(utility, document, name, matchedAlias)});
	addRequestedAlias(item, name);
	return item;
}

export function installNameCompatibility() {
	const utility = game.wfrp4e?.utility;
	const ActorClass = game.wfrp4e?.documents?.ActorWFRP4e;
	if (!utility || !ActorClass || utility[PATCH_MARK]) {
		return false;
	}

	const originalFindExactName = utility.findExactName;
	const originalFindBaseName = utility.findBaseName;
	const originalHas = ActorClass.prototype.has;
	const originalSetupSkill = ActorClass.prototype.setupSkill;
	const originalSpeciesSkillsTalents = utility.speciesSkillsTalents;

	utility.findExactName = async function (name, type) {
		const result = await originalFindExactName.call(this, name, type);
		return result ?? findAliasExact(name, type);
	};

	utility.findBaseName = async function (name, type) {
		const result = await originalFindBaseName.call(this, name, type);
		return result ?? findAliasBase(this, name, type);
	};

	ActorClass.prototype.has = function (name, type = "trait") {
		const result = originalHas.call(this, name, type);
		return result ?? this.itemTags[type]?.find(item => item.included && matches(item, name));
	};

	ActorClass.prototype.setupSkill = function (skill, ...args) {
		if (typeof skill === "string") {
			const skills = this.itemTags.skill ?? [];
			const currentName = skill.toLocaleLowerCase();
			skill = skills.find(item => item.name.toLocaleLowerCase() === currentName)
				?? skills.find(item => matches(item, skill, {caseInsensitive: true}))
				?? skill;
		}
		return originalSetupSkill.call(this, skill, ...args);
	};

	if (typeof originalSpeciesSkillsTalents === "function") {
		utility.speciesSkillsTalents = function (...args) {
			return localizeSpeciesSkillsTalents(originalSpeciesSkillsTalents.apply(this, args));
		};
	}

	Object.defineProperty(utility, PATCH_MARK, {value: true});
	game.wfrp4eCorePl ??= {};
	game.wfrp4eCorePl.names = {
		aliases,
		display,
		find,
		includes,
		matches,
		matchingBaseAlias: matchingBaseAlias.bind(null, utility),
		localizedSpecializedName: localizedSpecializedName.bind(null, utility),
		localizedSpecialization,
		localizeSpeciesSkillsTalents,
		oneOf,
		original,
	};
	return true;
}

if (globalThis.Hooks) {
	Hooks.once("init", () => {
		installNameCompatibility();
		installFormulaCompatibility();
		installMigrationCompatibility();
	});
	Hooks.once("ready", () => {
		// Retry after Babele and every premium module have initialized. The
		// patch is idempotent, so this only matters when the system API was not
		// yet exposed during this module's init callback.
		installNameCompatibility();
		installFormulaCompatibility();
		installMigrationCompatibility();
	});

	const elements = (html, selector) => {
		if (typeof html?.find === "function") {
			return Array.from(html.find(selector));
		}
		const root = html?.[0] ?? html;
		return root?.querySelectorAll ? Array.from(root.querySelectorAll(selector)) : [];
	};

	Hooks.on("renderCharGenWfrp4e", (_app, html) => {
		if (game.i18n?.lang !== "pl") {
			return;
		}
		const original = "Please note that until character creation is updated to AppV2 it may have issues!";
		const translated = game.i18n.localize("WFRP4EPL.ChargenAppV2Warning");
		for (const warning of elements(html, ".notification.warning")) {
			if (warning.textContent?.trim() === original) {
				warning.textContent = translated;
			}
		}
	});

	Hooks.on("renderSpeciesStage", (_app, html) => {
		if (game.i18n?.lang !== "pl") {
			return;
		}
		const translatedOr = game.i18n.localize("SkillsOr");
		for (const emphasis of elements(html, "em")) {
			if (emphasis.textContent?.trim() === "or") {
				emphasis.textContent = translatedOr;
			}
		}
	});
}
