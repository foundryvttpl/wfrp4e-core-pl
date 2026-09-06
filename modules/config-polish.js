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
