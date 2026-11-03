// Polish texts for UI strings that the wfrp4e system (10.x) and warhammer-lib
// hardcode in English instead of using localization keys:
// - Handlebars templates: the compiled template cached in Handlebars.partials is
//   replaced by one compiled from the same source with the literals swapped for
//   {{localize}} calls. Each literal must match exactly; a missing one is logged so a
//   changed upstream template is noticed instead of silently left untranslated.
// - Notifications, dialog contents, ValueDialog prompts and chat message flavors.
// Window titles, context menu entries and header controls are localized by Foundry
// itself, so those only need plain English keys in lang/pl.json.

const PATCH_MARK = Symbol.for("wfrp4e-core-pl.systemUiLocalization");
const L = key => `{{localize "WFRP4E.PL.UI.${key}"}}`;

function isPolishWfrp() {
	return globalThis.game?.system?.id === "wfrp4e" && game.i18n?.lang === "pl";
}

const TEMPLATE_PATCHES = {
	"systems/wfrp4e/templates/apps/theme-config.hbs": [
		["<legend>Actor Sheet</legend>", `<legend>${L("ThemeActorSheet")}</legend>`],
		["<legend>Item Sheet</legend>", `<legend>${L("ThemeItemSheet")}</legend>`],
		["<legend>Journal Sheet</legend>", `<legend>${L("ThemeJournalSheet")}</legend>`],
		["<strong>Note</strong>: Light theme takes precedence over the settings below. If the themes below are enabled, dark theme must be used. See <strong>Configure Interface</strong> in the Core settings.", `{{{localize "WFRP4E.PL.UI.ThemeNote"}}}`],
		["<legend>Sidebar</legend>", `<legend>${L("ThemeSidebar")}</legend>`],
		["<legend>Applications</legend>", `<legend>${L("ThemeApplications")}</legend>`],
	],
	"systems/wfrp4e/templates/apps/token-hud.hbs": [
		['title="Toggle Visibility"', `title="${L("HudToggleVisibility")}"`],
		['title="Assign Status Effects"', `title="${L("HudAssignStatusEffects")}"`],
		['title="Toggle Combat State"', `title="${L("HudToggleCombat")}"`],
	],
	"systems/wfrp4e/templates/sheets/item/types/careerPath.hbs": [
		["</i> Add Tier</button>", `</i> ${L("AddTier")}</button>`],
	],
	"systems/wfrp4e/templates/embeds/career.hbs": [
		["<strong>Species:</strong>", `<strong>${L("SpeciesLabel")}</strong>`],
		["<strong>Class:</strong>", `<strong>${L("ClassLabel")}</strong>`],
		["{{item.system.careergroup.value}} Advance Scheme", `${L("AdvanceScheme")}: {{item.system.careergroup.value}}`],
	],
	"systems/wfrp4e/templates/partials/endeavour.hbs": [
		["<legend>Endeavour</legend>", `<legend>${L("Endeavour")}</legend>`],
		[">Configure Script<i", `>${L("ConfigureScript")} <i`],
		["Effect: <strong>", `${L("EffectLabel")} <strong>`],
		["Drag and drop an Active Effect. This will be applied to an Actor performing the Endeavour.", L("EndeavourEffectDrop")],
	],
	"systems/wfrp4e/templates/sheets/actor/character/character-main.hbs": [
		['<div class="flex large">Advancement</div>', `<div class="flex large">${L("Advancement")}</div>`, "all"],
		['data-tooltip="Advance to the next Tier"', `data-tooltip="${L("AdvanceTier")}"`],
		["Add a <strong>Career Path</strong> Item.", `{{{localize "WFRP4E.PL.UI.AddCareerPath"}}}`],
		['<div class="list-name">Previous Careers</div>', `<div class="list-name">${L("PreviousCareers")}</div>`],
	],
	"systems/wfrp4e/templates/sheets/actor/npc/npc-careers.hbs": [
		['data-tooltip="Receive Income"', `data-tooltip="${L("ReceiveIncome")}"`],
	],
	"systems/wfrp4e/templates/sheets/actor/tabs/actor-combat.hbs": [
		['data-tooltip="Drag and drop a world Actor to act as a Mount."', `data-tooltip="${L("MountDrop")}"`],
	],
	"systems/wfrp4e/templates/sheets/actor/vehicle/vehicle-main.hbs": [
		["Roles ({{items.vehicleRole.length}})", `${L("Roles")} ({{items.vehicleRole.length}})`],
	],
	"systems/wfrp4e/templates/apps/vehicle-crew.hbs": [
		['<button data-action="addRole">Add Role</button>', `<button data-action="addRole">${L("AddRole")}</button>`],
	],
	"systems/wfrp4e/templates/chat/market/market-credit.hbs": [
		["Received by {{this}}", `${L("ReceivedBy")} {{this}}`],
	],
	"systems/wfrp4e/templates/chat/post-item.hbs": [
		["<strong>Retrieved By: </strong>", `<strong>${L("RetrievedBy")} </strong>`],
	],
	"systems/wfrp4e/templates/chat/roll/5e/cast-test.hbs": [
		["<strong>Dispelled!</strong>", `<strong>${L("Dispelled")}</strong>`],
	],
	"systems/wfrp4e/templates/chat/roll/spell-card.hbs": [
		["<strong>Dispelled!</strong>", `<strong>${L("Dispelled")}</strong>`],
	],
	"systems/wfrp4e/templates/apps/trade/trade-cargo.hbs": [
		["}} Enc. - {{", `}} {{localize "SHEET.EncAbbrev"}} - {{`],
	],
	"systems/wfrp4e/templates/apps/trade/trade-dialog.hbs": [
		["}} Enc. - {{", `}} {{localize "SHEET.EncAbbrev"}} - {{`],
	],
	"systems/wfrp4e/templates/sheets/item/types/template.hbs": [
		['data-tooltip="Providing a group number will give the option to choose between any other Item with the same group number."', `data-tooltip="${L("GroupNumberHint")}"`],
	],
	"modules/warhammer-lib/templates/apps/reporter/report.hbs": [
		['placeholder="Concise description of issue/bug/request"', `placeholder="${L("ReportTitlePlaceholder")}"`],
		['<option value="bug">Bug</option>', `<option value="bug">${L("ReportBug")}</option>`],
		['<option value="data">Data or Text</option>', `<option value="data">${L("ReportData")}</option>`],
		['<option value="script">Effect Script</option>', `<option value="script">${L("ReportScript")}</option>`],
		['<option value="enhancement">Feature Request</option>', `<option value="enhancement">${L("ReportEnhancement")}</option>`],
		['placeholder="Discord or Email"', `placeholder="${L("ReportContactPlaceholder")}"`],
		['data-tooltip="Optionally add your Personal Access Token for your GitHub Account, creating the issue as that account."', `data-tooltip="${L("ReportPATHint")}"`],
		['<p class="centered">Has your issue already been submitted?</p>', `<p class="centered">${L("ReportAlreadySubmitted")}</p>`],
		['placeholder="What happened, how to reproduce, etc."', `placeholder="${L("ReportDescriptionPlaceholder")}"`],
	],
	"modules/warhammer-lib/templates/effect/effect-shape-config.hbs": [
		['label="Color"', `label=(localize "WFRP4E.PL.UI.ShapeColor")`],
		["<label>Type</label>", `<label>${L("ShapeType")}</label>`],
		["<label>Radius</label>", `<label>${L("ShapeRadius")}</label>`],
		['placeholder="Inherit"', `placeholder="${L("Inherit")}"`],
		['label="Base Width"', `label=(localize "WFRP4E.PL.UI.ShapeBaseWidth")`],
		['label="Base Height"', `label=(localize "WFRP4E.PL.UI.ShapeBaseHeight")`],
		['label="Hole"', `label=(localize "WFRP4E.PL.UI.ShapeHole")`],
		['label="Curvature"', `label=(localize "WFRP4E.PL.UI.ShapeCurvature")`],
		['label="Angle"', `label=(localize "WFRP4E.PL.UI.ShapeAngle")`],
		['label="Width (X)"', `label=(localize "WFRP4E.PL.UI.ShapeWidth")`, "all"],
		['label="Height (Y)"', `label=(localize "WFRP4E.PL.UI.ShapeHeight")`],
		['label="Length (Y)"', `label=(localize "WFRP4E.PL.UI.ShapeLength")`],
		["<p>Shape options not available for Aura effects</p>", `<p>${L("ShapeAuraUnavailable")}</p>`],
	],
	"modules/warhammer-lib/templates/effect/effect-advanced-config.hbs": [
		['placeholder="Inherit"', `placeholder="${L("Inherit")}"`],
	],
	"modules/warhammer-lib/templates/apps/choice-config.hbs": [
		["<p>This script runs after choices have been made, allowing them to be altered.</p>", `<p>${L("ChoiceScriptHint")}</p>`],
	],
};

async function fetchTemplateSource(path) {
	const response = await fetch(foundry.utils.getRoute(path), {cache: "no-cache"});
	if (!response.ok) throw new Error(`HTTP ${response.status}`);
	return response.text();
}

async function localizeTemplate(path, patches) {
	// Wait for the system's own preload so it cannot overwrite the localized copy.
	await foundry.applications.handlebars.getTemplate(path);
	let source = await fetchTemplateSource(path);
	const missing = [];
	for (const [find, replace, mode] of patches) {
		if (!source.includes(find)) {
			missing.push(find);
			continue;
		}
		source = mode === "all" ? source.replaceAll(find, replace) : source.replace(find, replace);
	}
	if (missing.length) {
		console.warn(`wfrp4e-core-pl | ${path}: template text changed upstream, not translated:`, missing);
	}
	Handlebars.registerPartial(path, Handlebars.compile(source, {preventIndent: true}));
}

async function localizeTemplates() {
	const results = await Promise.allSettled(Object.entries(TEMPLATE_PATCHES).map(([path, patches]) => localizeTemplate(path, patches)));
	results.forEach((result, index) => {
		if (result.status === "rejected") {
			console.warn(`wfrp4e-core-pl | Could not localize ${Object.keys(TEMPLATE_PATCHES)[index]}`, result.reason);
		}
	});
}

const NOTIFICATIONS_EXACT = {
	"Endeavour Test, Script, or Active Effect has not been defined.": "EndeavourNotDefined",
	"Must select a tier": "MustSelectTier",
	"No Trade Data found, see console for details": "NoTradeData",
	"No content found": "NoContentFound",
	"Not enough Advantage!": "NotEnoughAdvantage",
	"Not enough SL!": "NotEnoughSL",
	"Please assign a character.": "AssignCharacter",
	"This cargo does not have a Cargo Type defined": "CargoTypeMissing",
	"Copied skills to clipboard": "SkillsCopied",
	"Multi-Lore Spell: Lowest channelling skill not found, using Willpower": "MultiLoreWillpower",
	"Non-rollable trait": "NonRollableTrait",
	"Changes cannot be made to this Active Effect while within an Endeavour!": "EndeavourEffectLocked",
	"No Actor assigned, select from Owned Actors": "NoActorAssigned",
	"No character assigned or Token selected": "NoCharacterOrToken",
	"Loop formed - Resetting Container Location": "ContainerLoop",
	"The configured Species table is from an older version and may not be compatible with character creation in V13. To ensure it works correctly, please delete and reimport the table from the compendium.": "OldSpeciesTable",
};

// [pattern, key, named groups → format data]
const NOTIFICATIONS_PATTERNS = [
	[/^Tier (?<tier>\d+) not found on the Career Path!$/, "TierNotFound"],
	[/^(?<name>.+) already received this reward\.$/, "RewardAlreadyReceived"],
	[/^(?<name>.+) broken!$/, "ItemBroken"],
	[/^Advancing (?<career>.+) Characteristics, Skills, and Talents\.\.\.$/, "AdvancingCareer"],
	[/^Could not find (?<name>.+) spell\. Try Again$/, "SpellNotFound"],
	[/^Could not find (?<name>.+)$/, "NotFound"],
	[/^Multi-Lore Spell: Using lowest Channelling Skill \((?<skill>.+)\)$/, "MultiLoreSkill"],
	[/^<(?<tag>b|strong)>(?<effect>.+)<\/\k<tag>>: Gained (?<value>\S+) Advantage$/, "GainedAdvantage"],
	[/^<strong>(?<effect>.+)<\/strong>: Cannot be surprised$/, "CannotBeSurprised"],
	[/^Applying WFRP4e System Migration for version (?<version>\S+)\. Please be patient and do not close your game or shut down your server\.$/, "MigrationStart"],
	[/^wfrp4e System Migration to version (?<version>\S+) completed!$/, "MigrationDone"],
];

export function localizeNotificationText(message) {
	if (typeof message !== "string" || !isPolishWfrp()) return message;
	const exact = NOTIFICATIONS_EXACT[message];
	if (exact) return game.i18n.localize(`WFRP4E.PL.UI.Notify.${exact}`);
	for (const [pattern, key] of NOTIFICATIONS_PATTERNS) {
		const match = pattern.exec(message);
		if (match) return game.i18n.format(`WFRP4E.PL.UI.Notify.${key}`, match.groups ?? {});
	}
	return message;
}

function installNotificationLocalization() {
	const notifications = globalThis.ui?.notifications;
	if (!notifications || notifications[PATCH_MARK]) return false;
	for (const method of ["info", "warn", "error", "notify"]) {
		const original = notifications[method];
		if (typeof original !== "function") continue;
		notifications[method] = function(message, ...args) {
			return original.call(this, localizeNotificationText(message), ...args);
		};
	}
	Object.defineProperty(notifications, PATCH_MARK, {value: true});
	return true;
}

const DIALOG_CONTENT_EXACT = {
	"Not enough Advancements to advance in this Career. Continue anyway?": "IncompleteCareerContent",
	"Choose Location": "ChooseLocation",
};
const REMOVE_ADVANCEMENT = /^<p>Remove Advancement: "(?<label>[\s\S]*)"\?<\/p><p> <strong>Note<\/strong>: This will not undo the advancement itself, only its association with the career\.$/;

function localizeDialogContent(content) {
	if (typeof content !== "string" || !isPolishWfrp()) return content;
	const exact = DIALOG_CONTENT_EXACT[content];
	if (exact) return game.i18n.localize(`WFRP4E.PL.UI.${exact}`);
	const removal = REMOVE_ADVANCEMENT.exec(content);
	if (removal) return game.i18n.format("WFRP4E.PL.UI.RemoveAdvancementContent", removal.groups);
	return content;
}

function installDialogLocalization() {
	const DialogV2 = foundry.applications.api.DialogV2;
	if (!DialogV2 || Object.hasOwn(DialogV2, PATCH_MARK)) return;
	// confirm() and prompt() both go through wait().
	const originalWait = DialogV2.wait;
	DialogV2.wait = function(config = {}, ...args) {
		if (typeof config?.content === "string") config = {...config, content: localizeDialogContent(config.content)};
		return originalWait.call(this, config, ...args);
	};
	Object.defineProperty(DialogV2, PATCH_MARK, {value: true});
}

const VALUE_DIALOG_TEXT = {
	"Enter Advancement Label": "EnterAdvancementLabel",
	"Enter XP Spent on Career change": "EnterXPCareerChange",
	"Enter XP Spent on Career Advancement": "EnterXPCareerAdvance",
};

function installValueDialogText() {
	const ValueDialog = globalThis.warhammer?.apps?.ValueDialog;
	if (!ValueDialog || Object.hasOwn(ValueDialog, PATCH_MARK)) return false;
	const originalCreate = ValueDialog.create;
	ValueDialog.create = function(input, ...args) {
		const key = isPolishWfrp() && VALUE_DIALOG_TEXT[input?.text];
		if (key) input = {...input, text: game.i18n.localize(`WFRP4E.PL.UI.${key}`)};
		return originalCreate.call(this, input, ...args);
	};
	Object.defineProperty(ValueDialog, PATCH_MARK, {value: true});
	return true;
}

const CHAT_FLAVORS = {
	"Group Advantage Action": "FlavorGroupAdvantage",
	"Channelled Power Lost": "FlavorChannellingLost",
};

Hooks.on("renderChatMessageHTML", (_message, html) => {
	if (!isPolishWfrp()) return;
	const root = html?.querySelectorAll ? html : html?.[0];
	for (const link of root?.querySelectorAll?.('a[data-action="applyCriticalDeflection"]') ?? []) {
		if (link.textContent.trim() === "Critical Mitigation: Damage AP") {
			link.textContent = game.i18n.localize("WFRP4E.PL.UI.CriticalMitigationDamageArmour");
		}
	}
});

Hooks.on("preCreateChatMessage", message => {
	const key = isPolishWfrp() && CHAT_FLAVORS[message.flavor];
	if (key) message.updateSource({flavor: game.i18n.localize(`WFRP4E.PL.UI.${key}`)});
});

Hooks.once("init", () => queueMicrotask(() => {
	installValueDialogText();
	installDialogLocalization();
}));
Hooks.once("setup", installNotificationLocalization);
Hooks.once("ready", () => {
	installNotificationLocalization();
	installValueDialogText();
	installDialogLocalization();
	if (isPolishWfrp()) localizeTemplates();
});
