// Polish spell data with a non-Polish interface: the system only recognises characteristic
// bonuses in the interface language, so "Bonus SW+7" would reach eval() unresolved.
// The Polish interface needs nothing here, and stored values stay untouched.
const PATCH_MARK = Symbol.for("wfrp4e-core-pl.spellDamageCompatibility");
const BONUS_KEYS = Object.freeze({ ww: "ws", us: "bs", s: "s", wt: "t", i: "i", zw: "ag", zr: "dex", int: "int", sw: "wp", ogd: "fel" });
const POLISH_BONUS = new RegExp(`bonus\\s+(${Object.keys(BONUS_KEYS).join("|")})(?![\\p{L}\\p{N}])`, "giu");

export function resolvePolishBonuses(formula, characteristics) {
  if (typeof formula !== "string" || !characteristics) return formula;
  return formula.replace(POLISH_BONUS, (match, label) => characteristics[BONUS_KEYS[label.toLowerCase()]]?.bonus ?? match);
}

export function installSpellDamageCompatibility() {
  let prototype = CONFIG.Item?.dataModels?.spell?.prototype;
  while (prototype && !Object.hasOwn(prototype, "computeSpellDamage")) prototype = Object.getPrototypeOf(prototype);
  if (!prototype || prototype[PATCH_MARK]) return false;

  const original = prototype.computeSpellDamage;
  prototype.computeSpellDamage = function(formula, options) {
    if (game.i18n.lang === "pl") return original.call(this, formula, options);
    const actor = options?.actor ?? this.parent?.actor;
    return original.call(this, resolvePolishBonuses(formula, actor?.system?.characteristics), options);
  };
  Object.defineProperty(prototype, PATCH_MARK, { value: true });
  return true;
}

// "init": Foundry przygotowuje aktorów i liczy obrażenia czarów jeszcze przed hookiem "setup".
if (globalThis.Hooks) Hooks.once("init", installSpellDamageCompatibility);
