
// Safe advancement handlers for Randomize buttons (C, U, T)
export async function safeAdvanceSpeciesSkills(actor) {
	const rawSpecies = actor?.system?.details?.species?.value;
	const rawSubspecies = actor?.system?.details?.species?.subspecies;
	const resolveSpecies = game.wfrp4eCorePl?.names?.resolveSpeciesKey || ((s) => s);
	const resolveSubspecies = game.wfrp4eCorePl?.names?.resolveSubspeciesKey || ((k, sub) => sub);
	const speciesKey = resolveSpecies(rawSpecies);
	const subspeciesKey = resolveSubspecies(speciesKey, rawSubspecies);

	if (!speciesKey || speciesKey === "N/A") {
		ui.notifications?.warn("Wybierz najpierw rasę na karcie postaci.");
		return;
	}

	let skillData = game.wfrp4e?.utility?.speciesSkillsTalents(speciesKey, subspeciesKey);
	let skills = skillData?.skills || game.wfrp4e?.config?.speciesSkills?.[speciesKey];

	if (!skills || !skills.length) {
		ui.notifications?.warn(game.i18n?.format("ERROR.Species", { name: rawSpecies || speciesKey }));
		return;
	}

	const displayFn = game.wfrp4eCorePl?.names?.display;
	if (typeof displayFn === "function") {
		skills = skills.map(s => displayFn(s, "skill") || s);
	}

	const maxSkills = Math.min(6, skills.length);
	const skillSelector = new Roll(`1d${skills.length} - 1`);
	await skillSelector.roll({ allowInteractive: false });

	const skillsSelected = [];
	let attempts = 0;
	while (skillsSelected.length < maxSkills && attempts < 100) {
		attempts++;
		const r = await skillSelector.reroll();
		const idx = Math.max(0, Math.min(skills.length - 1, Number(r.total)));
		if (!isNaN(idx) && !skillsSelected.includes(idx)) {
			skillsSelected.push(idx);
		}
	}
	for (let i = 0; i < skills.length && skillsSelected.length < maxSkills; i++) {
		if (!skillsSelected.includes(i)) skillsSelected.push(i);
	}

	const toUpdate = [];
	const toCreate = [];

	for (let i = 0; i < skillsSelected.length; i++) {
		const skillName = skills[skillsSelected[i]];
		const advances = i <= 2 ? 5 : 3;

		let existingSkill = actor.has?.(skillName, "skill");
		if (existingSkill) {
			const obj = existingSkill.toObject();
			obj.system.advances.value = Math.max(obj.system.advances.value || 0, advances);
			toUpdate.push(obj);
		} else {
			try {
				let skillDoc = await game.wfrp4e?.utility?.findSkill(skillName);
				if (skillDoc) {
					const obj = skillDoc.toObject();
					delete obj._id;
					obj.system.advances.value = advances;
					toCreate.push(obj);
				}
			} catch (err) {
				console.error("Could not find skill: " + skillName, err);
			}
		}
	}

	if (toUpdate.length) await actor.updateEmbeddedDocuments("Item", toUpdate);
	if (toCreate.length) await actor.createEmbeddedDocuments("Item", toCreate);

	ui.notifications?.info(`Wylosowano umiejętności rasowe (${skillsSelected.length}) dla rasy ${rawSpecies || speciesKey}.`);
}

export async function safeAdvanceSpeciesCharacteristics(actor) {
	const rawSpecies = actor?.system?.details?.species?.value;
	const rawSubspecies = actor?.system?.details?.species?.subspecies;
	const resolveSpecies = game.wfrp4eCorePl?.names?.resolveSpeciesKey || ((s) => s);
	const resolveSubspecies = game.wfrp4eCorePl?.names?.resolveSubspeciesKey || ((k, sub) => sub);
	const speciesKey = resolveSpecies(rawSpecies);
	const subspeciesKey = resolveSubspecies(speciesKey, rawSubspecies);

	if (actor.type !== "creature" && (!speciesKey || speciesKey === "N/A")) {
		ui.notifications?.warn("Wybierz najpierw rasę na karcie postaci.");
		return;
	}

	let creatureMethod = actor.type === "creature" || !speciesKey;
	let characteristics = actor.toObject().system.characteristics;

	if (!creatureMethod) {
		try {
			let averageCharacteristics = await game.wfrp4e.utility.speciesCharacteristics(speciesKey, true, subspeciesKey);
			for (let char in characteristics) {
				if (characteristics[char].initial != averageCharacteristics[char].value) {
					creatureMethod = true;
					break;
				}
			}
		} catch (e) {
			creatureMethod = true;
		}
	}

	if (!creatureMethod) {
		try {
			let rolledCharacteristics = await game.wfrp4e.utility.speciesCharacteristics(speciesKey, false, subspeciesKey);
			for (let char in rolledCharacteristics) {
				characteristics[char].initial = rolledCharacteristics[char].value;
			}
			await actor.update({ "system.characteristics": characteristics });
			ui.notifications?.info(`Wylosowano cechy dla rasy ${rawSpecies || speciesKey}.`);
			return;
		} catch (e) {
			creatureMethod = true;
		}
	}

	let roll = new Roll("2d10");
	await roll.roll({ allowInteractive: false });
	for (let char in characteristics) {
		if (characteristics[char].initial == 0) continue;
		characteristics[char].modifier = -10;
		characteristics[char].modifier += (await roll.reroll()).total;
	}
	await actor.update({ "system.characteristics": characteristics });
	ui.notifications?.info("Wylosowano modyfikatory cech.");
}

export async function findAndRollTalentFromTable() {
	try {
		const res = await game.wfrp4e?.tables?.rollTable("talents");
		const name = res?.text || res?.object?.name || res?.name;
		if (name) return name;
	} catch (e) {}

	const tablePacks = game.packs.filter(p => p.metadata?.type === "RollTable" || p.documentName === "RollTable");
	for (const pack of tablePacks) {
		let index = pack.indexed ? pack.index : await pack.getIndex({ fields: ["flags.wfrp4e.key", "name"] });
		const entry = index.find(i => 
			i.flags?.wfrp4e?.key === "talents" ||
			i.name === "Talents - Character Creation" ||
			i.name === "Losowe Talenty" ||
			(i.name?.toLowerCase().includes("talent") && (i.name.includes("Creation") || i.name.includes("Losowe") || i.name.includes("Character")))
		);
		if (entry) {
			try {
				const tableDoc = await pack.getDocument(entry._id);
				if (tableDoc) {
					const roll = await tableDoc.roll({ async: true });
					const rollResult = roll?.results?.[0];
					if (rollResult) {
						const rawText = rollResult.getChatText?.() || rollResult.text || rollResult.name;
						const label = game.wfrp4e?.utility?.extractLinkLabel?.(rawText) || rollResult.name || rawText;
						if (label) return label;
					}
				}
			} catch (e) {
				console.error("Error rolling compendium table:", e);
			}
		}
	}
	return null;
}

export async function safeAdvanceSpeciesTalents(actor) {
	const rawSpecies = actor?.system?.details?.species?.value;
	const rawSubspecies = actor?.system?.details?.species?.subspecies;
	const resolveSpecies = game.wfrp4eCorePl?.names?.resolveSpeciesKey || ((s) => s);
	const resolveSubspecies = game.wfrp4eCorePl?.names?.resolveSubspeciesKey || ((k, sub) => sub);
	const speciesKey = resolveSpecies(rawSpecies);
	const subspeciesKey = resolveSubspecies(speciesKey, rawSubspecies);

	if (!speciesKey || speciesKey === "N/A") {
		ui.notifications?.warn("Wybierz najpierw rasę na karcie postaci.");
		return;
	}

	let talentData = game.wfrp4e?.utility?.speciesSkillsTalents(speciesKey, subspeciesKey);
	let talents = talentData?.talents || game.wfrp4e?.config?.speciesTalents?.[speciesKey];

	if (!talents || !talents.length) {
		ui.notifications?.warn(game.i18n?.format("ERROR.Species", { name: rawSpecies || speciesKey }));
		return;
	}

	let talentsToAdd = [];
	for (let talent of talents) {
		if (!isNaN(talent)) {
			const count = Number(talent);
			for (let i = 0; i < count; i++) {
				const talentName = await findAndRollTalentFromTable();
				if (talentName) {
					let talentDoc = await game.wfrp4e?.utility?.findTalent(talentName);
					if (talentDoc) {
						const obj = talentDoc.toObject();
						delete obj._id;
						talentsToAdd.push(obj);
					}
				}
			}
			continue;
		}

		let talentOptions = String(talent).split(',').map(item => item.trim());
		let chosenTalent = talentOptions[0];
		if (talentOptions.length > 1) {
			let talentSelector = await new Roll(`1d${talentOptions.length} - 1`).roll({ allowInteractive: false });
			chosenTalent = talentOptions[talentSelector.total];
		}
		let talentDoc = await game.wfrp4e?.utility?.findTalent(chosenTalent);
		if (talentDoc) {
			const obj = talentDoc.toObject();
			delete obj._id;
			talentsToAdd.push(obj);
		}
	}

	if (talentsToAdd.length) {
		await actor.createEmbeddedDocuments("Item", talentsToAdd);
		ui.notifications?.info(`Wylosowano talenty rasowe (${talentsToAdd.length}) dla rasy ${rawSpecies || speciesKey}.`);
	}
}

export function installSafeRandomizer() {
	const sheetClasses = [
		game.wfrp4e?.apps?.ActorSheetWFRP4e,
		game.wfrp4e?.apps?.ActorSheetWFRP4eCharacter,
		game.wfrp4e?.apps?.ActorSheetWFRP4eNPC,
		game.wfrp4e?.apps?.ActorSheetWFRP4eCreature
	].filter(Boolean);

	for (const sheetClass of sheetClasses) {
		if (sheetClass._safeRandomizeInstalled) continue;
		sheetClass._safeRandomizeInstalled = true;

		const originalRandomize = sheetClass._randomize;
		sheetClass._randomize = async function (ev, target) {
			const type = target?.dataset?.type || ev?.currentTarget?.dataset?.type || ev?.target?.dataset?.type;
			const actor = this.actor || (this.document instanceof Actor ? this.document : null);
			if (!actor) {
				if (typeof originalRandomize === "function") return originalRandomize.call(this, ev, target);
				return;
			}
			try {
				if (type === "skills") return await safeAdvanceSpeciesSkills(actor);
				if (type === "characteristics") return await safeAdvanceSpeciesCharacteristics(actor);
				if (type === "talents") return await safeAdvanceSpeciesTalents(actor);
			} catch (err) {
				console.error("Safe randomize error:", err);
			}
			if (typeof originalRandomize === "function") {
				return originalRandomize.call(this, ev, target);
			}
		};

		if (sheetClass.DEFAULT_OPTIONS?.actions?.randomize) {
			sheetClass.DEFAULT_OPTIONS.actions.randomize = sheetClass._randomize;
		}
	}
}

// Keep the WFRP4e configuration owned by the system and the official modules.
// The previous implementation copied PrepareSystemItems and large parts of the
// configuration from an older system release. In v14 that replaces new data
// and scripts with a stale snapshot. Only user-facing labels are localized
// here; stable system keys and all executable data remain untouched.

function localizeValues(object) {
	if (!object || typeof object !== "object") {
		return;
	}
	for (const key of Object.keys(object)) {
		if (typeof object[key] === "string") {
			object[key] = game.i18n.localize(object[key]);
		}
	}
}

function localizeNamedEntries(object) {
	if (!object || typeof object !== "object") {
		return;
	}
	for (const entry of Object.values(object)) {
		if (entry && typeof entry.name === "string") {
			entry.name = game.i18n.localize(entry.name);
		}
	}
}

function localizeSubspecies(object) {
	if (!object || typeof object !== "object") {
		return;
	}
	for (const species of Object.values(object)) {
		localizeNamedEntries(species);
	}
}

Hooks.on("i18nInit", () => {
	const config = game.wfrp4e?.config;
	if (!config) {
		return;
	}

	localizeValues(config.species);
	localizeSubspecies(config.subspecies);
	localizeValues(config.vehicleTypes);
	for (const key of Object.keys(config.scriptTriggers ?? {})) {
		const translationKey = "WFRP4E.ScriptTriggers." + key;
		const translated = game.i18n.localize(translationKey);
		config.scriptTriggers[key] = translated === translationKey
			? game.i18n.localize(config.scriptTriggers[key])
			: translated;
	}
	localizeNamedEntries(config.loreEffects);
	localizeNamedEntries(config.symptomEffects);
});

// Safe evaluation of ammunition range and damage modifiers. System WFRP4e runs
// eval() on raw localized strings (e.g. 'ćwierć zasięgu broni' or 'jak broń'), which
// throws SyntaxError and breaks actor preparation. Support all Polish forms gracefully.
function patchWeaponAmmoMods() {
	const WeaponModel = CONFIG.Item?.dataModels?.weapon ?? game.wfrp4e?.models?.WeaponModel;
	if (!WeaponModel || WeaponModel.prototype._wfrp4eCorePlAmmoModsPatched) {
		return;
	}

	WeaponModel.prototype.applyAmmoMods = function(value, type) {
		if (this.ammo?.type === "weapon" && type === "damage") {
			return Number(this.ammo.damage?.value || 0);
		}

		if (!this.ammo || this.ammo.type === "weapon") {
			return value;
		}

		let ammoValue = this.ammo[type]?.value;
		if (!ammoValue) {
			return value;
		}

		if (typeof ammoValue === "number") {
			return value + ammoValue;
		}

		const normalized = String(ammoValue).trim().toLowerCase();

		// As weapon / Jak broń
		if (
			normalized === "as weapon"
			|| normalized === "jak broń"
			|| normalized === "jak w broni"
			|| normalized === "zasięg broni"
			|| normalized === "taki jak broń"
			|| normalized === game.i18n?.localize?.("as weapon")?.toLowerCase()
		) {
			return value;
		}

		// Half weapon / 1/2
		if (
			normalized === "half weapon"
			|| normalized === "1/2 zasięgu broni"
			|| normalized === "1/2 broni"
			|| normalized === "połowa broni"
			|| normalized === game.i18n?.localize?.("half weapon")?.toLowerCase()
		) {
			return Math.floor(value / 2);
		}

		// Third weapon / 1/3
		if (
			normalized === "third weapon"
			|| normalized === "1/3 zasięgu broni"
			|| normalized === "1/3 broni"
			|| normalized === game.i18n?.localize?.("third weapon")?.toLowerCase()
		) {
			return Math.floor(value / 3);
		}

		// Quarter weapon / 1/4 / Ćwierć
		if (
			normalized === "quarter weapon"
			|| normalized === "1/4 zasięgu broni"
			|| normalized === "1/4 broni"
			|| normalized === "ćwierć zasięgu broni"
			|| normalized === "ćwierć broni"
			|| normalized === game.i18n?.localize?.("quarter weapon")?.toLowerCase()
		) {
			return Math.floor(value / 4);
		}

		// Twice weapon / 2x
		if (
			normalized === "twice weapon"
			|| normalized === "2x zasięg broń"
			|| normalized === "2x zasięgu broni"
			|| normalized === "2x broń"
			|| normalized === "podwójny zasięg"
			|| normalized === "podwojony zasięg"
			|| normalized === game.i18n?.localize?.("twice weapon")?.toLowerCase()
		) {
			return value * 2;
		}

		// Formuła numeryczna (np. +10, -5, 20)
		if (/^[\s\d+\-*/().]+$/.test(normalized)) {
			try {
				const parsed = Number(normalized);
				if (!Number.isNaN(parsed)) {
					return value + parsed;
				}
				const result = Function(`"use strict"; return (${value} + ${normalized})`)();
				if (typeof result === "number" && !Number.isNaN(result)) {
					return Math.floor(result);
				}
			}
			catch (_e) {
				try {
					const result = Function(`"use strict"; return (${value}${normalized})`)();
					if (typeof result === "number" && !Number.isNaN(result)) {
						return Math.floor(result);
					}
				}
				catch (_e2) {}
			}
		}

		// Bezpieczny fallback: jeśli to inny tekst (np. nazwa), nie rzucamy błędu eval!
		return value;
	};

	WeaponModel.prototype._wfrp4eCorePlAmmoModsPatched = true;
}

Hooks.on("init", patchWeaponAmmoMods);
Hooks.on("i18nInit", patchWeaponAmmoMods);
Hooks.on("ready", patchWeaponAmmoMods);

// Prevent ActorWFRP4e from creating ActiveEffects inside locked compendiums
// when documents are being read/prepared by Babele or getDocuments()
function patchActorSystemEffects() {
	const ActorWFRP4e = CONFIG.Actor?.documentClass;
	if (!ActorWFRP4e || ActorWFRP4e.prototype._wfrp4eCorePlSystemEffectsPatched) {
		return;
	}

	const origAddSystemEffect = ActorWFRP4e.prototype.addSystemEffect;
	ActorWFRP4e.prototype.addSystemEffect = async function(key) {
		if (this.pack) {
			return;
		}
		return origAddSystemEffect.apply(this, arguments);
	};

	const origRemoveSystemEffect = ActorWFRP4e.prototype.removeSystemEffect;
	ActorWFRP4e.prototype.removeSystemEffect = async function(key) {
		if (this.pack) {
			return;
		}
		return origRemoveSystemEffect.apply(this, arguments);
	};

	ActorWFRP4e.prototype._wfrp4eCorePlSystemEffectsPatched = true;
}

Hooks.on("init", patchActorSystemEffects);
Hooks.on("i18nInit", patchActorSystemEffects);
Hooks.on("ready", patchActorSystemEffects);

// Fix SpellModel.migrateData throwing when source.lore is undefined during partial item updates
function patchSpellMigration() {
	const SpellModel = CONFIG.Item?.dataModels?.spell ?? game.wfrp4e?.models?.SpellModel;
	if (!SpellModel || SpellModel._wfrp4eCorePlSpellMigrationPatched) {
		return;
	}

	const origMigrate = SpellModel.migrateData;
	SpellModel.migrateData = function(source) {
		if (source && !source.lore) {
			source.lore = {};
		}
		return origMigrate.call(this, source);
	};

	SpellModel._wfrp4eCorePlSpellMigrationPatched = true;
}

Hooks.on("init", patchSpellMigration);
Hooks.on("i18nInit", patchSpellMigration);
Hooks.on("ready", patchSpellMigration);

// Fix VehicleModel.checkSize throwing when actor.system.autoCalc is undefined in older/DLC vehicles
function patchVehicleCheckSize() {
	const VehicleModel = CONFIG.Actor?.dataModels?.vehicle ?? game.wfrp4e?.models?.VehicleModel;
	if (!VehicleModel || VehicleModel.prototype._wfrp4eCorePlVehicleSizePatched) {
		return;
	}

	const origCheckSize = VehicleModel.prototype.checkSize;
	VehicleModel.prototype.checkSize = function() {
		const actor = this.parent;
		if (!actor?.system?.autoCalc) {
			return;
		}
		return origCheckSize.apply(this, arguments);
	};

	VehicleModel.prototype._wfrp4eCorePlVehicleSizePatched = true;
}

Hooks.on("init", patchVehicleCheckSize);
Hooks.on("i18nInit", patchVehicleCheckSize);
Hooks.on("ready", patchVehicleCheckSize);

// WFRP 9.6.x inserts this label as a hard-coded English string after the
// Journal page has been enriched, so it cannot be translated in a compendium
// catalog. Localize every rendered Endeavour action without modifying the
// system package itself.
Hooks.on("renderApplicationV2", (application, element) => {
	if (game.i18n?.lang !== "pl") {
		return;
	}
	const root = element?.querySelectorAll
		? element
		: element?.[0] ?? application?.element;
	for (const button of root?.querySelectorAll?.('[data-action="performEndeavour"]') ?? []) {
		button.textContent = game.i18n.localize("WFRP4EPL.PerformEndeavour");
	}
});

// Filter supplement species and subspecies in character generator (SpeciesStage)
// based on whether the corresponding compendium journal is available and translated.
const SUPPLEMENT_SPECIES_REQUIREMENTS = {
	skink: "wfrp4e-lustria.journals",
	chameleonskink: "wfrp4e-lustria.journals",
	familiar: "wfrp4e-archives3.journals",
};

const SUPPLEMENT_SUBSPECIES_REQUIREMENTS = {
	human: {
		tilean: "wfrp4e-up-in-arms.journals",
		"imperial-tilean": "wfrp4e-up-in-arms.journals",
		salzenmunder: "wfrp4e-salzenmund.journals",
		nordlander: ["wfrp4e-salzenmund.journals", "wfrp4e-middenheim.journals"],
		middenheimer: "wfrp4e-middenheim.journals",
		middenlander: "wfrp4e-middenheim.journals",
		bjornling: "wfrp4e-soc.journals",
		sarl: "wfrp4e-soc.journals",
		skaeling: "wfrp4e-soc.journals",
		southbanker: "wfrp4e-archives3.journals",
		eastender: "wfrp4e-archives3.journals",
		hexxerbezrik: "wfrp4e-archives3.journals",
		docklands: "wfrp4e-archives3.journals",
	},
	dwarf: {
		cragforge: "wfrp4e-salzenmund.journals",
		grumsson: "wfrp4e-salzenmund.journals",
		middenheimer: "wfrp4e-middenheim.journals",
		altdorfer: "wfrp4e-archives3.journals",
		norse: ["wfrp4e-soc.journals", "wfrp4e-dwarfs.journals"],
		imperial: "wfrp4e-dwarfs.journals",
		"karaz-a-karak": "wfrp4e-dwarfs.journals",
		"barak-varr": "wfrp4e-dwarfs.journals",
		"karak-azul": "wfrp4e-dwarfs.journals",
		"karak-eight-peaks": "wfrp4e-dwarfs.journals",
		"karak-kadrin": "wfrp4e-dwarfs.journals",
		zhufbar: "wfrp4e-dwarfs.journals",
		"karak-hirn": "wfrp4e-dwarfs.journals",
		"karak-izor": "wfrp4e-dwarfs.journals",
		"karak-norn": "wfrp4e-dwarfs.journals",
	},
	halfling: {
		ashfield: "wfrp4e-archives1.journals",
		brambledown: "wfrp4e-archives1.journals",
		brandysnap: "wfrp4e-archives1.journals",
		hayfoot: "wfrp4e-archives1.journals",
		hollyfoot: "wfrp4e-archives1.journals",
		"hayfoot—hollyfoot": "wfrp4e-archives1.journals",
		lostpockets: "wfrp4e-archives1.journals",
		lowhaven: "wfrp4e-archives1.journals",
		rumster: "wfrp4e-archives1.journals",
		skelfsider: "wfrp4e-archives1.journals",
		thorncobble: "wfrp4e-archives1.journals",
		tumbleberry: "wfrp4e-archives1.journals",
	},
	welf: {
		harioth: "wfrp4e-archives1.journals",
		toriour: "wfrp4e-archives1.journals",
		faniour: "wfrp4e-archives1.journals",
	},
	familiar: {
		badger: "wfrp4e-archives3.journals",
		cat: "wfrp4e-archives3.journals",
		crow: "wfrp4e-archives3.journals",
		fox: "wfrp4e-archives3.journals",
		owl: "wfrp4e-archives3.journals",
		stoat: "wfrp4e-archives3.journals",
	},
};

function isPackJournalAvailable(packKey) {
	const pack = game.packs?.get(packKey);
	if (!pack) {
		return false;
	}
	if (game.i18n?.lang === "pl") {
		return Boolean(game.babele?.isTranslated?.(pack));
	}
	return true;
}

function isRequirementMet(requirement) {
	if (!requirement) {
		return true;
	}
	const packs = Array.isArray(requirement) ? requirement : [requirement];
	return packs.some(packKey => isPackJournalAvailable(packKey));
}

function patchSpeciesStage(SpeciesStage) {
	if (!SpeciesStage || SpeciesStage.prototype._wfrp4eCorePlFilterPatched) {
		return;
	}

	const origSetSpecies = SpeciesStage.prototype.setSpecies;
	SpeciesStage.prototype.setSpecies = function(species) {
		if (typeof origSetSpecies === "function") {
			origSetSpecies.call(this, species);
		} else {
			this.context.species = species;
			const subspecies = Object.keys(game.wfrp4e?.config?.subspecies?.[species] || {})[0];
			if (subspecies) {
				this.context.subspecies = subspecies;
			} else {
				delete this.context.subspecies;
			}
		}

		if (this.context.subspecies) {
			const speciesSub = SUPPLEMENT_SUBSPECIES_REQUIREMENTS[this.context.species];
			const req = speciesSub?.[this.context.subspecies];
			if (req && !isRequirementMet(req)) {
				const allSub = game.wfrp4e?.config?.subspecies?.[this.context.species] || {};
				const validKey = Object.keys(allSub).find(k => {
					const r = speciesSub?.[k];
					return !r || isRequirementMet(r);
				});
				if (validKey) {
					this.context.subspecies = validKey;
				} else {
					delete this.context.subspecies;
				}
			}
		}
	};

	const origGetData = SpeciesStage.prototype.getData;
	SpeciesStage.prototype.getData = async function() {
		if (this.context.species) {
			const extraReq = SUPPLEMENT_SPECIES_REQUIREMENTS[this.context.species];
			if (extraReq && !isRequirementMet(extraReq)) {
				this.context.species = "";
				delete this.context.subspecies;
			}
		}

		if (this.context.species && this.context.subspecies) {
			const speciesSub = SUPPLEMENT_SUBSPECIES_REQUIREMENTS[this.context.species];
			const req = speciesSub?.[this.context.subspecies];
			if (req && !isRequirementMet(req)) {
				const allSub = game.wfrp4e?.config?.subspecies?.[this.context.species] || {};
				const validKey = Object.keys(allSub).find(k => {
					const r = speciesSub?.[k];
					return !r || isRequirementMet(r);
				});
				if (validKey) {
					this.context.subspecies = validKey;
				} else {
					delete this.context.subspecies;
				}
			}
		}

		const data = await origGetData.apply(this, arguments);

		if (data.extraSpecies) {
			const filteredExtra = {};
			for (const [key, label] of Object.entries(data.extraSpecies)) {
				const req = SUPPLEMENT_SPECIES_REQUIREMENTS[key];
				if (!req || isRequirementMet(req)) {
					filteredExtra[key] = label;
				}
			}
			if (Object.keys(filteredExtra).length > 0) {
				data.extraSpecies = filteredExtra;
			} else {
				delete data.extraSpecies;
			}
		}

		if (data.subspeciesChoices && this.context.species) {
			const speciesSub = SUPPLEMENT_SUBSPECIES_REQUIREMENTS[this.context.species];
			const filteredSub = {};
			for (const [subKey, subData] of Object.entries(data.subspeciesChoices)) {
				const req = speciesSub?.[subKey];
				if (!req || isRequirementMet(req)) {
					filteredSub[subKey] = subData;
				}
			}

			if (Object.keys(filteredSub).length > 0) {
				data.subspeciesChoices = filteredSub;
			} else {
				delete data.subspeciesChoices;
				if (this.context.subspecies) {
					delete this.context.subspecies;
				}
				data.speciesDisplay = game.wfrp4e?.config?.species?.[this.context.species] ?? this.context.species;
			}
		}

		return data;
	};

	SpeciesStage.prototype._wfrp4eCorePlFilterPatched = true;
}

function tryPatchSpeciesStage() {
	if (game.wfrp4e?.apps?.SpeciesStage) {
		patchSpeciesStage(game.wfrp4e.apps.SpeciesStage);
	}
}

function patchChargenStages() {
	const CharGenClass = game.wfrp4e?.apps?.CharGenWfrp4e;
	if (CharGenClass && !CharGenClass.prototype._wfrp4eCorePlPatched) {
		const origAddStage = CharGenClass.prototype.addStage;
		CharGenClass.prototype.addStage = function(stage, index, stageData = {}) {
			const stageObj = stage?.stageData ? stage.stageData() : {};
			const key = stageData?.key || stageObj?.key;
			if ((key === "star-sign" || key === "starsign") && !isPackJournalAvailable("wfrp4e-archives2.journals")) {
				return;
			}
			return origAddStage.call(this, stage, index, stageData);
		};

		const origReplaceStage = CharGenClass.prototype.replaceStage;
		CharGenClass.prototype.replaceStage = function(key, stage) {
			if (key === "career" && stage?.name === "SoCCareerStage" && !isPackJournalAvailable("wfrp4e-soc.journals")) {
				return;
			}
			return origReplaceStage.call(this, key, stage);
		};

		CharGenClass.prototype._wfrp4eCorePlPatched = true;
	}
}

function tryPatchComponents() {
	tryPatchSpeciesStage();
	patchChargenStages();
	patchTradeManager();
	patchTradeDialog();
	sanitizeTradeGazetteers();
}

Hooks.on("init", tryPatchComponents);
Hooks.on("ready", tryPatchComponents);
Hooks.on("wfrp4e:chargen", chargen => {
	patchChargenStages();

	const speciesStage = chargen?.stages?.find(s => s.key === "species")?.class;
	if (speciesStage) {
		patchSpeciesStage(speciesStage);
	}

	if (!isPackJournalAvailable("wfrp4e-archives2.journals")) {
		if (Array.isArray(chargen?.stages)) {
			chargen.stages = chargen.stages.filter(s => s.key !== "star-sign" && s.key !== "starsign");
		}
	}

	if (!isPackJournalAvailable("wfrp4e-soc.journals")) {
		const careerStage = chargen?.stages?.find(s => s.key === "career");
		if (careerStage && careerStage.class?.name === "SoCCareerStage") {
			careerStage.class = Object.getPrototypeOf(careerStage.class);
		}
	}
});

// ---------------------------------------------------------------------------
// Obsługa i filtrowanie handlu (/trade): podział na grupy, filtrowanie i spolszczenie
// ---------------------------------------------------------------------------

const SETTLEMENT_NAME_TRANSLATIONS = {
	"Castle Reikguard": "Zamek Reikguard",
	"Castle Grauenburg": "Zamek Grauenburg",
	"Brass Keep": "Mosiężna Twierdza",
	"Hope Square": "Plac Nadziei",
	"Upper Spite": "Górne Zgorszenie",
	"Castle Midfast": "Zamek Midfast",
	"Auld Troldved": "Stary Troldved",
	"Altar of the Crimson Harvest": "Ołtarz Krwawych Żniw",
};

function isModuleSourceAvailable(cfg) {
	if (!cfg) return true;
	if (cfg.id && game.modules?.get(cfg.id)?.active) {
		return true;
	}
	if (cfg.pack && game.packs?.get(cfg.pack)) {
		return true;
	}
	return false;
}

const GAZETTEER_SOURCE_CONFIG = [
	{
		id: "wfrp4e-dotr",
		fileMatch: "wfrp4e-dotr",
		pack: "wfrp4e-dotr.journals",
		group: "Śmierć na rzece Reik (Reikland)",
		groupEn: "Death on the Reik (Reikland)",
	},
	{
		id: "wfrp4e-up-in-arms",
		fileMatch: "wfrp4e-up-in-arms",
		pack: "wfrp4e-up-in-arms.journals",
		group: "Pod broń! (Tilea)",
		groupEn: "Up in Arms (Tilea)",
	},
	{
		id: "wfrp4e-pbtt",
		fileMatch: "wfrp4e-pbtt",
		pack: "wfrp4e-pbtt.journals",
		group: "Szara Eminencja (Middenland)",
		groupEn: "Power Behind the Throne (Middenland)",
	},
	{
		id: "wfrp4e-salzenmund",
		fileMatch: "wfrp4e-salzenmund",
		pack: "wfrp4e-salzenmund.journals",
		group: "Salzenmund (Nordland)",
		groupEn: "Salzenmund (Nordland)",
	},
	{
		id: "wfrp4e-owb3",
		fileMatch: "wfrp4e-owb3",
		pack: "wfrp4e-owb3.journals",
		group: "Stary Świat",
		groupEn: "The Old World",
	},
	{
		id: "wfrp4e-soc",
		fileMatch: "wfrp4e-soc",
		pack: "wfrp4e-soc.journals",
		group: "Morze Szponów (Porty morskie)",
		groupEn: "Sea of Claws (Sea ports)",
	},
];

const PBTT_SETTLEMENT_NAMES = new Set([
	"Middenheim", "Brass Keep", "Gladbeich", "Holzbek", "Hope Square", "Hovelhof",
	"Immelschied", "Jagerhausen", "Linz", "Nordringen", "Oberholzbek", "Schoninhagen",
	"Sohk", "Solzheim", "Thugenheim", "Upper Spite", "Warrenburg",
	"Mosiężna Twierdza", "Plac Nadziei", "Górne Zgorszenie",
]);

const UIA_SETTLEMENT_NAMES = new Set([
	"Luccini", "Anducci", "Pattio", "Miragliano", "Amato", "Campogrotta", "Cammaro",
	"Etobrutti", "Mironia", "Parmis", "Ravola", "Toscania", "Udolpho", "Zeluco",
	"Monte Castello", "Pavona", "Bucollia", "Lambrusco", "Organza", "Remas",
	"Alcatani", "Catrazza", "Ciarascura", "Motta Zorella", "Monte Negro", "Scintio",
	"Vennia", "Zorasta", "Sartosa", "Tobaro", "Cera-Scuro", "Vedenza", "Trantio",
	"Ducieso", "Terramorta", "Torrico", "Varenna", "Viccia", "Verezzo", "Ciabbatta",
	"Nonucci", "Riccotta", "Veddia",
]);

const SALZENMUND_SETTLEMENT_NAMES = new Set([
	"Beeckerhoven", "Grafenrich", "Oldenlitz", "Gaussfurt", "Tettens", "Odisheim",
	"Silbertief", "Hohenaspe", "Kurtwallen", "Köhlen", "Schlaghügel", "Massenfels",
	"Beilen", "Ueblingen", "Dunkelkiefer", "Wulfhaven", "Schadelbruck", "Leihafen",
	"Broghur", "Hørup", "Skovby", "Burkal", "Stavern", "Alfhausen", "Dreizack",
	"Heiligdorf", "Manannsheim", "Nysted", "Luftberg", "Hüven", "Wilhelmskoog",
	"Ockholm", "Wittigholm", "Skjaldberg", "Varrel", "Seuchenshof", "Schuten",
	"Beelen", "Salzmorast", "Kriedeklippe", "Gelting", "Nordenwatch", "Forstfast",
	"Kronven", "Skogholm", "Voervinholm", "Tyrvad", "Zelebhorn", "Vesterrup",
	"Auld Troldved", "Castle Midfast", "Frote", "Dünsen", "Marklohe", "Dorfmark",
	"Zamek Midfast", "Stary Troldved",
]);

function tagAndTranslateRecord(rec, defaultGroup) {
	if (!rec) return;
	const isPl = game.i18n?.lang === "pl";
	if (isPl && SETTLEMENT_NAME_TRANSLATIONS[rec.name]) {
		rec.originalName = rec.name;
		rec.name = SETTLEMENT_NAME_TRANSLATIONS[rec.name];
	}
	if (!rec.group) {
		if (PBTT_SETTLEMENT_NAMES.has(rec.name) || PBTT_SETTLEMENT_NAMES.has(rec.originalName)) {
			rec.group = isPl ? "Szara Eminencja (Middenland)" : "Power Behind the Throne (Middenland)";
		} else if (UIA_SETTLEMENT_NAMES.has(rec.name) || UIA_SETTLEMENT_NAMES.has(rec.originalName)) {
			rec.group = isPl ? "Pod broń! (Tilea)" : "Up in Arms (Tilea)";
		} else if (SALZENMUND_SETTLEMENT_NAMES.has(rec.name) || SALZENMUND_SETTLEMENT_NAMES.has(rec.originalName)) {
			rec.group = isPl ? "Salzenmund (Nordland)" : "Salzenmund (Nordland)";
		} else {
			rec.group = defaultGroup || (isPl ? "Śmierć na rzece Reik (Reikland)" : "Death on the Reik (Reikland)");
		}
	}
}

function sanitizeTradeGazetteers() {
	const trade = game.wfrp4e?.trade;
	if (!trade) return;

	const isPl = game.i18n?.lang === "pl";
	const socCfg = GAZETTEER_SOURCE_CONFIG.find(c => c.id === "wfrp4e-soc");
	const dotrCfg = GAZETTEER_SOURCE_CONFIG.find(c => c.id === "wfrp4e-dotr");
	const pbttCfg = GAZETTEER_SOURCE_CONFIG.find(c => c.id === "wfrp4e-pbtt");
	const uiaCfg = GAZETTEER_SOURCE_CONFIG.find(c => c.id === "wfrp4e-up-in-arms");
	const salzCfg = GAZETTEER_SOURCE_CONFIG.find(c => c.id === "wfrp4e-salzenmund");
	const owbCfg = GAZETTEER_SOURCE_CONFIG.find(c => c.id === "wfrp4e-owb3");

	const socGroup = isPl ? "Morze Szponów (Porty morskie)" : "Sea of Claws (Sea ports)";
	const dotrGroup = isPl ? "Śmierć na rzece Reik (Reikland)" : "Death on the Reik (Reikland)";

	// 1. Obsługa handlu morskiego (Sea of Claws)
	if (!isModuleSourceAvailable(socCfg)) {
		trade.gazetteers.maritime = [];
		if (trade.tradeData?.maritime) {
			delete trade.tradeData.maritime.soc;
		}
	} else if (Array.isArray(trade.gazetteers?.maritime)) {
		for (const rec of trade.gazetteers.maritime) {
			tagAndTranslateRecord(rec, socGroup);
		}
	}

	// 2. Filtrowanie i podział osad handlu rzecznego
	if (Array.isArray(trade.gazetteers?.river)) {
		for (const rec of trade.gazetteers.river) {
			tagAndTranslateRecord(rec, dotrGroup);
		}

		trade.gazetteers.river = trade.gazetteers.river.filter(rec => {
			if (rec.group === "Śmierć na rzece Reik (Reikland)" || rec.group === "Death on the Reik (Reikland)") {
				return isModuleSourceAvailable(dotrCfg);
			}
			if (rec.group === "Szara Eminencja (Middenland)" || rec.group === "Power Behind the Throne (Middenland)") {
				return isModuleSourceAvailable(pbttCfg);
			}
			if (rec.group === "Pod broń! (Tilea)" || rec.group === "Up in Arms (Tilea)") {
				return isModuleSourceAvailable(uiaCfg);
			}
			if (rec.group === "Salzenmund (Nordland)") {
				return isModuleSourceAvailable(salzCfg);
			}
			if (rec.group === "Stary Świat" || rec.group === "The Old World") {
				return isModuleSourceAvailable(owbCfg);
			}
			return true;
		});
	}
}

function patchTradeManager() {
	const trade = game.wfrp4e?.trade;
	if (!trade || trade._wfrp4eCorePlPatched) return;

	if (game.i18n?.lang === "pl") {
		trade.seasons = {
			spring: game.i18n?.localize("TRADE.Spring") || "Wiosna",
			summer: game.i18n?.localize("TRADE.Summer") || "Lato",
			autumn: game.i18n?.localize("TRADE.Autumn") || "Jesień",
			winter: game.i18n?.localize("TRADE.Winter") || "Zima",
		};
	}

	const origAddGazzetteerFile = trade.addGazzetteerFile;
	trade.addGazzetteerFile = function(path, type) {
		const cfg = GAZETTEER_SOURCE_CONFIG.find(c => path.includes(c.fileMatch));
		if (cfg && !isModuleSourceAvailable(cfg)) {
			return;
		}

		fetch(path).then(r => r.json()).then(async records => {
			const isPl = game.i18n?.lang === "pl";
			const groupName = cfg ? (isPl ? cfg.group : (cfg.groupEn || cfg.group)) : (type === "maritime" ? (isPl ? "Morze Szponów (Porty morskie)" : "Sea of Claws (Sea ports)") : (isPl ? "Śmierć na rzece Reik (Reikland)" : "Death on the Reik (Reikland)"));
			for (const rec of records) {
				rec.group = groupName;
				if (isPl && SETTLEMENT_NAME_TRANSLATIONS[rec.name]) {
					rec.originalName = rec.name;
					rec.name = SETTLEMENT_NAME_TRANSLATIONS[rec.name];
				}
			}
			this.gazetteers[type] = this.gazetteers[type].concat(records);
		}).catch(err => {
			console.warn("wfrp4e-core-pl | Błąd wczytywania gazetteer:", err);
		});
	};

	const origGetTradeType = trade.getTradeType;
	trade.getTradeType = async function() {
		sanitizeTradeGazetteers();

		const buttons = [];
		const dotrCfg = GAZETTEER_SOURCE_CONFIG.find(c => c.id === "wfrp4e-dotr");
		if (this.tradeData?.river?.dotr && isModuleSourceAvailable(dotrCfg) && this.gazetteers?.river?.length) {
			buttons.push({
				action: "river",
				label: game.i18n.localize("TRADE.River") || "Rzeczny",
				callback: () => "river",
			});
		}
		const socCfg = GAZETTEER_SOURCE_CONFIG.find(c => c.id === "wfrp4e-soc");
		if (this.tradeData?.maritime?.soc && isModuleSourceAvailable(socCfg) && this.gazetteers?.maritime?.length) {
			buttons.push({
				action: "maritime",
				label: game.i18n.localize("TRADE.Maritime") || "Morski",
				callback: () => "maritime",
			});
		}

		if (buttons.length === 0) {
			ui.notifications.error(game.i18n.localize("TRADE.NoTradeData") || "Nie znaleziono danych handlowych.");
			return null;
		}
		if (buttons.length === 1) {
			return buttons[0].action;
		}

		return foundry.applications.api.DialogV2.wait({
			window: { title: game.i18n.localize("TRADE.Trade") || "Handel" },
			content: game.i18n.localize("TRADE.TradeType") || "Wybierz rodzaj handlu",
			buttons,
		});
	};

	const origAttemptBuy = trade.attemptBuy;
	trade.attemptBuy = async function() {
		sanitizeTradeGazetteers();
		return origAttemptBuy.apply(this, arguments);
	};

	const origAttemptSell = trade.attemptSell;
	trade.attemptSell = async function(cargo) {
		sanitizeTradeGazetteers();
		return origAttemptSell.apply(this, arguments);
	};

	trade._wfrp4eCorePlPatched = true;
}

const ENGLISH_CARGO_MAP = {
	"grain": "grain",
	"armaments": "armaments",
	"arms": "arms",
	"luxuries": "luxuries",
	"metal": "metal",
	"timber": "timber",
	"wine": "wine",
	"brandy": "brandy",
	"wool": "wool",
	"boatbuilding": "boatbuilding",
	"bricks": "bricks",
	"metalworking": "metalworking",
	"smuggling": "smuggling",
	"trade": "trade",
	"shipparts": "shipParts",
	"ship parts": "shipParts",
	"salt": "salt",
	"oil": "oil",
	"saltfish": "saltfish",
	"citrusfruit": "citrusFruit",
	"citrus fruit": "citrusFruit",
	"citrus": "citrusFruit",
	"olives": "olives",
	"stone": "stone",
};

function patchTradeDialog() {
	if (typeof TradeDialog === "undefined") return;
	if (TradeDialog.prototype._wfrp4eCorePlPatched) return;

	const origEncode = TradeDialog.prototype.encodeSurplusDemand;
	TradeDialog.prototype.encodeSurplusDemand = function(string) {
		if (!string) return [];
		const cargoTypes = game.wfrp4e?.trade?.tradeData?.[this.tradeType]?.cargoTypes || {};
		const strings = string.split(",").map(i => i.trim());
		const encoded = [];

		for (const str of strings) {
			const parts = str.split("+");
			if (parts.length < 2) continue;
			const value = parts[1].trim();
			let rawName = parts[0].trim();
			if (rawName.includes("(")) {
				rawName = rawName.split("(")[0].trim();
			}

			let key = warhammer?.utility?.findKey ? warhammer.utility.findKey(rawName, cargoTypes, { caseInsensitive: true }) : null;
			if (!key && cargoTypes[rawName.toLowerCase()]) {
				key = rawName.toLowerCase();
			}
			if (!key && ENGLISH_CARGO_MAP[rawName.toLowerCase()]) {
				key = ENGLISH_CARGO_MAP[rawName.toLowerCase()];
			}
			if (!key) {
				key = rawName.toLowerCase();
			}

			encoded.push(`${key} +${value}`);
		}
		return encoded;
	};

	TradeDialog.prototype._wfrp4eCorePlPatched = true;
}

Hooks.on("renderTradeDialog", (app, html) => {
	const root = html instanceof HTMLElement ? html : html?.[0] || app.element;
	if (!root || !Array.isArray(app.gazetteer)) return;

	const select = root.querySelector("[name='settlement']");
	if (!select) return;

	const isPl = game.i18n?.lang === "pl";
	const defaultGroup = isPl ? "Śmierć na rzece Reik (Reikland)" : "Death on the Reik (Reikland)";
	const groups = {};
	for (const rec of app.gazetteer) {
		const gName = rec.group || defaultGroup;
		groups[gName] ||= [];
		groups[gName].push(rec);
	}

	let newOptionsHtml = '<option value=""></option>';
	for (const [groupName, records] of Object.entries(groups)) {
		newOptionsHtml += `<optgroup label="${groupName}">`;
		for (const rec of records) {
			newOptionsHtml += `<option value="${rec.name}">${rec.name}</option>`;
		}
		newOptionsHtml += `</optgroup>`;
	}

	select.innerHTML = newOptionsHtml;

	select.addEventListener("change", ev => {
		const val = ev.target.value;
		if (!val) return;
		const rec = app.gazetteer.find(g => g.name === val || g.originalName === val);
		if (rec) {
			const wealth = root.querySelector("[name='wealth']");
			const size = root.querySelector("[name='size']");
			const produces = root.querySelector("[name='produces']");
			const surplus = root.querySelector("[name='surplus']");
			const demand = root.querySelector("[name='demand']");
			const trade = root.querySelector("[name='trade']");
			const name = root.querySelector("[name='name']");

			if (wealth) wealth.value = rec.w ?? "";
			if (size) size.value = rec.size ?? "";
			if (produces) produces.value = (rec.produces || []).map(i => app.formatCargoType(i) || i).join(", ");
			if (surplus && typeof app.formatSurplusDemand === "function") surplus.value = app.formatSurplusDemand(rec.surplus);
			if (demand && typeof app.formatSurplusDemand === "function") demand.value = app.formatSurplusDemand(rec.demand);
			if (trade) trade.checked = Boolean(rec.isTrade);
			if (name) name.value = rec.name;
		}
	});

	const submitBtn = root.querySelector("button[type='submit']");
	if (submitBtn && submitBtn.textContent.trim() === "Submit") {
		submitBtn.textContent = game.i18n?.localize("Submit") || "Zatwierdź";
	}
});

 
// Localize HR-generated lore effects without replacing their mechanics.
function localizeHornedRatGeneratedLabels() {
  if (globalThis.game?.system?.id !== "wfrp4e" || game.i18n?.lang !== "pl") return;
  const config = game.wfrp4e?.config;
  if (!config) return;
  const labels = {
    "Lore of Plague": "Tradycja Zarazy",
    "Lore of Stealth": "Tradycja Skrytości",
    "Lore of Ruin": "Tradycja Zniszczenia",
    "Apply Lore Effect": "Zastosuj efekt Tradycji",
    "Add Distracting": "Dodaj cechę Dekoncentrujący",
    "Add Stealthy": "Dodaj cechę Skryty",
    "Initiative or Agility based Tests": "Testy oparte na Inicjatywie lub Zwinności",
    "Lore effect added for ": "Efekt Tradycji dodany na ",
    " rounds.": " Rund."
  };
  for (const key of ["plague", "stealth", "ruin"]) {
    const effect = config.loreEffects?.[key];
    if (!effect) continue;
    if (labels[effect.name]) effect.name = labels[effect.name];
    for (const data of effect.system?.scriptData ?? []) {
      if (labels[data.label]) data.label = labels[data.label];
      if (data.trigger !== "rollCastTest" || typeof data.script !== "string") continue;
      // Exact quoted literals only. Status keys, nested scripts, UUIDs and dice stay intact.
      for (const [english, polish] of Object.entries(labels)) {
        data.script = data.script.split(JSON.stringify(english)).join(JSON.stringify(polish));
      }
    }
  }
}

Hooks.once("init", () => queueMicrotask(localizeHornedRatGeneratedLabels));
Hooks.once("i18nInit", localizeHornedRatGeneratedLabels);
Hooks.once("ready", () => queueMicrotask(localizeHornedRatGeneratedLabels));

// Localize randomize buttons (C S T -> C U T) and clean solitary movement units on actor sheets
function polishActorSheet(app, html) {
	if (game.i18n?.lang !== "pl") return;
	const root = html instanceof HTMLElement ? html : html?.[0] || app?.element;
	if (!root || typeof root.querySelectorAll !== "function") return;

	
	// Intercept randomize clicks to safely run without freeze
	root.querySelectorAll('a[data-action="randomize"]').forEach(btn => {
		if (btn._safeRandomizeAttached) return;
		btn._safeRandomizeAttached = true;
		btn.addEventListener("click", async (e) => {
			e.stopPropagation();
			e.preventDefault();
			const type = btn.dataset.type;
			const actor = app.actor || app.document;
			if (!actor) return;
			if (type === "skills") await safeAdvanceSpeciesSkills(actor);
			else if (type === "characteristics") await safeAdvanceSpeciesCharacteristics(actor);
			else if (type === "talents") await safeAdvanceSpeciesTalents(actor);
		}, { capture: true });
	});

	// Randomize buttons: C S T -> C U T
	const randomizeSkills = root.querySelector('a[data-action="randomize"][data-type="skills"]');
	if (randomizeSkills && randomizeSkills.textContent.trim() === "S") {
		randomizeSkills.textContent = game.i18n?.localize?.("SHEET.RandomizeSkillAbbr") || "U";
	}

	// Movement walk / run: clean solitary "yds" / "m" or convert lingering "yds" to "m"
	const moveInputs = root.querySelectorAll('input[name="system.details.move.walk"], input[name="system.details.move.run"], .movement input, .movement-box input');
	moveInputs.forEach(input => {
		if (input.readOnly) {
			const val = input.value.trim();
			if (val === "yds" || val === "m" || val === "NaN yds" || val === "NaN m" || val === "undefined yds" || val === "undefined m") {
				input.value = "";
			} else if (/\byds\b/.test(val)) {
				input.value = val.replace(/\byds\b/g, "m");
			}
		}
	});
}

Hooks.on("renderActorSheet", (app, html) => polishActorSheet(app, html));
Hooks.on("renderApplicationV2", (app, html) => polishActorSheet(app, html));

// Polish translations and DOM cleanup for settings dialogs
function polishSettingsWindows(app, html) {
	if (game.i18n?.lang !== "pl") return;
	const root = html instanceof HTMLElement ? html : html?.[0] || app?.element;
	if (!root || typeof root.querySelectorAll !== "function") return;

	// 1. Homebrew settings: window title and unescaping &lt;br&gt; in notes/hints
	if (app?.constructor?.name === "HomebrewConfig" || root.classList?.contains("homebrew-config")) {
		const titleEl = app.element?.querySelector?.(".window-title") || root.closest?.(".window-app")?.querySelector?.(".window-title");
		if (titleEl && (titleEl.textContent.trim() === "Homebrew Settings Configuration" || titleEl.textContent.trim() === "SETTINGS.Menu.HouseRules")) {
			titleEl.textContent = game.i18n?.localize?.("SETTINGS.Menu.HouseRules") || "Zasady domowe";
		}
		root.querySelectorAll(".hint, .notes").forEach(el => {
			if (el.innerHTML.includes("&lt;br&gt;")) {
				el.innerHTML = el.innerHTML.replace(/&lt;br&gt;/g, "<br>");
			}
		});
	}

	// 2. Table settings: window title and Grimoire Miscast label
	if (app?.constructor?.name === "TableSettings" || root.classList?.contains("table-settings")) {
		const titleEl = app.element?.querySelector?.(".window-title") || root.closest?.(".window-app")?.querySelector?.(".window-title");
		if (titleEl && (titleEl.textContent.trim() === "Table Settings Configuration" || titleEl.textContent.trim() === "SETTINGS.Menu.TableSettings")) {
			titleEl.textContent = game.i18n?.localize?.("SETTINGS.Menu.TableSettings") || "Ustawienia tabel";
		}
		root.querySelectorAll("label").forEach(lbl => {
			if (lbl.textContent.trim() === "Grimoire Miscast" || lbl.textContent.trim() === "SETTINGS.TABLE_grimoire-miscast") {
				lbl.textContent = game.i18n?.localize?.("SETTINGS.TABLE_grimoire-miscast") || "Manifestacja Ksiąg Zaklęć";
			}
		});
	}

	// 3. Main settings list: Theme Configuration submenu
	if (app?.constructor?.name === "SettingsConfig" || root.querySelector?.('[data-category="wfrp4e"]')) {
		root.querySelectorAll(".form-group.submenu, .settings-list .setting").forEach(row => {
			const label = row.querySelector("label");
			const button = row.querySelector("button");
			const notes = row.querySelector(".notes, .hint");
			if (label && (label.textContent.trim() === "Theme Configuration" || label.textContent.trim() === "WH.Theme.Config")) {
				label.textContent = game.i18n?.localize?.("WH.Theme.Config") || "Konfiguracja motywu";
			}
			if (button && (button.textContent.trim() === "Configure Theme" || button.textContent.trim() === "WH.Theme.ConfigButton")) {
				button.innerHTML = '<i class="fa-solid fa-table-layout"></i> ' + (game.i18n?.localize?.("WH.Theme.ConfigButton") || "Konfiguruj motyw");
			}
			if (notes && (notes.textContent.trim() === "Enable or disable the styling provided by the system." || notes.textContent.trim() === "WH.Theme.ConfigHint")) {
				notes.textContent = game.i18n?.localize?.("WH.Theme.ConfigHint") || "Włącz lub wyłącz stylizację dostarczaną przez system.";
			}
		});
	}

	// 4. WFRP4eThemeConfig: window title and footer buttons
	if (app?.constructor?.name === "WFRP4eThemeConfig" || root.id === "theme-config") {
		const titleEl = app.element?.querySelector?.(".window-title") || root.closest?.(".window-app")?.querySelector?.(".window-title");
		if (titleEl && (titleEl.textContent.trim() === "Theme Configuration" || titleEl.textContent.trim() === "WH.Theme.Config")) {
			titleEl.textContent = game.i18n?.localize?.("WH.Theme.Config") || "Konfiguracja motywu";
		}
		root.querySelectorAll("button").forEach(btn => {
			const t = btn.textContent.trim();
			if (t === "Reset") btn.textContent = game.i18n?.localize?.("Reset") || "Zresetuj";
			if (t === "Save Changes") btn.textContent = game.i18n?.localize?.("Save Changes") || "Zapisz zmiany";
		});
	}
}

Hooks.on("renderApplication", (app, html) => polishSettingsWindows(app, html));
Hooks.on("renderApplicationV2", (app, html) => polishSettingsWindows(app, html));
Hooks.on("renderSettingsConfig", (app, html) => polishSettingsWindows(app, html));

Hooks.once("init", () => installSafeRandomizer());
Hooks.once("ready", () => installSafeRandomizer());
