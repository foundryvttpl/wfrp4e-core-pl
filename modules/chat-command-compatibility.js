const MODULE_ID = "wfrp4e-core-pl";
const COMMAND_PATCH_MARK = Symbol.for(`${MODULE_ID}.chatCommandCompatibility`);
const MONEY_PATCH_MARK = Symbol.for(`${MODULE_ID}.moneyCommandCompatibility`);

function plainChatCommand(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/<br\s*\/?>/giu, " ")
    .replace(/<[^>]+>/gu, "")
    .replace(/&nbsp;|&#160;/giu, " ")
    .trim();
}

function commandMatch(commands, text) {
  const normalized = plainChatCommand(text);
  const prefix = commands?.prefix ?? "/";
  if (!normalized.startsWith(prefix)) return null;
  const input = normalized.slice(prefix.length);
  const separator = input.search(/\s/u);
  const requested = (separator < 0 ? input : input.slice(0, separator)).trim();
  if (!requested) return null;
  const command = Object.keys(commands?.commands ?? {}).find(key =>
    key.toLocaleLowerCase() === requested.toLocaleLowerCase()
  );
  if (!command) return null;
  return {
    0: normalized,
    groups: {
      command,
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

export function installChatCommandCompatibility() {
  return {
    commands: installCommandMatcher(),
    money: installMoneyParser(),
  };
}

if (globalThis.Hooks) {
  Hooks.once("init", () => queueMicrotask(installChatCommandCompatibility));
  Hooks.once("ready", installChatCommandCompatibility);
}

export { commandMatch, normalizeMoneyAbbreviations, plainChatCommand };
