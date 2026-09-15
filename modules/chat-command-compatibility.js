const MODULE_ID = "wfrp4e-core-pl";
const COMMAND_PATCH_MARK = Symbol.for(`${MODULE_ID}.chatCommandCompatibility`);
const COMMAND_ARGS_PATCH_MARK = Symbol.for(`${MODULE_ID}.chatCommandArgsCompatibility`);
const COMMAND_CALL_PATCH_MARK = Symbol.for(`${MODULE_ID}.chatCommandCallCompatibility`);
const MONEY_PATCH_MARK = Symbol.for(`${MODULE_ID}.moneyCommandCompatibility`);
const AVAILABILITY_PATCH_MARK = Symbol.for(`${MODULE_ID}.availabilityCompatibility`);

const COMMAND_DEFINITIONS = {
  table: {
    aliases: ["tabela", "tabelka"],
    description: "Rzut na tabelę (alias /table)",
    examples: "<br><span font-family:'monospaced'>/tabela critarm</span><br><span font-family:'monospaced'>/tabela mutatephys modyfikator=20 kolumna=khorne</span>",
  },
  pay: {
    aliases: ["płać", "plac", "zapłać", "zaplac"],
    description: "Żądanie opłaty lub opłacenie kosztu (alias /pay)",
    examples: "<br><span font-family:'monospaced'>/płać 12ss za=Pokój i wikt</span>",
  },
  credit: {
    aliases: ["kredyt", "wpłać", "wplac"],
    description: "Żądanie otrzymania pieniędzy / nagroda (alias /credit)",
    examples: "<br><span font-family:'monospaced'>/kredyt 100zk powód=Nagroda podział=3</span>",
  },
  char: {
    aliases: ["postać", "postac", "tworzenie"],
    description: "Rozpocznij tworzenie postaci (alias /char)",
  },
  cond: {
    aliases: ["stan", "warunek"],
    description: "Wyświetl opis stanu (alias /cond)",
    examples: "<br><span font-family:'monospaced'>/stan krwawienie</span>",
  },
  prop: {
    aliases: ["cecha", "zaleta", "wada"],
    description: "Wyświetl opis cechy, zalety lub wady (alias /prop)",
    examples: "<br><span font-family:'monospaced'>/cecha druzgocący</span>",
  },
  name: {
    aliases: ["imię", "imie"],
    description: "Wygeneruj imię (alias /name)",
    examples: "<br><span font-family:'monospaced'>/imię płeć=mężczyzna rasa=człowiek</span>",
  },
  avail: {
    aliases: ["dostępność", "dostepnosc", "dostępnosc", "dostepność"],
    description: "Wykonaj test dostępności (alias /avail)",
    examples: "<br><span font-family:'monospaced'>/dostępność Wioska Rzadki 10</span>",
  },
  corruption: {
    aliases: ["spaczenie", "korupcja", "zepsucie"],
    description: "Wykonaj test spaczenia (alias /corruption)",
    examples: "<br><span font-family:'monospaced'>/spaczenie siła=umiarkowane źródło=Rzeka</span>",
  },
  fear: {
    aliases: ["strach"],
    description: "Wykonaj test strachu (alias /fear)",
    examples: "<br><span font-family:'monospaced'>/strach 1 źródło=Nieumarły</span>",
  },
  terror: {
    aliases: ["groza"],
    description: "Wykonaj test grozy (alias /terror)",
    examples: "<br><span font-family:'monospaced'>/groza 2 źródło=Smok</span>",
  },
  exp: {
    aliases: ["pd", "doświadczenie", "doswiadczenie", "punkty"],
    description: "Przyznaj punkty doświadczenia (alias /exp)",
    examples: "<br><span font-family:'monospaced'>/pd 100 powód=Wygrana walka</span>",
  },
  travel: {
    aliases: ["podróż", "podroz"],
    description: "Kalkulator odległości podróży (alias /travel)",
    examples: "<br><span font-family:'monospaced'>/podróż Altdorf Middenheim</span>",
  },
  trade: {
    aliases: ["handel", "targuj"],
    description: "Otwórz okno handlu (alias /trade)",
  },
};

const COMMAND_ALIASES = {};
for (const [targetCmd, def] of Object.entries(COMMAND_DEFINITIONS)) {
  for (const alias of def.aliases) {
    COMMAND_ALIASES[alias.toLowerCase()] = targetCmd;
  }
}

const ARG_ALIASES = {
  modyfikator: "modifier",
  mod: "modifier",
  kolumna: "column",
  za: "for",
  dla: "for",
  cel: "target",
  gracz: "target",
  powód: "reason",
  powod: "reason",
  przyczyna: "reason",
  podział: "split",
  podzial: "split",
  tryb: "mode",
  umiejętność: "skill",
  umiejetnosc: "skill",
  źródło: "source",
  zrodlo: "source",
  rasa: "species",
  płeć: "gender",
  plec: "gender",
  siła: "strength",
  sila: "strength",
  poziom: "rating",
  od: "from",
  z: "from",
  do: "to",
  osada: "settlement",
  miejsce: "settlement",
  wielkość: "settlement",
  wielkosc: "settlement",
  rzadkość: "rarity",
  rzadkosc: "rarity",
};

const SPECIES_MAP = {
  człowiek: "human",
  czlowiek: "human",
  ludzie: "human",
  krasnolud: "dwarf",
  krasnoludy: "dwarf",
  "wysoki elf": "helf",
  "leśny elf": "welf",
  "lesny elf": "welf",
  elf: "helf",
  elfy: "helf",
  niziołek: "halfling",
  niziolek: "halfling",
  niziołki: "halfling",
  niziolki: "halfling",
};

const GENDER_MAP = {
  mężczyzna: "male",
  mezczyzna: "male",
  męski: "male",
  meski: "male",
  facet: "male",
  chłopak: "male",
  chlopak: "male",
  m: "male",
  male: "male",
  kobieta: "female",
  żeński: "female",
  zenski: "female",
  dziewczyna: "female",
  k: "female",
  female: "female",
};

function plainChatCommand(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/<br\s*\/?>/giu, " ")
    .replace(/<[^>]+>/gu, "")
    .replace(/&nbsp;|&#160;/giu, " ")
    .trim();
}

function normalizeMoneyInText(text) {
  if (typeof text !== "string") return text;
  return text.replace(/(\d+)\s*(zk|gc|ss|bp)\b/giu, (_match, amt, curr) => {
    const c = curr.toLowerCase() === "zk" ? "gc" : curr.toLowerCase();
    return amt + c;
  });
}

function normalizeNamedArgs(text) {
  if (typeof text !== "string") return text;
  let res = text;
  for (const [pl, en] of Object.entries(ARG_ALIASES)) {
    const reg = new RegExp(`(?<=^|\\s)${pl}=`, "giu");
    res = res.replace(reg, `${en}=`);
  }
  return res;
}

function normalizeNameText(text) {
  if (typeof text !== "string" || !text.trim()) return text;
  let normalized = normalizeNamedArgs(text);

  normalized = normalized.replace(/(?<=^|\s)gender=([^\s]+)/giu, (_m, val) => {
    const g = GENDER_MAP[val.toLowerCase()] || val;
    return `gender=${g}`;
  });
  normalized = normalized.replace(/(?<=^|\s)species=([^\s]+)/giu, (_m, val) => {
    const s = SPECIES_MAP[val.toLowerCase()] || val;
    return `species=${s}`;
  });

  const tokens = normalized.trim().split(/\s+/).filter(t => !t.includes("="));
  let gender = null;
  let species = null;

  for (const token of tokens) {
    const low = token.toLowerCase();
    if (!gender && GENDER_MAP[low]) gender = GENDER_MAP[low];
    else if (!species && SPECIES_MAP[low]) species = SPECIES_MAP[low];
  }

  if (gender || species) {
    let out = [];
    if (gender) out.push(gender);
    if (species) out.push(`species=${species}`);
    const namedArgs = normalized.match(/[a-zA-Z]+=[^\s]+/g) || [];
    for (const na of namedArgs) {
      if (!na.startsWith("gender=") && !na.startsWith("species=")) {
        out.push(na);
      }
    }
    return out.join(" ");
  }

  return normalized;
}

function normalizeCommandText(command, text) {
  if (typeof text !== "string") return text;
  let normalized = normalizeMoneyInText(text);
  normalized = normalizeNamedArgs(normalized);
  if (command === "name") {
    normalized = normalizeNameText(normalized);
  }
  return normalized;
}

function commandMatch(commands, text) {
  const normalized = plainChatCommand(text);
  const prefix = commands?.prefix ?? "/";
  if (!normalized.startsWith(prefix)) return null;
  const input = normalized.slice(prefix.length);
  const separator = input.search(/\s/u);
  const requested = (separator < 0 ? input : input.slice(0, separator)).trim();
  if (!requested) return null;

  const lower = requested.toLocaleLowerCase();
  const resolved = COMMAND_ALIASES[lower] || lower;

  const command = Object.keys(commands?.commands ?? {}).find(key => {
    const kLower = key.toLocaleLowerCase();
    return kLower === resolved || kLower === lower;
  });

  if (!command && !COMMAND_ALIASES[lower]) return null;

  return {
    0: normalized,
    groups: {
      command: COMMAND_ALIASES[lower] || command,
      args: separator < 0 ? "" : input.slice(separator).trim(),
    },
  };
}

function installCommandMatcher() {
  const commands = game.wfrp4e?.commands;
  if (!commands || commands[COMMAND_PATCH_MARK] || typeof commands.match !== "function") return false;
  const originalMatch = commands.match;
  commands.match = function(text) {
    return originalMatch.call(this, text) ?? commandMatch(this, text);
  };
  Object.defineProperty(commands, COMMAND_PATCH_MARK, { value: true });
  return true;
}

function installCommandCaller() {
  const commands = game.wfrp4e?.commands;
  if (!commands || commands[COMMAND_CALL_PATCH_MARK] || typeof commands.call !== "function") return false;
  const originalCall = commands.call;
  commands.call = function(command, text) {
    const lower = command?.toLocaleLowerCase();
    const resolved = COMMAND_ALIASES[lower] || command;
    const normalizedText = normalizeCommandText(resolved, text);
    return originalCall.call(this, resolved, normalizedText);
  };
  Object.defineProperty(commands, COMMAND_CALL_PATCH_MARK, { value: true });
  return true;
}

function installCommandAliases() {
  const commands = game.wfrp4e?.commands;
  if (!commands?.commands) return false;

  let installed = 0;
  for (const [targetKey, def] of Object.entries(COMMAND_DEFINITIONS)) {
    const baseCommand = commands.commands[targetKey];
    if (!baseCommand) continue;

    for (const alias of def.aliases) {
      if (!commands.commands[alias]) {
        commands.commands[alias] = {
          ...baseCommand,
          description: def.description || baseCommand.description,
          notes: def.notes || baseCommand.notes,
          examples: def.examples || baseCommand.examples,
          pattern: new RegExp(`^(?:<.+?>)*${commands.prefix || "/"}(?<command>${alias})\\s?(?<args>.+?)?(?:<\\/.+>)*$`, "iu"),
        };
        installed++;
      }
    }
  }
  return installed > 0;
}

function normalizeMoneyAbbreviations(value) {
  if (typeof value !== "string") return value;
  const abbreviations = {
    gc: game.i18n.localize("MARKET.Abbrev.GC"),
    zk: game.i18n.localize("MARKET.Abbrev.GC"),
    ss: game.i18n.localize("MARKET.Abbrev.SS"),
    bp: game.i18n.localize("MARKET.Abbrev.BP"),
  };
  return value.replace(/(\d+)\s*(gc|zk|ss|bp)/giu, (_match, amount, abbreviation) =>
    amount + abbreviations[abbreviation.toLocaleLowerCase()]
  );
}

function installMoneyParser() {
  const Market = game.wfrp4e?.market;
  if (!Market || Market[MONEY_PATCH_MARK] || typeof Market.parseMoneyTransactionString !== "function") return false;
  const originalParser = Market.parseMoneyTransactionString;
  Market.parseMoneyTransactionString = function(value) {
    if (typeof value !== "string") return false;
    const normalized = normalizeMoneyAbbreviations(value);
    return originalParser.call(this, normalized) || originalParser.call(this, value);
  };
  Object.defineProperty(Market, MONEY_PATCH_MARK, { value: true });
  return true;
}

const SETTLEMENT_MAP = {
  wioska: "MARKET.Village",
  wioski: "MARKET.Village",
  wiosce: "MARKET.Village",
  wies: "MARKET.Village",
  wieś: "MARKET.Village",
  miasteczko: "MARKET.Town",
  miasteczka: "MARKET.Town",
  miasteczku: "MARKET.Town",
  miasto: "MARKET.City",
  miasta: "MARKET.City",
  mieście: "MARKET.City",
  miescie: "MARKET.City",
  village: "MARKET.Village",
  town: "MARKET.Town",
  city: "MARKET.City",
  "market.village": "MARKET.Village",
  "market.town": "MARKET.Town",
  "market.city": "MARKET.City",
};

const RARITY_MAP = {
  powszechny: "WFRP4E.Availability.Common",
  powszechna: "WFRP4E.Availability.Common",
  powszechne: "WFRP4E.Availability.Common",
  powszechy: "WFRP4E.Availability.Common",
  niepowszechny: "WFRP4E.Availability.Scarce",
  niepowszechna: "WFRP4E.Availability.Scarce",
  niepowszechne: "WFRP4E.Availability.Scarce",
  niepowszechy: "WFRP4E.Availability.Scarce",
  ograniczony: "WFRP4E.Availability.Scarce",
  ograniczona: "WFRP4E.Availability.Scarce",
  ograniczone: "WFRP4E.Availability.Scarce",
  rzadki: "WFRP4E.Availability.Rare",
  rzadka: "WFRP4E.Availability.Rare",
  rzadkie: "WFRP4E.Availability.Rare",
  egzotyczny: "WFRP4E.Availability.Exotic",
  egzotyczna: "WFRP4E.Availability.Exotic",
  egzotyczne: "WFRP4E.Availability.Exotic",
  common: "WFRP4E.Availability.Common",
  scarce: "WFRP4E.Availability.Scarce",
  rare: "WFRP4E.Availability.Rare",
  exotic: "WFRP4E.Availability.Exotic",
  "wfrp4e.availability.common": "WFRP4E.Availability.Common",
  "wfrp4e.availability.scarce": "WFRP4E.Availability.Scarce",
  "wfrp4e.availability.rare": "WFRP4E.Availability.Rare",
  "wfrp4e.availability.exotic": "WFRP4E.Availability.Exotic",
};

function parseAvailArgs(text) {
  if (typeof text !== "string") return [null, null, 0];
  const trimmed = text.trim();
  if (!trimmed) return [null, null, 0];

  let settlement = null;
  let rarity = null;
  let modifier = 0;

  // 1. Check for named arguments: size=..., settlement=..., osada=..., miejsce=...
  const sizeMatch = trimmed.match(/\b(?:size|settlement|osada|miejsce)\s*=\s*([^\s]+)/i);
  if (sizeMatch) settlement = sizeMatch[1];

  const rarityMatch = trimmed.match(/\b(?:rarity|rzadkosc|rzadkość|dostepnosc|dostępność)\s*=\s*([^\s]+)/i);
  if (rarityMatch) rarity = rarityMatch[1];

  const modMatch = trimmed.match(/\b(?:modifier|mod|modyfikator)\s*=\s*([+-]?\d+)/i);
  if (modMatch) modifier = parseInt(modMatch[1], 10) || 0;

  // Remove named arguments to parse remaining positional tokens
  let remainingText = trimmed
    .replace(/\b(?:size|settlement|osada|miejsce)\s*=\s*[^\s]+/gi, "")
    .replace(/\b(?:rarity|rzadkosc|rzadkość|dostepnosc|dostępność)\s*=\s*[^\s]+/gi, "")
    .replace(/\b(?:modifier|mod|modyfikator)\s*=\s*[+-]?\d+/gi, "")
    .trim();

  const tokens = remainingText.split(/\s+/).filter(Boolean);

  for (const token of tokens) {
    if (/^[+-]?\d+$/.test(token)) {
      if (modifier === 0) modifier = parseInt(token, 10) || 0;
      continue;
    }
    const norm = token.toLowerCase();
    if (!settlement && SETTLEMENT_MAP[norm]) {
      settlement = token;
      continue;
    }
    if (!rarity && RARITY_MAP[norm]) {
      rarity = token;
      continue;
    }
  }

  // Fallback: positional order if not matched by dictionary
  const nonNumTokens = tokens.filter(t => !/^[+-]?\d+$/.test(t));
  if ((!settlement || !rarity) && nonNumTokens.length >= 2) {
    if (!settlement) settlement = nonNumTokens[0];
    if (!rarity) rarity = nonNumTokens[1];
  } else if (!rarity && nonNumTokens.length === 1 && !settlement) {
    rarity = nonNumTokens[0];
  }

  return [rarity, settlement, modifier];
}

function resolveSettlementAndRarity(settlementInput, rarityInput) {
  let sKey = SETTLEMENT_MAP[String(settlementInput || "").trim().toLowerCase()];
  let rKey = RARITY_MAP[String(rarityInput || "").trim().toLowerCase()];

  if (!sKey || !rKey) {
    const swappedS = SETTLEMENT_MAP[String(rarityInput || "").trim().toLowerCase()];
    const swappedR = RARITY_MAP[String(settlementInput || "").trim().toLowerCase()];
    if (swappedS && swappedR) {
      sKey = swappedS;
      rKey = swappedR;
    } else if (!sKey && swappedS) {
      sKey = swappedS;
      rKey = RARITY_MAP[String(settlementInput || "").trim().toLowerCase()] || rKey;
    } else if (!rKey && swappedR) {
      rKey = swappedR;
      sKey = SETTLEMENT_MAP[String(rarityInput || "").trim().toLowerCase()] || sKey;
    }
  }

  return { sKey, rKey };
}

function installCommandArgParser() {
  const commands = game.wfrp4e?.commands;
  if (!commands || commands[COMMAND_ARGS_PATCH_MARK] || typeof commands.parseArgs !== "function") return false;
  const originalParseArgs = commands.parseArgs;

  commands.parseArgs = function(command, text) {
    const lower = command?.toLocaleLowerCase();
    const resolved = COMMAND_ALIASES[lower] || command;
    const normalizedText = normalizeCommandText(resolved, text);

    if (resolved === "avail") {
      return parseAvailArgs(normalizedText);
    }

    if (resolved === "travel" && normalizedText && !normalizedText.includes("from=") && !normalizedText.includes("to=")) {
      const tokens = normalizedText.trim().split(/\s+/).filter(Boolean);
      if (tokens.length >= 2) {
        return [tokens[0], tokens.slice(1).join(" ")];
      }
    }

    if ((resolved === "fear" || resolved === "terror") && normalizedText && !normalizedText.includes("source=")) {
      const tokens = normalizedText.trim().split(/\s+/).filter(Boolean);
      if (tokens.length >= 2 && /^\d+$/.test(tokens[0])) {
        return [tokens[0], tokens.slice(1).join(" ")];
      }
    }

    if (resolved === "exp" && normalizedText && !normalizedText.includes("reason=")) {
      const tokens = normalizedText.trim().split(/\s+/).filter(Boolean);
      if (tokens.length >= 2 && /^\d+$/.test(tokens[0])) {
        return [tokens[0], tokens.slice(1).join(" ")];
      }
    }

    return originalParseArgs.call(this, resolved, normalizedText);
  };
  Object.defineProperty(commands, COMMAND_ARGS_PATCH_MARK, { value: true });
  return true;
}

function installAvailabilityParser() {
  const Market = game.wfrp4e?.market;
  if (!Market || Market[AVAILABILITY_PATCH_MARK] || typeof Market.testForAvailability !== "function") return false;
  const originalTest = Market.testForAvailability;

  Market.testForAvailability = async function({ settlement, rarity, modifier = 0, name } = {}) {
    // If settlement or rarity was passed as a combined string (e.g. from an unparsed positional call)
    if ((!settlement || !rarity) && (typeof settlement === "string" && settlement.includes(" ") || typeof rarity === "string" && rarity.includes(" "))) {
      const fullText = (typeof settlement === "string" && settlement.includes(" ")) ? settlement : rarity;
      const [parsedR, parsedS, parsedM] = parseAvailArgs(fullText);
      if (parsedS && parsedR) {
        settlement = parsedS;
        rarity = parsedR;
        if (parsedM !== 0 && (!modifier || modifier === 0)) {
          modifier = parsedM;
        }
      }
    }

    const { sKey, rKey } = resolveSettlementAndRarity(settlement, rarity);
    if (sKey && rKey) {
      const table = game.wfrp4e?.config?.availabilityTable;
      if (table && table[sKey]?.[rKey]) {
        let roll = await new Roll("1d100 - @modifier", { modifier: Number(modifier) || 0 }).roll();
        let availabilityLookup = table[sKey][rKey];
        let isAvailable = availabilityLookup.test > 0 && roll.total <= availabilityLookup.test;

        let finalResult = {
          settlement: game.i18n.localize(sKey),
          rarity: game.i18n.localize(rKey),
          instock: isAvailable ? game.i18n.localize("Yes") : game.i18n.localize("No"),
          quantity: isAvailable ? availabilityLookup.stock : 0,
          roll: roll.total
        };

        if (typeof availabilityLookup.stock === "string" && availabilityLookup.stock.includes("d")) {
          let stockRoll = await new Roll(availabilityLookup.stock).roll({ allowInteractive: false });
          finalResult.quantity = stockRoll.total;
        }

        let msg = `<h3><b>${game.i18n.localize("MARKET.AvailabilityTest")}</b></h3>`;
        msg += Market.formatTestForChat(finalResult);
        return ChatMessage.create(game.wfrp4e.utility.chatDataSetup(msg, "roll", true, { flavor: name }));
      }
    }
    return originalTest.call(this, { settlement, rarity, modifier, name });
  };
  Object.defineProperty(Market, AVAILABILITY_PATCH_MARK, { value: true });
  return true;
}

export function installChatCommandCompatibility() {
  return {
    commands: installCommandMatcher(),
    commandArgs: installCommandArgParser(),
    commandAliases: installCommandAliases(),
    commandCaller: installCommandCaller(),
    money: installMoneyParser(),
    availability: installAvailabilityParser(),
  };
}

if (globalThis.Hooks) {
  Hooks.once("init", () => queueMicrotask(installChatCommandCompatibility));
  Hooks.once("ready", installChatCommandCompatibility);
}

export {
  commandMatch,
  normalizeMoneyAbbreviations,
  normalizeCommandText,
  plainChatCommand,
  resolveSettlementAndRarity,
  parseAvailArgs,
  SETTLEMENT_MAP,
  RARITY_MAP,
  COMMAND_ALIASES,
  COMMAND_DEFINITIONS,
  ARG_ALIASES,
};
