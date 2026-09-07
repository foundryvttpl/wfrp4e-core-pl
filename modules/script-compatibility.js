const MODULE_ID = "wfrp4e-core-pl";
const BACKTICK = String.fromCharCode(96);
const DOLLAR_BRACE = "$" + "{";
const PATCH_MARK = Symbol.for(MODULE_ID + ".scriptCompatibility");
const TOKEN_PREFIX = "__WFRP4E_CORE_PL_PROTECTED_";

const originalToLocalized = new Map();
const localizedToOriginal = new Map();
const scriptOriginalToLocalized = new Map();
const scriptLocalizedToOriginal = new Map();
const equivalenceCache = new Map();
const effectiveScriptCache = new Map();

const SOURCE_PATCHES = {
	A1odAcuRbq9797ZB: {
		hash: "f382f9ad",
		postTransplant: true,
		replacements: [["Could not find ${talent}", "Could not find ${c.name}"]],
	},
	AdawSWiB45Vu40rQ: {
		hash: "675feda0",
		postTransplant: true,
		replacements: [[
			"color = Object.values(colors)[Math.ceil(CONFIG.Dice.randomUniform() * 10)];",
			"const values = Object.values(colors);\n    color = values[Math.floor(CONFIG.Dice.randomUniform() * values.length)];",
		]],
	},
	BtyFhdGMKiMamGhM: {
		hash: "457e6334",
		postTransplant: true,
		replacements: [["test.succeded", "test.succeeded"]],
	},
	bNhpJPWwoHLq68zD: {
		hash: "26d4166c",
		postTransplant: true,
		replacements: [
			["foundry.applications.api.Dialog.confirm(", "foundry.applications.api.DialogV2.confirm("],
			["      return;", "      return true;"],
			["if (this.actor.itemTags.skill.find", "if (actor.itemTags.skill.find"],
			["await this.actor.setupSkill", "await actor.setupSkill"],
			["if (this.actor.itemTags.skill.find", "if (actor.itemTags.skill.find"],
			["await this.actor.setupSkill", "await actor.setupSkill"],
			["await this.actor.setupSkill", "await actor.setupSkill"],
		],
	},
	FAB12eLcSCAOOQwk: {
		hash: "48b2731b",
		replacements: [[
			"this.script.scirptMessage(await this.actor.applyBasicDamage(20, {suppressMsg: true}));",
			"this.script.scriptMessage(await this.actor.applyBasicDamage(20, {suppressMsg: true}));",
		]],
	},
	fLg90csmdOOKmEE6: {
		hash: "3502b4b9",
		replacements: [
			["\nlet item = await fromUuid(\"Compendium.wfrp4e-core.items.Item.Bvd2aZ0gQUXHfCTh\")", "\nlet item2 = await fromUuid(\"Compendium.wfrp4e-core.items.Item.Bvd2aZ0gQUXHfCTh\")"],
			["\nlet data = item.toObject();\ndata.system.specification.value = 8\nthis.actor.createEmbeddedDocuments(\"Item\", [data], {fromEffect : this.effect.id})", "\nlet data2 = item2.toObject();\ndata2.system.specification.value = 8\nthis.actor.createEmbeddedDocuments(\"Item\", [data2], {fromEffect : this.effect.id})"],
		],
	},
	Fu8DTvSgLufcB5mr: {
		hash: "0b7a3522",
		postTransplant: true,
		replacements: [[
			"const result = warhammer.apps.ValueDialog.create({",
			"const result = await warhammer.apps.ValueDialog.create({",
		]],
	},
	GOq4TcnWbfyfCo2V: {
		hash: "1165ea0c",
		postTransplant: true,
		replacements: [["this.actor.addConditon(\"unconscious\")", "this.actor.addCondition(\"unconscious\")"]],
	},
	HiDcm1jhG3sU39ME: {
		hash: "00467586",
		postTransplant: true,
		replacements: [[
			"color = Object.values(colors)[Math.ceil(CONFIG.Dice.randomUniform() * 10)];",
			"const values = Object.values(colors);\n    color = values[Math.floor(CONFIG.Dice.randomUniform() * values.length)];",
		]],
	},
	"5rlneScoI5feQ3Di": {
		hash: "7a2f168d",
		replacements: [[
			"const traits = this.actor.itemTypes.trait.filter(t => [\"bestial\", \"skittish\"].includes(s.name.toLowerCase()));\ntrait.system.disabled = true;",
			"const traits = this.actor.itemTypes.trait.filter(t => game.wfrp4eCorePl.names.oneOf(t, [\"bestial\", \"skittish\"], {caseInsensitive: true}));\nfor (const trait of traits) trait.system.disabled = true;",
		]],
	},
	J0IWUhxada2ONowP: {
		hash: "9785fc23",
		replacements: [[
			"args.skill?.name.includes(game.i18n.localize(\"SPEC.Eltharin\") || args.skill?.name.includes(game.i18n.localize(\"SPEC.Cathayan\")))",
			"args.skill?.name.includes(game.i18n.localize(\"SPEC.Eltharin\")) || args.skill?.name.includes(game.i18n.localize(\"SPEC.Cathayan\"))",
		]],
	},
	JToUa1mDQ2h3ILKF: {
		hash: "a23dd714",
		postTransplant: true,
		replacements: [["const test = await actor.setupSkill", "const test = await this.actor.setupSkill"]],
	},
	Me1wS5XdqUEy7OGt: {
		hash: "bdc10877",
		replacements: [
			["let critTable = " + BACKTICK + "crit" + DOLLAR_BRACE + "this.generalizeTable(loc)" + BACKTICK + ";", "let critTable = " + BACKTICK + "crit" + DOLLAR_BRACE + "this.generalizeTable(loc)}" + BACKTICK + ";"],
			["this.generalizeTable(loc)", "game.wfrp4e.tables.generalizeTable(loc)"],
			["this.script.message(" + BACKTICK + "{this.actor.name} suffers", "this.script.message(" + BACKTICK + DOLLAR_BRACE + "this.actor.name} suffers"],
		],
	},
	nGTxNWBUBgTr87wU: {
		hash: "cc423286",
		replacements: [[
			"this.script.message(" + BACKTICK + "Becomes lodged in the armour or flesh of the opponent. See @UUID[" + DOLLAR_BRACE + "this.item.uuid}]{" + DOLLAR_BRACE + "this.item.name}}." + BACKTICK + ", speaker : {alias : this.item.name}, {blind: true, whisper : ChatMessage.getWhisperRecipients(\"GM\")})",
			"this.script.message(" + BACKTICK + "Becomes lodged in the armour or flesh of the opponent. See @UUID[" + DOLLAR_BRACE + "this.item.uuid}]{" + DOLLAR_BRACE + "this.item.name}}." + BACKTICK + ", {speaker: {alias: this.item.name}, blind: true, whisper: ChatMessage.getWhisperRecipients(\"GM\")})",
		]],
	},
	Np25JqEiaoqerEk8: {
		hash: "e2cd8a1b",
		postTransplant: true,
		replacements: [
			["if (test.result.tables.miscast)", "if (args.test.result.tables.miscast)"],
			["  test.result.other.push", "  args.test.result.other.push"],
		],
	},
	PjOi61gB2nSYooLs: {
		hash: "2629b10b",
		postTransplant: true,
		replacements: [["this.sourceActor.uuid", "this.effect.sourceActor.uuid"]],
	},
	QfTBRGXVfwQSghmd: {
		hash: "768f9521",
		postTransplant: true,
		replacements: [[
			"if (actor.items.find(it => it.name == game.i18n.localize(\"Bestial\"))) {",
			"if (this.actor.has(\"Bestial\")) {",
		]],
	},
	QLE6dDm6Bns2J5Tl: {
		hash: "b4fa9df8",
		postTransplant: true,
		replacements: [[
			"if (property && !this.item.system.qualities.value.find(i => i.name == property));\n{",
			"if (property && !this.item.system.qualities.value.find(i => i.name == property))\n{",
		]],
	},
	TCtXPvDpbfz1yrVZ: {
		hash: "8e85aa45",
		postTransplant: true,
		replacements: [["Could not find ${talent}", "Could not find ${c.name}"]],
	},
	UQtXuQmUlTyDKqhe: {
		hash: "f6b713f4",
		postTransplant: true,
		replacements: [
			["new ItemWfrp4e({ name: item.name", "new ItemWFRP4e({ name: item.name"],
			["new ItemWfrp4e({ img: \"systems/wfrp4e/icons/blank.png\", name: item.name, type: item.type, system:", "new ItemWFRP4e({ img: \"systems/wfrp4e/icons/blank.png\", name: item.name, type: item.type, system:"],
			["new ItemWfrp4e({ img: \"systems/wfrp4e/icons/blank.png\", name: item.name, type: item.type  })", "new ItemWFRP4e({ img: \"systems/wfrp4e/icons/blank.png\", name: item.name, type: item.type  })"],
		],
	},
	pvTcazVvW4v04otW: {
		hash: "501fc2cb",
		replacements: [["await 0rgs.actor.addCondition", "await args.actor.addCondition"]],
	},
	UlygtNPSDlWPIFCI: {
		hash: "3c7f845a",
		// This ID is an activateScript predicate. The actual +1 SL is applied
		// by wAETU6aTRr9d4oCU; the predicate must return a boolean.
		replacements: [[",args.fields.slBonus++;,args.fields.slBonus++;,args.fields.slBonus++;", "return true;"]],
	},
	VcE8Hie2jbpuyuM3: {
		hash: "10652253",
		replacements: [["label:  'Spell Rules Reminder'\n  trigger:", "label:  'Spell Rules Reminder',\n  trigger:"]],
	},
	"16c0m6PsDXWh86uN": {
		hash: "63c7dfb8",
		postTransplant: true,
		replacements: [[
			"if (property && !this.item.system.flaws.value.find(i => i.name == property));\n{",
			"if (property && !this.item.system.flaws.value.find(i => i.name == property))\n{",
		]],
	},
	dLlcg8m8eiaVBmTg: {
		hash: "e616db0f",
		postTransplant: true,
		replacements: [[
			"color = Object.values(colors)[Math.ceil(CONFIG.Dice.randomUniform() * 10)];",
			"const values = Object.values(colors);\n    color = values[Math.floor(CONFIG.Dice.randomUniform() * values.length)];",
		]],
	},
	ePPgxQOqL1Uhz2k9: {
		hash: "a5c8db28",
		postTransplant: true,
		replacements: [["Could not find ${talent}", "Could not find ${c.name}"]],
	},
	hL3JUSY3xMA4zj2Q: {
		hash: "0281f4c7",
		postTransplant: true,
		replacements: [
			["this.sourceActor.uuid", "this.effect.sourceActor.uuid"],
			["if (test.failure)", "if (test.failed)"],
		],
	},
	hluehsCuBZYc1Ejt: {
		hash: "e1571ec4",
		postTransplant: true,
		replacements: [["args.characterisic", "args.characteristic"]],
	},
	hpwJRAhCsXTp9bd9: {
		hash: "0f6a6c13",
		postTransplant: true,
		replacements: [["Could not find ${talent}", "Could not find ${c.name}"]],
	},
	iM6JLF8jDXMViReZ: {
		hash: "48cdc6a4",
		postTransplant: true,
		replacements: [
			["game.i18n.localize(\"Name.PickLock\")", "game.i18n.localize(\"NAME.PickLock\")"],
			["${game.i18n.localize(\"NAME.Channelling\") (Ulgu)}", "${game.i18n.localize(\"NAME.Channelling\")} (Ulgu)"],
		],
	},
	vvVhAqreedtmOR9b: {
		hash: "707f4adb",
		replacements: [["args.modifiers.other.push({label : this.effect.name, value : -1)", "args.modifiers.other.push({label : this.effect.name, value : -1})"]],
	},
	r9N0cd9sp6iVG0es: {
		hash: "e4b12233",
		postTransplant: true,
		replacements: [[
			"gods[Math.ceil(CONFIG.Dice.randomUniform() * 4)]",
			"gods[Math.floor(CONFIG.Dice.randomUniform() * gods.length)]",
		]],
	},
	svCqdytEOtqFXCcs: {
		hash: "53fd519d",
		postTransplant: true,
		replacements: [
			["new ItemWfrp4e({ name: item.name", "new ItemWFRP4e({ name: item.name"],
			["new ItemWfrp4e({ img: \"systems/wfrp4e/icons/blank.png\", name: item.name, type: item.type, system:", "new ItemWFRP4e({ img: \"systems/wfrp4e/icons/blank.png\", name: item.name, type: item.type, system:"],
			["new ItemWfrp4e({ img: \"systems/wfrp4e/icons/blank.png\", name: item.name, type: item.type  })", "new ItemWFRP4e({ img: \"systems/wfrp4e/icons/blank.png\", name: item.name, type: item.type  })"],
		],
	},
	v5xrDWcrTNFJkyQB: {
		hash: "1512d764",
		postTransplant: true,
		replacements: [["Could not find ${talent}", "Could not find ${c.name}"]],
	},
	zF1IKmobCB8ea58M: {
		hash: "9bfa5fef",
		postTransplant: true,
		replacements: [["this.sourceActor.uuid", "this.effect.sourceActor.uuid"]],
	},
};

const PRESERVED_CONTROL_VALUES = {
	DmbWR9s5I8LHBwxB: new Set(["Undivided"]),
	ULmZMLezDamerN04: new Set(["Arcane"]),
};

const SOURCE_ONLY_PATCH_IDS = new Set([
	"FAB12eLcSCAOOQwk",
	"fLg90csmdOOKmEE6",
	"5rlneScoI5feQ3Di",
	"J0IWUhxada2ONowP",
	"nGTxNWBUBgTr87wU",
	"pvTcazVvW4v04otW",
	"UlygtNPSDlWPIFCI",
	"VcE8Hie2jbpuyuM3",
	"vvVhAqreedtmOR9b",
]);

const BEHAVIOR_PATCH_HASHES = {
	"0FWto1oEr3jbWggw": "d785a2dd",
	"190PHSHKGaJ74wsR": "fefea31e",
	"2W9uMTT6iJhfQ044": "00da6c0c",
	"58rFc9HiBoX66J6p": "47835fc7",
	"DmbWR9s5I8LHBwxB": "ff58b894",
	"HrOBAXsEX073ReKl": "c860c0c1",
	"IzoOmDywGLqLNljN": "bdb1e103",
	"IupskvzvoGyD2H5o": "d759b76f",
	"ULmZMLezDamerN04": "1fa2a91a",
	"YySjPfSAPdMAfjsh": "7db347c2",
	"bHxGutf5lZy0kciK": "dff8bb52",
	"g0SzfsLyW7aD2F19": "6915a00c",
	"h766UvswLCsxcMow": "82d5a433",
	"V9zm2hKUVLVZtAcN": "18221042",
	"lII4KMRblqwFBlsV": "c837624f",
	"sgS9rblPkQB36C8S": "2cee54d9",
	"whUSkaR1yem21bXp": "5af52879",
	"BHbFqhJPzZI2txLs": "7d476228",
	"R6SnyF3y4Vsq6oga": "6beadfc5",
	"UsuwsmU1TUQLQVM2": "f046c8a0",
	"Wo4wQKUxSItAhRzZ": "3cef2383",
	"s6eZXfZkC1My6EXl": "8ae2836d",
	"LOL2TGf8p8KxP14D": "e84a34ba",
	"WRe1eGmGVGejPcS8": "6e4e52b6",
};

const PARENTHESIZED_LORE_IDS = new Set([
	"BHbFqhJPzZI2txLs",
	"R6SnyF3y4Vsq6oga",
	"UsuwsmU1TUQLQVM2",
	"Wo4wQKUxSItAhRzZ",
]);

const MAGIC_WIND_NAME_IDS = new Set(["LOL2TGf8p8KxP14D", "WRe1eGmGVGejPcS8"]);

function normalizeSource(source) {
	return String(source ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

export function hashSource(source) {
	let hash = 0x811c9dc5;
	for (const char of normalizeSource(source)) {
		hash ^= char.charCodeAt(0);
		hash = Math.imul(hash, 0x01000193);
	}
	return (hash >>> 0).toString(16).padStart(8, "0");
}

function readQuoted(source, start) {
	const quote = source[start];
	let index = start + 1;
	while (index < source.length) {
		if (source[index] === "\\") {
			index += 2;
			continue;
		}
		if (source[index] === quote) {
			return index + 1;
		}
		index++;
	}
	return source.length;
}

function skipComment(source, start) {
	if (source[start + 1] === "/") {
		let index = start + 2;
		while (index < source.length && source[index] !== "\n") {
			index++;
		}
		return index;
	}
	if (source[start + 1] === "*") {
		let index = start + 2;
		while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) {
			index++;
		}
		return Math.min(source.length, index + 2);
	}
	return start;
}

function readTemplateExpression(source, start) {
	let depth = 1;
	let index = start;
	while (index < source.length) {
		const char = source[index];
		if (char === "\"" || char === "'") {
			index = readQuoted(source, index);
			continue;
		}
		if (char === BACKTICK) {
			index = readTemplate(source, index).end;
			continue;
		}
		if (char === "/" && (source[index + 1] === "/" || source[index + 1] === "*")) {
			index = skipComment(source, index);
			continue;
		}
		if (char === "{") {
			depth++;
		}
		else if (char === "}") {
			depth--;
			if (depth === 0) {
				return {end: index + 1, closed: true};
			}
		}
		index++;
	}
	return {end: source.length, closed: false};
}

function readTemplate(source, start) {
	const quasis = [];
	const expressions = [];
	let quasiStart = start + 1;
	let index = quasiStart;

	while (index < source.length) {
		if (source[index] === "\\") {
			index += 2;
			continue;
		}
		if (source[index] === BACKTICK) {
			quasis.push(source.slice(quasiStart, index));
			return {end: index + 1, quasis, expressions, closed: true};
		}
		if (source[index] === "$" && source[index + 1] === "{") {
			quasis.push(source.slice(quasiStart, index));
			const expressionStart = index + 2;
			const expression = readTemplateExpression(source, expressionStart);
			expressions.push(source.slice(expressionStart, Math.max(expressionStart, expression.end - 1)));
			index = expression.end;
			quasiStart = index;
			if (!expression.closed) {
				return {end: source.length, quasis, expressions, closed: false};
			}
			continue;
		}
		index++;
	}

	quasis.push(source.slice(quasiStart));
	return {end: source.length, quasis, expressions, closed: false};
}

export function scanScript(source) {
	source = normalizeSource(source);
	const tokens = [];
	let signature = "";
	let index = 0;

	while (index < source.length) {
		const char = source[index];
		if (/\s/.test(char)) {
			index++;
			continue;
		}
		if (char === "/" && (source[index + 1] === "/" || source[index + 1] === "*")) {
			index = skipComment(source, index);
			continue;
		}
		if (char === "\"" || char === "'") {
			const end = readQuoted(source, index);
			tokens.push({type: "string", start: index, end, raw: source.slice(index, end)});
			signature += "<S>";
			index = end;
			continue;
		}
		if (char === BACKTICK) {
			const template = readTemplate(source, index);
			tokens.push({
				type: "template",
				start: index,
				end: template.end,
				raw: source.slice(index, template.end),
				quasis: template.quasis,
				expressions: template.expressions,
				closed: template.closed,
			});
			signature += "<T>";
			index = template.end;
			continue;
		}
		signature += char;
		index++;
	}

	return {source, signature, tokens};
}

function expressionSignature(expression) {
	return scanScript(expression).signature;
}

function compatibleTemplate(source, translation) {
	return source.closed
		&& translation.closed
		&& source.expressions.length === translation.expressions.length
		&& source.expressions.every((expression, index) =>
			expressionSignature(expression) === expressionSignature(translation.expressions[index])
		);
}

function composeTemplate(quasis, expressions) {
	let output = BACKTICK;
	for (let index = 0; index < quasis.length; index++) {
		output += quasis[index];
		if (index < expressions.length) {
			output += DOLLAR_BRACE + expressions[index] + "}";
		}
	}
	return output + BACKTICK;
}

function manualTemplate(id, ordinal) {
	const interpolation = expression => DOLLAR_BRACE + expression + "}";
	if (id === "0amHqfjTRp5ff6Op" && ordinal === 0) {
		return BACKTICK + "Uleczone rany: " + interpolation("wounds") + BACKTICK;
	}
	if ((id === "6BmvV9c03FkfisnE" || id === "7JW9t8AYSDkkzG2V") && ordinal === 0) {
		return BACKTICK
			+ interpolation("this.actor.name") + " zakłada <strong>" + interpolation("this.item.name") + "</strong>. <br>\n"
			+ "Jeśli maska jest noszona przez ponad godzinę lub wykorzystane są jej efekty, postać jest wystawiona na @Corruption[moderate]{Przeciętne Zepsucie}."
			+ BACKTICK;
	}
	if (id === "Fvlc4RkeF4dHjW3m" && ordinal === 0) {
		return BACKTICK + "Dodano cechę Niestabilny: " + interpolation("this.actor.prototypeToken.name") + BACKTICK;
	}
	if (id === "lmBAZCtofsC8hHHG" && ordinal === 1) {
		const plural = "SL > 1 ? game.wfrp4eCorePl.scripts.localize(\"SLs\") : game.wfrp4eCorePl.scripts.localize(\"SL\")";
		return BACKTICK
			+ "\n  <div>\n    <p style=\"font-weight: bold;\">Zdobyto "
			+ interpolation("signedSL") + " " + interpolation(plural)
			+ ". Czy chcesz rzucić k10?</p>\n    <p>1–6: dodaj +1 PS</p>\n"
			+ "    <p>7–10: strać wszystkie PS i następny test wykonaj z –1 PS</p>\n  </div>\n"
			+ BACKTICK;
	}
	if (id === "x9iKFYYc4Ocy8PTS" && (ordinal === 0 || ordinal === 1)) {
		return BACKTICK + " (" + interpolation("name") + ")" + BACKTICK;
	}
	if (id === "Me1wS5XdqUEy7OGt" && ordinal === 1) {
		return BACKTICK
			+ interpolation("this.actor.name") + " otrzymuje trafienie krytyczne "
			+ interpolation("crit") + " (lokacja: " + interpolation("loc")
			+ "). Nie stosuj Krwawienia ani dodatkowej utraty Żywotności."
			+ BACKTICK;
	}
	if (id === "Me1wS5XdqUEy7OGt" && ordinal === 0) {
		return BACKTICK + "crit" + interpolation("game.wfrp4e.tables.generalizeTable(loc)") + BACKTICK;
	}
	if (id === "58rFc9HiBoX66J6p" && ordinal === 1) {
		return BACKTICK + interpolation("tb") + " Bonus Wt" + BACKTICK;
	}
	return null;
}

function decodeStringLiteral(raw) {
	try {
		return Function("\"use strict\"; return (" + raw + ");")();
	}
	catch (_error) {
		return null;
	}
}

function addMapValue(map, key, value) {
	if (typeof key !== "string" || typeof value !== "string" || key === value) {
		return;
	}
	const values = map.get(key) ?? new Set();
	values.add(value);
	map.set(key, values);
}

export function registerPair(original, localized) {
	if (typeof original !== "string" || typeof localized !== "string" || original === localized) {
		return;
	}
	addMapValue(originalToLocalized, original, localized);
	addMapValue(localizedToOriginal, localized, original);
	equivalenceCache.clear();
}

function registerScriptPair(id, original, localized) {
	if (!id || typeof original !== "string" || typeof localized !== "string" || original === localized) {
		return;
	}
	const originalMap = scriptOriginalToLocalized.get(id) ?? new Map();
	const localizedMap = scriptLocalizedToOriginal.get(id) ?? new Map();
	addMapValue(originalMap, original, localized);
	addMapValue(localizedMap, localized, original);
	scriptOriginalToLocalized.set(id, originalMap);
	scriptLocalizedToOriginal.set(id, localizedMap);
	equivalenceCache.clear();
}

function shouldPreserveControlValue(id, original) {
	return PRESERVED_CONTROL_VALUES[id]?.has(original) ?? false;
}

export function transplantScriptLiterals(id, source, translation) {
	const sourceScan = scanScript(source);
	const translationScan = scanScript(translation);
	if (sourceScan.signature !== translationScan.signature
		|| sourceScan.tokens.length !== translationScan.tokens.length
		|| sourceScan.tokens.some((token, index) => token.type !== translationScan.tokens[index]?.type)) {
		if (SOURCE_ONLY_PATCH_IDS.has(id)) {
			return {code: sourceScan.source, compatible: true, reason: null, templateFallbacks: []};
		}
		return {code: sourceScan.source, compatible: false, reason: "script skeleton mismatch", templateFallbacks: []};
	}

	let output = "";
	let cursor = 0;
	let templateOrdinal = 0;
	const templateFallbacks = [];

	for (let index = 0; index < sourceScan.tokens.length; index++) {
		const sourceToken = sourceScan.tokens[index];
		const translatedToken = translationScan.tokens[index];
		output += sourceScan.source.slice(cursor, sourceToken.start);

		if (sourceToken.type === "string") {
			const original = decodeStringLiteral(sourceToken.raw);
			const localized = decodeStringLiteral(translatedToken.raw);
			registerScriptPair(id, original, localized);
			output += shouldPreserveControlValue(id, original) ? sourceToken.raw : translatedToken.raw;
		}
		else {
			const override = manualTemplate(id, templateOrdinal);
			if (override) {
				output += override;
			}
			else if (compatibleTemplate(sourceToken, translatedToken)) {
				output += composeTemplate(translatedToken.quasis, sourceToken.expressions);
			}
			else {
				output += sourceToken.raw;
				templateFallbacks.push(templateOrdinal);
			}
			templateOrdinal++;
		}
		cursor = sourceToken.end;
	}

	output += sourceScan.source.slice(cursor);
	return {code: output, compatible: true, reason: null, templateFallbacks};
}

function protectedSpans(source) {
	const spans = [];
	let index = 0;
	while (index < source.length) {
		const char = source[index];
		if (char === "\"" || char === "'") {
			const end = readQuoted(source, index);
			spans.push({start: index, end});
			index = end;
			continue;
		}
		if (char === BACKTICK) {
			const end = readTemplate(source, index).end;
			spans.push({start: index, end});
			index = end;
			continue;
		}
		if (char === "/" && (source[index + 1] === "/" || source[index + 1] === "*")) {
			const end = skipComment(source, index);
			spans.push({start: index, end});
			index = end;
			continue;
		}
		index++;
	}
	return spans;
}

function maskProtected(source) {
	const spans = protectedSpans(source);
	const values = [];
	let output = "";
	let cursor = 0;
	for (const span of spans) {
		output += source.slice(cursor, span.start);
		const token = TOKEN_PREFIX + values.length + "__";
		values.push(source.slice(span.start, span.end));
		output += token;
		cursor = span.end;
	}
	output += source.slice(cursor);
	return {source: output, values};
}

function unmaskProtected(source, values) {
	const pattern = new RegExp(TOKEN_PREFIX + "(\\d+)__", "g");
	return source.replace(pattern, (_match, index) => values[Number(index)]);
}

function guardGeneratorLookups(source, {polish = false} = {}) {
	const missing = polish ? "Nie znaleziono" : "Could not find";

	// Several official actor generators dereference a missing compendium skill.
	// Skip only that entry so the remaining actor data can still be generated.
	source = source.replace(
		/^([ \t]*)(skillItem = await game\.wfrp4e\.utility\.findSkill\(skill\);?)\r?\n\1(skillItem = skillItem\.toObject\(\);?)/gm,
		(_match, indent, lookup, convert) => [
			indent + lookup,
			indent + "if (!skillItem) {",
			indent + "    ui.notifications.warn(\"" + missing + " \" + skill, {permanent: true});",
			indent + "    continue;",
			indent + "}",
			indent + convert,
		].join("\n"),
	);

	// A few generators add Ride (Horse) outside a loop. Abort safely before any
	// actor update if that source item is unavailable.
	source = source.replace(
		/^([ \t]*)(let skill = await game\.wfrp4e\.utility\.findSkill\([^\r\n]+\);?)\r?\n\1(skill = skill\.toObject\(\);?)/gm,
		(_match, indent, lookup, convert) => [
			indent + lookup,
			indent + "if (!skill) {",
			indent + "    ui.notifications.warn(\"" + missing + " Ride (Horse)\", {permanent: true});",
			indent + "    return;",
			indent + "}",
			indent + convert,
		].join("\n"),
	);

	// Trait generators already report the missing item, but used to continue
	// directly into traitItem.toObject().
	source = source.replace(
		/^([ \t]*)if \(!traitItem\)\s*\{\r?\n([\s\S]*?)^\1\}\r?\n\1(traitItem = traitItem\.toObject\(\);?)/gm,
		(match, indent, body, convert) => {
			if (body.includes("continue;")) {
				return match;
			}
			return indent + "if (!traitItem) {\n"
				+ body
				+ indent + "  continue;\n"
				+ indent + "}\n"
				+ indent + convert;
		},
	);

	return source;
}

/**
 * Make direct textual predicates bilingual without replacing complete scripts.
 * Protected literals are masked first, so these transforms never touch text,
 * comments, regular expressions, or template contents.
 */
export function applyBilingualTransforms(source, {id, polish = false} = {}) {
	source = guardGeneratorLookups(source, {polish});
	const masked = maskProtected(source);
	let code = masked.source;
	const protectedToken = TOKEN_PREFIX + "\\d+__";
	const atom = "(?:this|[A-Za-z_$][\\w$]*)(?:(?:\\?\\.|\\.)[A-Za-z_$][\\w$]*|\\[[^\\]\\r\\n]+\\]|\\(\\))*";
	const api = "game.wfrp4eCorePl.scripts";
	const names = "game.wfrp4eCorePl.names";
	const i18nCall = "game\\.i18n\\.(?:localize|format)\\(\\s*" + protectedToken + "\\s*\\)";
	const reference = "(?:" + protectedToken + "|" + i18nCall + ")";
	const query = "(?:" + reference + "|" + atom + ")";
	const scope = id ? ", " + JSON.stringify(id) : "";

	const getNameCall = new RegExp("(" + atom + ")(\\?\\.|\\.)getName\\(\\s*(" + reference + "|" + atom + ")\\s*\\)", "g");
	code = code.replace(getNameCall, (_match, collection, _connector, query) =>
		names + ".find(" + collection + ", " + query + ")"
	);

	const mappedNameArrayIncludes = new RegExp(
		"(\\[\\s*" + protectedToken + "(?:\\s*,\\s*" + protectedToken + ")*\\s*\\]"
		+ "\\.map\\(\\s*[A-Za-z_$][\\w$]*\\s*=>\\s*game\\.i18n\\.localize\\(\\s*[A-Za-z_$][\\w$]*\\s*\\)\\s*\\))"
		+ "\\.includes\\((" + atom + ")(?:\\?\\.|\\.)name\\)",
		"g",
	);
	code = code.replace(mappedNameArrayIncludes, (_match, values, document) => names + ".oneOf(" + document + ", " + values + ")");

	const flagNameArrayIncludes = new RegExp(
		"\\(\\s*(" + atom + ")\\.getFlag\\(\\s*(" + reference + ")\\s*,\\s*(" + reference + ")\\s*\\)\\s*\\|\\|\\s*\\[\\s*\\]\\s*\\)"
		+ "\\.includes\\((" + atom + ")(?:\\?\\.|\\.)name\\)",
		"g",
	);
	code = code.replace(flagNameArrayIncludes, (_match, owner, namespace, key, document) =>
		names + ".oneOf(" + document + ", (" + owner + ".getFlag(" + namespace + ", " + key + ") || []))"
	);

	const nameArrayIncludes = new RegExp("(\\[\\s*" + reference + "(?:\\s*,\\s*" + reference + ")*\\s*\\])\\.includes\\((" + atom + ")(?:\\?\\.|\\.)name\\)", "g");
	code = code.replace(nameArrayIncludes, (_match, values, document) => names + ".oneOf(" + document + ", " + values + ")");

	const nameIncludes = new RegExp("(" + atom + ")(?:\\?\\.|\\.)name(?:\\?\\.|\\.)includes\\((" + query + ")\\)", "g");
	code = code.replace(nameIncludes, (_match, document, expected) => names + ".includes(" + document + ", " + expected + ")");

	const lowercaseNameIncludes = new RegExp(
		"(" + atom + ")(?:\\?\\.|\\.)name\\.toLowerCase\\(\\)\\.includes\\((" + query + ")\\)",
		"g",
	);
	code = code.replace(lowercaseNameIncludes, (_match, document, expected) =>
		names + ".includes(" + document + ", " + expected + ", {caseInsensitive: true})"
	);

	const careerListIncludes = new RegExp(
		"(" + atom + "\\.system\\.(?:skills|addedSkills|talents|trappings)"
		+ "(?:\\.concat\\(\\s*" + atom + "\\s*\\))?)\\.includes\\((" + query + ")\\)",
		"g",
	);
	code = code.replace(careerListIncludes, (_match, values, expected) => api + ".oneOf(" + expected + ", " + values + scope + ")");

	const operators = "(===|!==|==|!=)";
	const rightName = new RegExp("(" + atom + ")(?:\\?\\.|\\.)name\\s*" + operators + "\\s*(" + query + ")", "g");
	code = code.replace(rightName, (_match, document, operator, expected) =>
		(operator === "!=" || operator === "!==" ? "!" : "") + names + ".matches(" + document + ", " + expected + ")"
	);

	const leftName = new RegExp("(" + query + ")\\s*" + operators + "\\s*(" + atom + ")(?:\\?\\.|\\.)name", "g");
	code = code.replace(leftName, (_match, expected, operator, document) =>
		(operator === "!=" || operator === "!==" ? "!" : "") + names + ".matches(" + document + ", " + expected + ")"
	);

	const arrayIncludes = new RegExp("(\\[\\s*" + reference + "(?:\\s*,\\s*" + reference + ")*\\s*\\])\\.includes\\((" + atom + ")\\)", "g");
	code = code.replace(arrayIncludes, (_match, values, actual) => api + ".oneOf(" + actual + ", " + values + scope + ")");

	const replaceCall = new RegExp("(" + atom + ")\\.replace\\((" + reference + ")\\s*,\\s*(" + reference + "|" + atom + ")\\)", "g");
	code = code.replace(replaceCall, (_match, actual, search, replacement) =>
		api + ".replaceAlias(" + actual + ", " + search + ", " + replacement + scope + ")"
	);

	const includesCall = new RegExp("(" + atom + ")(\\?\\.|\\.)includes\\((" + reference + ")\\)", "g");
	code = code.replace(includesCall, (_match, actual, connector, expected) =>
		actual + connector + "includes(" + api + ".fragmentFor(" + expected + ", " + actual + scope + "))"
	);

	const rightLiteral = new RegExp("(" + atom + ")\\s*" + operators + "\\s*(" + reference + ")", "g");
	code = code.replace(rightLiteral, (_match, actual, operator, reference) =>
		actual + " " + operator + " " + api + ".aliasFor(" + reference + ", " + actual + scope + ")"
	);

	const leftLiteral = new RegExp("(" + reference + ")\\s*" + operators + "\\s*(" + atom + ")", "g");
	code = code.replace(leftLiteral, (_match, reference, operator, actual) =>
		api + ".aliasFor(" + reference + ", " + actual + scope + ") " + operator + " " + actual
	);

	return unmaskProtected(code, masked.values);
}

function applyPatchSet(id, source, {sourceHash = hashSource(source), fallback = source} = {}) {
	const patch = SOURCE_PATCHES[id];
	if (!patch || sourceHash !== patch.hash) {
		return source;
	}
	let output = normalizeSource(source);
	for (const [before, after] of patch.replacements) {
		if (!output.includes(before)) {
			console.error(MODULE_ID + " | Required script patch did not match " + id, before);
			return fallback;
		}
		output = output.replace(before, after);
	}
	return output;
}

function randomSpellScript({polish, id}) {
	const loading = polish ? "Ładowanie Zaklęć" : "Loading Spells";
	const missingPrefix = polish ? "Nie udało się odnaleźć zaklęcia w Tradycji " : "Could not find ";
	const missingSuffix = polish ? ". Spróbuj ponownie." : " spell. Try Again.";
	const scope = ", " + JSON.stringify(id);
	return [
		"const spells = await warhammer.utility.findAllItems(\"spell\", " + JSON.stringify(loading) + ", true, [\"system.lore.value\"]);",
		"const text = (await game.wfrp4e.tables.rollTable(\"random-caster\", {hideDSN: true})).result;",
		"",
		"if (game.wfrp4eCorePl.scripts.equivalent(text, \"GM's Choice\"" + scope + ")) {",
		"    return this.script.notification(text);",
		"}",
		"",
		"const lore = text.match(/{(.+?)}/)?.[1] ?? text;",
		"const spellsWithLore = spells.filter(spell => game.wfrp4eCorePl.scripts.loreMatches(lore, spell.system.lore.value" + scope + "));",
		"",
		"if (spellsWithLore.length > 0) {",
		"    const selectedSpell = spellsWithLore[Math.floor(CONFIG.Dice.randomUniform() * spellsWithLore.length)];",
		"    const selectedDocument = selectedSpell.toObject ? selectedSpell : await fromUuid(selectedSpell.uuid);",
		"    this.script.notification(selectedDocument.name);",
		"    await this.actor.createEmbeddedDocuments(\"Item\", [selectedDocument.toObject()]);",
		"}",
		"else {",
		"    ui.notifications.notify(" + BACKTICK + missingPrefix + DOLLAR_BRACE + "lore}" + missingSuffix + BACKTICK + ");",
		"}",
	].join("\n");
}

function randomCasterScript({polish, id}) {
	const loading = polish ? "Wczytywanie Zaklęć..." : "Loading Spells";
	const missing = polish ? "Nie odnaleziono zaklęcia dla wylosowanej Tradycji." : "No spell was found for the rolled Lore.";
	const scope = ", " + JSON.stringify(id);
	return [
		"const spells = await warhammer.utility.findAllItems(\"spell\", " + JSON.stringify(loading) + ", true, [\"system.lore.value\"]);",
		"const displayedLore = (await game.wfrp4e.tables.rollTable(\"random-caster\", {hideDSN: true})).text;",
		"this.script.notification(displayedLore);",
		"",
		"if (game.wfrp4eCorePl.scripts.equivalent(displayedLore, \"GM's Choice\"" + scope + ")) return;",
		"",
		"let spellsWithLore;",
		"if (game.wfrp4eCorePl.scripts.equivalent(displayedLore, \"Arcane Magic\"" + scope + ")) {",
		"    spellsWithLore = spells.filter(spell => !spell.system.lore.value);",
		"}",
		"else {",
		"    const loreKey = game.wfrp4eCorePl.scripts.equivalent(displayedLore, \"Petty Magic\"" + scope + ")",
		"        ? \"petty\"",
		"        : game.wfrp4eCorePl.scripts.loreKey(displayedLore" + scope + ");",
		"    spellsWithLore = spells.filter(spell => spell.system.lore.value === loreKey);",
		"}",
		"",
		"const selectedSpell = spellsWithLore[Math.floor(CONFIG.Dice.randomUniform() * spellsWithLore.length)];",
		"if (!selectedSpell) return ui.notifications.warn(" + JSON.stringify(missing) + ");",
		"const selectedDocument = selectedSpell.toObject ? selectedSpell : await fromUuid(selectedSpell.uuid);",
		"const item = await Item.implementation.create(selectedDocument.toObject(), {parent: this.actor});",
		"const test = await this.actor.setupCast(item);",
		"return test.roll();",
	].join("\n");
}

function terrainSpecializationScript({polish}) {
	const choices = polish
		? {coastal: "Wybrzeża", deserts: "Pustynie", marshes: "Moczary", rocky: "Teren Kamienisty", tundra: "Tundra", woodlands: "Lasy"}
		: {coastal: "Coastal", deserts: "Deserts", marshes: "Marshes", rocky: "Rocky", tundra: "Tundra", woodlands: "Woodlands"};
	const title = polish ? "Wybierz rodzaj terenu" : "Choose Terrain";
	return [
		"const placeholders = new Set([\"any\", \"any terrain\", \"the terrain\", \"wybrany teren\"]);",
		"const specialization = value => String(value ?? \"\").match(/\\(([^()]*)\\)\\s*$/)?.[1]?.trim();",
		"const withSpecialization = (value, selected) => /\\([^()]*\\)\\s*$/.test(value)",
		"    ? value.replace(/\\([^()]*\\)\\s*$/, \"(\" + selected + \")\")",
		"    : value.trim() + \" (\" + selected + \")\";",
		"let name = this.item.name;",
		"let tests = this.item.system.tests.value;",
		"let selected = specialization(name);",
		"if (!selected || placeholders.has(selected.toLocaleLowerCase())) {",
		"    const choice = await ItemDialog.create(ItemDialog.objectToArray(" + JSON.stringify(choices) + ", this.item.img), 1, " + JSON.stringify(title) + ");",
		"    if (!choice[0]) return;",
		"    selected = choice[0].name;",
		"}",
		"name = withSpecialization(name, selected);",
		"tests = withSpecialization(tests, selected);",
		"this.effect.updateSource({name});",
		"this.item.updateSource({name, \"system.tests.value\": tests});",
	].join("\n");
}

function etiquetteSpecializationScript({polish}) {
	const prompt = polish ? "Wpisz grupę społeczną" : "Enter Etiquette Group";
	return [
		"const placeholders = new Set([\"any\", \"social group\", \"grupa społeczna\"]);",
		"const specialization = value => String(value ?? \"\").match(/\\(([^()]*)\\)\\s*$/)?.[1]?.trim();",
		"const withSpecialization = (value, selected) => /\\([^()]*\\)\\s*$/.test(value)",
		"    ? value.replace(/\\([^()]*\\)\\s*$/, \"(\" + selected + \")\")",
		"    : value.trim() + \" (\" + selected + \")\";",
		"let name = this.item.name;",
		"let tests = this.item.system.tests.value;",
		"let selected = specialization(name);",
		"if (!selected || placeholders.has(selected.toLocaleLowerCase())) {",
		"    selected = await ValueDialog.create({text: " + JSON.stringify(prompt) + ", title: this.effect.name});",
		"    if (!selected) return;",
		"}",
		"name = withSpecialization(name, selected);",
		"tests = withSpecialization(tests, selected);",
		"this.item.updateSource({name, \"system.tests.value\": tests});",
	].join("\n");
}

function tradeSpecializationScript({polish}) {
	const choose = polish ? "Wybierz umiejętność Rzemiosło lub nie wybieraj niczego, aby wpisać własną." : "Choose a Trade Skill, or select none to enter manually.";
	const custom = polish ? "Wpisz własną umiejętność Rzemiosło" : "Enter Custom Trade Skill";
	const customTitle = polish ? "Własne Rzemiosło" : "Custom Trade";
	return [
		"const placeholders = new Set([\"any\", \"any trade\", \"any one\", \"dowolne\", \"dowolne rzemiosło\"]);",
		"const specialization = value => String(value ?? \"\").match(/\\(([^()]*)\\)\\s*$/)?.[1]?.trim();",
		"const withSpecialization = (value, selected) => /\\([^()]*\\)\\s*$/.test(value)",
		"    ? value.replace(/\\([^()]*\\)\\s*$/, \"(\" + selected + \")\")",
		"    : value.trim() + \" (\" + selected + \")\";",
		"let selected = specialization(this.item.name);",
		"if (selected && !placeholders.has(selected.toLocaleLowerCase())) {",
		"    return this.item.updateSource({\"system.tests.value\": withSpecialization(this.item.system.tests.value, selected)});",
		"}",
		"const index = game.packs.filter(pack => pack.metadata.type == \"Item\")",
		"    .reduce((entries, pack) => entries.concat(pack.index.contents), [])",
		"    .filter(item => item.type == \"skill\" && game.wfrp4eCorePl.names.includes(item, game.i18n.localize(\"NAME.Trade\")))",
		"    .map(item => { item.id = item._id; return item; });",
		"const choice = await ItemDialog.create(index, 1, {text: " + JSON.stringify(choose) + ", title: this.effect.name});",
		"if (choice[0]) {",
		"    selected = game.wfrp4e.utility.extractParenthesesText(choice[0].name);",
		"}",
		"else {",
		"    selected = await ValueDialog.create({text: " + JSON.stringify(custom) + ", title: " + JSON.stringify(customTitle) + "});",
		"}",
		"if (!selected) return;",
		"await this.item.updateSource({",
		"    name: withSpecialization(this.item.name, selected),",
		"    \"system.tests.value\": withSpecialization(this.item.system.tests.value, selected),",
		"});",
	].join("\n");
}

function witchCareerSkillScript({id}) {
	const scope = JSON.stringify(id);
	return [
		"const skill = \"Language (Magick)\";",
		"const displaySkill = game.wfrp4eCorePl.names.display(skill, \"skill\");",
		"const currentCareer = this.actor.system.currentCareer;",
		"const existingSkill = this.actor.itemTypes.skill.find(item => game.wfrp4eCorePl.names.matches(item, skill));",
		"if (!currentCareer) return;",
		"const careerSkills = currentCareer.system.skills.concat(currentCareer.system.addedSkills);",
		"const inCurrentCareer = game.wfrp4eCorePl.scripts.oneOf(skill, careerSkills, " + scope + ");",
		"const witchAdded = this.actor.getFlag(\"wfrp4e\", \"witchAdded\") || {};",
		"const skillKey = existingSkill ? game.wfrp4eCorePl.names.original(existingSkill) : skill;",
		"if (existingSkill && inCurrentCareer && !witchAdded[skillKey]) {",
		"    existingSkill.system.advances.costModifier = -5;",
		"}",
		"else {",
		"    witchAdded[skillKey] = true;",
		"    if (!inCurrentCareer) currentCareer.system.addedSkills.push(displaySkill);",
		"    foundry.utils.setProperty(this.actor, \"flags.wfrp4e.witchAdded\", witchAdded);",
		"}",
	].join("\n");
}

function localizedCareerSkillScript({id, skillExpression, flag}) {
	const scope = JSON.stringify(id);
	return [
		"const skill = " + skillExpression + ";",
		"const currentCareer = this.actor.system.currentCareer;",
		"const existingSkill = this.actor.itemTypes.skill.find(item => game.wfrp4eCorePl.names.matches(item, skill));",
		"if (!currentCareer) return;",
		"const careerSkills = currentCareer.system.skills.concat(currentCareer.system.addedSkills);",
		"const inCurrentCareer = game.wfrp4eCorePl.scripts.oneOf(skill, careerSkills, " + scope + ");",
		"const addedByTalent = this.actor.getFlag(\"wfrp4e\", " + JSON.stringify(flag) + ") || {};",
		"const skillKey = existingSkill ? game.wfrp4eCorePl.names.original(existingSkill) : skill;",
		"if (existingSkill && inCurrentCareer && !addedByTalent[skillKey]) {",
		"    existingSkill.system.advances.costModifier = -5;",
		"}",
		"else {",
		"    addedByTalent[skillKey] = true;",
		"    if (!inCurrentCareer) currentCareer.system.addedSkills.push(skill);",
		"    foundry.utils.setProperty(this.actor, \"flags.wfrp4e." + flag + "\", addedByTalent);",
		"}",
	].join("\n");
}

function addCareerTalentsScript({id}) {
	const scope = JSON.stringify(id);
	return [
		"const talents = [\"Berserk Charge\", \"Combat Aware\", \"Combat Reflexes\", \"Furious Assault\", \"Implacable\", \"Magic Resistance\", \"Resistance (Magic)\", \"Resolute\", \"Strike Mighty Blow\", \"Warrior Born\"];",
		"const currentCareer = this.actor.system.currentCareer;",
		"if (!currentCareer) return;",
		"for (const talent of talents) {",
		"    if (game.wfrp4eCorePl.scripts.oneOf(talent, currentCareer.system.talents, " + scope + ")) continue;",
		"    currentCareer.system.talents.push(game.wfrp4eCorePl.names.display(talent, \"talent\"));",
		"}",
	].join("\n");
}

function blessedTalentScript({polish}) {
	const prompt = polish ? "Wpisz nazwę bóstwa" : "Enter a Deity";
	const title = polish ? "Błogosławieństwo" : "Blessed";
	const loading = polish ? "Wczytywanie błogosławieństw" : "Loading Prayers";
	const choose = polish ? "Wybierz dowolnych 6 błogosławieństw" : "Select any 6 Blessings";
	const adding = polish ? "Dodawanie: " : "Adding ";
	const missing = polish ? "Nie odnaleziono błogosławieństw powiązanych z " : "Could not find any Blessings associated with ";
	return [
		"if (this.actor.type != \"character\") return;",
		"const enteredGod = await ValueDialog.create({text: " + JSON.stringify(prompt) + ", title: " + JSON.stringify(title) + "});",
		"const god = String(enteredGod ?? \"\").trim();",
		"if (!god) return;",
		"const godKey = value => {",
		"    const key = String(value ?? \"\").trim().toLocaleLowerCase();",
		"    return key === \"stara wiara\" ? \"old faith\" : key;",
		"};",
		"const prayers = await warhammer.utility.findAllItems(\"prayer\", " + JSON.stringify(loading) + ", true, [\"system.type.value\", \"system.god.value\"]);",
		"let blessings = prayers.filter(prayer => prayer.system.god.value.split(\",\").some(value => godKey(value) === godKey(god)) && prayer.system.type.value == \"blessing\");",
		"const configBlessings = await Promise.all((game.wfrp4e.config.godBlessings[godKey(god)] || []).map(fromUuid));",
		"if (godKey(god) === \"old faith\") {",
		"    blessings = await ItemDialog.create(prayers.filter(item => item.system.type.value == \"blessing\"), 6, {text: " + JSON.stringify(choose) + ", title: " + JSON.stringify(title) + "});",
		"}",
		"if (configBlessings.length) {",
		"    blessings = blessings.concat(configBlessings.map(item => ({uuid: item.uuid, name: item.name})).filter(candidate => !blessings.find(item => item.uuid == candidate.uuid)));",
		"}",
		"if (blessings.length) {",
		"    this.script.notification(" + JSON.stringify(adding) + " + blessings.map(item => item.name).join(\", \"));",
		"    await this.actor.addEffectItems(blessings.map(item => item.uuid), this.effect);",
		"}",
		"else {",
		"    this.script.notification(" + JSON.stringify(missing) + " + god + \".\");",
		"}",
		"const baseName = this.item.name.replace(/\\s*\\([^)]*\\)\\s*$/, \"\").trim();",
		"this.item.updateSource({name: baseName + \" (\" + god + \")\"});",
		"await this.actor.update({\"system.details.god.value\": god});",
	].join("\n");
}

function martyrdomScript({polish}) {
	const applied = polish ? "Zadano obrażenia: " : "Damage applied to ";
	return [
		"const sourceActor = this.effect.sourceActor;",
		"const damage = args.totalWoundLoss;",
		"const tb = sourceActor.system.characteristics.t.bonus;",
		"args.abort = \"<strong>\" + this.effect.name + \"</strong>: " + applied + "\" + sourceActor.name;",
		"let message = await sourceActor.applyBasicDamage(damage - tb, {damageType: game.wfrp4e.config.DAMAGE_TYPE.IGNORE_AP, suppressMsg: true});",
		"const toughnessLine = new RegExp(\"(<strong>[^<]+</strong>\\\\s*:\\\\s*)-\" + tb + \"(?!\\\\d)\");",
		"message = String(message).replace(toughnessLine, \"$1-\" + tb + \" × 2\")",
		"    .replace(tb + \" TB\", tb + \" × 2 TB\")",
		"    .replace(tb + \" Bonus Wt\", tb + \" × 2 Bonus Wt\");",
		"this.script.message(message);",
		"args.abort = true;",
	].join("\n");
}

function applyBehaviorPatches(id, source, {sourceHash, polish}) {
	if (BEHAVIOR_PATCH_HASHES[id] !== sourceHash) {
		return source;
	}

	if (id === "0FWto1oEr3jbWggw") {
		return randomSpellScript({polish, id});
	}
	if (id === "190PHSHKGaJ74wsR") {
		return terrainSpecializationScript({polish});
	}
	if (id === "2W9uMTT6iJhfQ044") {
		return localizedCareerSkillScript({
			id,
			flag: "craftsmanAdded",
			skillExpression: 'game.i18n.localize("NAME.Trade") + " (" + this.item.parenthesesText + ")"',
		});
	}
	if (id === "58rFc9HiBoX66J6p") {
		return martyrdomScript({polish});
	}
	if (id === "IzoOmDywGLqLNljN") {
		return witchCareerSkillScript({id});
	}
	if (id === "HrOBAXsEX073ReKl") {
		return localizedCareerSkillScript({
			id,
			flag: "perfectPitchAdded",
			skillExpression: 'game.i18n.localize("NAME.Entertain") + " (" + game.i18n.localize("SPEC.Singing") + ")"',
		});
	}
	if (id === "IupskvzvoGyD2H5o") {
		return blessedTalentScript({polish});
	}
	if (id === "ULmZMLezDamerN04") {
		return randomCasterScript({polish, id});
	}
	if (id === "YySjPfSAPdMAfjsh") {
		return addCareerTalentsScript({id});
	}
	if (id === "bHxGutf5lZy0kciK") {
		return source
			.replace('i.baseName == "Bless"', 'game.wfrp4eCorePl.names.matchingBaseAlias(i, "Bless")')
			.replace('i.baseName == "Invoke"', 'game.wfrp4eCorePl.names.matchingBaseAlias(i, "Invoke")');
	}
	if (id === "g0SzfsLyW7aD2F19") {
		return etiquetteSpecializationScript({polish});
	}
	if (id === "sgS9rblPkQB36C8S") {
		return tradeSpecializationScript({polish});
	}
	if (id === "DmbWR9s5I8LHBwxB") {
		const values = "[\"Undivided\", \"Khorne\", \"Nurgle\", \"Slaanesh\", \"Tzeentch\"]";
		const localizedValues = "{\"Undivided\": game.wfrp4eCorePl.scripts.display(\"Undivided\", " + JSON.stringify(id) + "), \"Khorne\": \"Khorne\", \"Nurgle\": \"Nurgle\", \"Slaanesh\": \"Slaanesh\", \"Tzeentch\": \"Tzeentch\"}";
		return source.replace(values, localizedValues);
	}
	if (PARENTHESIZED_LORE_IDS.has(id)) {
		const expression = "this.effect.name.split(\"(\")[1].split(\")\")[0].toLowerCase()";
		const originalName = "game.wfrp4eCorePl.names.original(this.effect)";
		return source.replace(
			expression,
			"game.wfrp4eCorePl.scripts.loreKey(" + originalName + ".split(\"(\")[1].split(\")\")[0], " + JSON.stringify(id) + ")",
		);
	}
	if (id === "s6eZXfZkC1My6EXl") {
		return source.replace(
			"this.effect.name.split(\" \")[2].toLowerCase()",
			"game.wfrp4eCorePl.scripts.loreKey(game.wfrp4eCorePl.names.original(this.effect).split(\" \")[2], " + JSON.stringify(id) + ")",
		);
	}
	if (MAGIC_WIND_NAME_IDS.has(id)) {
		return source.replace(
			"this.effect.name.split(\" \")[2]",
			"game.wfrp4eCorePl.names.original(this.effect).split(\" \")[2]",
		);
	}

	const brokenTraitCalculation = /traitName\.includes\([^)]*\)\s*\?\s*traitVal\s*-\s*parseInt\(characteristicValues\[3\]\/10\)\s*:\s*traitVal/g;
	if (brokenTraitCalculation.test(source)) {
		brokenTraitCalculation.lastIndex = 0;
		const weaponTraits = "[\"Weapon\", \"Horns\", \"Tail\", \"Tentacles\", \"Bite\"]";
		const strengthBonus = "Math.floor((this.actor.system.characteristics.s.value + characteristics.s) / 10)";
		return source.replace(
			brokenTraitCalculation,
			"game.wfrp4eCorePl.scripts.oneOf(traitName, " + weaponTraits + ", " + JSON.stringify(id) + ") ? Number(traitVal) - " + strengthBonus + " : traitVal"
		);
	}
	return source;
}

function allEquivalentValues(value, scriptId) {
	const values = new Set([value]);
	const mappings = [
		[originalToLocalized, localizedToOriginal],
		[scriptOriginalToLocalized.get(scriptId), scriptLocalizedToOriginal.get(scriptId)],
	];
	for (const [forward, reverse] of mappings) {
		if (!forward || !reverse) {
			continue;
		}
		for (const localized of forward.get(value) ?? []) {
			values.add(localized);
		}
		for (const original of reverse.get(value) ?? []) {
			values.add(original);
			for (const localized of forward.get(original) ?? []) {
				values.add(localized);
			}
		}
	}
	return values;
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

function documentEquivalence(left, right) {
	const names = globalThis.game?.wfrp4eCorePl?.names;
	if (!names || typeof left !== "string" || typeof right !== "string") {
		return false;
	}

	const worldItems = Array.from(collectionValues(globalThis.game?.items));
	const collections = [worldItems];
	for (const item of worldItems) {
		collections.push(collectionValues(item.effects));
	}
	for (const pack of collectionValues(globalThis.game?.packs)) {
		collections.push(collectionValues(pack.index));
	}
	for (const actor of collectionValues(globalThis.game?.actors)) {
		const actorItems = Array.from(collectionValues(actor.items));
		collections.push(actorItems, collectionValues(actor.effects), collectionValues(actor.appliedEffects));
		for (const item of actorItems) {
			collections.push(collectionValues(item.effects));
		}
	}

	for (const collection of collections) {
		for (const document of collection) {
			const aliases = names.aliases(document);
			if (aliases.includes(left) && aliases.includes(right)) {
				return true;
			}
		}
	}
	return false;
}

export function equivalent(left, right, scriptId) {
	if (left === right) {
		return true;
	}
	if (typeof left !== "string" || typeof right !== "string") {
		return false;
	}
	const pair = left < right ? left + "\u0000" + right : right + "\u0000" + left;
	const key = String(scriptId ?? "") + "\u0000" + pair;
	if (equivalenceCache.get(key)) {
		return true;
	}
	if (allEquivalentValues(left, scriptId).has(right)) {
		equivalenceCache.set(key, true);
		return true;
	}
	return documentEquivalence(left, right);
}

export function localize(value, scriptId) {
	if (typeof value !== "string") {
		return value;
	}
	return scriptOriginalToLocalized.get(scriptId)?.get(value)?.values().next().value
		?? originalToLocalized.get(value)?.values().next().value
		?? value;
}

export function display(value, scriptId) {
	const polish = game.i18n?.lang === "pl" || game.i18n?.lang?.startsWith("pl-");
	return polish ? localize(value, scriptId) : original(value, scriptId);
}

export function original(value, scriptId) {
	if (typeof value !== "string") {
		return value;
	}
	return scriptLocalizedToOriginal.get(scriptId)?.get(value)?.values().next().value
		?? localizedToOriginal.get(value)?.values().next().value
		?? value;
}

export function aliasFor(reference, actual, scriptId) {
	return equivalent(reference, actual, scriptId) ? actual : reference;
}

export function fragmentFor(reference, actual, scriptId) {
	if (typeof actual !== "string" || typeof reference !== "string") {
		return reference;
	}
	for (const candidate of allEquivalentValues(reference, scriptId)) {
		if (actual.includes(candidate)) {
			return candidate;
		}
	}
	return reference;
}

export function oneOf(actual, references, scriptId) {
	return references.some(reference => equivalent(actual, reference, scriptId));
}

export function replaceAlias(actual, search, replacement, scriptId) {
	if (typeof actual !== "string" || typeof search !== "string") {
		return actual;
	}
	const matched = Array.from(allEquivalentValues(search, scriptId)).find(candidate => actual.includes(candidate));
	if (!matched) {
		return actual.replace(search, replacement);
	}
	const originalSearch = original(search, scriptId);
	const translatedInput = matched !== originalSearch;
	const selectedReplacement = translatedInput ? localize(replacement, scriptId) : original(replacement, scriptId);
	return actual.replace(matched, selectedReplacement);
}

export function loreKey(value, scriptId) {
	if (typeof value !== "string") {
		return value;
	}
	for (const [key, configured] of Object.entries(game.wfrp4e?.config?.magicLores ?? {})) {
		const localized = game.i18n?.localize?.(configured) ?? configured;
		if ([key, configured, localized].some(candidate =>
			typeof candidate === "string"
			&& (equivalent(value, candidate, scriptId) || value.toLocaleLowerCase() === candidate.toLocaleLowerCase())
		)) {
			return key;
		}
	}
	return original(value, scriptId).toLocaleLowerCase();
}

export function loreMatches(value, key, scriptId) {
	return loreKey(value, scriptId) === key;
}

function staticTranslationPairs() {
	registerPair("SL", "PS");
	registerPair("SLs", "PS");
}

function prepareTranslationPairs(sourceScripts, translations) {
	for (const [id, source] of Object.entries(sourceScripts)) {
		const translation = translations[id];
		if (!translation) {
			continue;
		}
		const pairingSource = SOURCE_PATCHES[id]?.postTransplant ? source : applyPatchSet(id, source);
		transplantScriptLiterals(id, pairingSource, translation);
	}
}

export function resolveScript(id, source, translation, {polish = true} = {}) {
	const sourceHash = hashSource(source);
	const corrected = applyPatchSet(id, source, {sourceHash});
	if (!polish || !translation) {
		return applyBilingualTransforms(applyBehaviorPatches(id, corrected, {sourceHash, polish}), {id, polish});
	}
	const postTransplant = SOURCE_PATCHES[id]?.postTransplant;
	const transplantSource = postTransplant ? source : corrected;
	const transplanted = transplantScriptLiterals(id, transplantSource, translation);
	if (!transplanted.compatible) {
		console.warn(MODULE_ID + " | Translation skipped for script " + id + ": " + transplanted.reason);
	}
	if (transplanted.templateFallbacks.length) {
		console.warn(MODULE_ID + " | Original template retained in script " + id, transplanted.templateFallbacks);
	}
	const localized = postTransplant
		? applyPatchSet(id, transplanted.code, {sourceHash, fallback: corrected})
		: transplanted.code;
	const patched = applyBehaviorPatches(id, localized, {sourceHash, polish});
	return applyBilingualTransforms(patched, {id, polish});
}

export function installScriptCompatibility() {
	const ScriptClass = globalThis.warhammer?.apps?.WarhammerScript;
	const sourceScripts = game.wfrp4e?.config?.effectScripts;
	const translations = game.wfrp4eCorePl?.scriptTranslations;
	if (!ScriptClass || !sourceScripts || !translations || ScriptClass.prototype[PATCH_MARK]) {
		return false;
	}

	const originalDialog = ScriptClass.prototype.dialog;
	if (typeof originalDialog === "function") {
		ScriptClass.prototype.dialog = function(content, type = "confirm", config = {}) {
			const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
			if (typeof DialogV2?.[type] === "function") {
				return DialogV2[type](this.dialogConfig(content, config));
			}
			return originalDialog.call(this, content, type, config);
		};
	}

	staticTranslationPairs();
	prepareTranslationPairs(sourceScripts, translations);

	const originalHandleScriptId = ScriptClass.prototype._handleScriptId;
	ScriptClass.prototype._handleScriptId = function (reference) {
		const source = originalHandleScriptId.call(this, reference);
		const id = Array.from(String(reference).matchAll(/\[Script\.([a-zA-Z0-9]{16})\]/g))[0]?.[1];
		if (!id || source === reference) {
			return source;
		}

		const polish = game.i18n?.lang === "pl" || game.i18n?.lang?.startsWith("pl-");
		const translation = translations[id];
		const cacheKey = id + "\u0000" + polish + "\u0000" + source + "\u0000" + translation;
		if (!effectiveScriptCache.has(cacheKey)) {
			effectiveScriptCache.set(cacheKey, resolveScript(id, source, translation, {polish}));
		}
		return effectiveScriptCache.get(cacheKey);
	};

	Object.defineProperty(ScriptClass.prototype, PATCH_MARK, {value: true});
	game.wfrp4eCorePl.scripts = {
		aliasFor,
		display,
		equivalent,
		fragmentFor,
		hashSource,
		localize,
		loreKey,
		loreMatches,
		oneOf,
		original,
		registerPair,
		replaceAlias,
		resolve: (id, options = {}) => resolveScript(
			id,
			sourceScripts[id],
			translations[id],
			{polish: options.polish ?? true},
		),
	};
	return true;
}

if (globalThis.Hooks) {
	Hooks.once("init", installScriptCompatibility);
}
