const MODULE_ID = "wfrp4e-core-pl";
const INCOME_PATCH_MARK = Symbol.for(`${MODULE_ID}.incomeCompatibility`);
const MARKET_PATCH_MARK = Symbol.for(`${MODULE_ID}.incomeMarketPatch`);
const MARKET_ROLL_INCOME_PATCH_MARK = Symbol.for(`${MODULE_ID}.incomeMarketRollIncomePatch`);
const TAH_PATCH_MARK = Symbol.for(`${MODULE_ID}.incomeTahPatch`);
const SHEET_PATCH_MARK = Symbol.for(`${MODULE_ID}.incomeSheetPatch`);
const CAREER_PATCH_MARK = Symbol.for(`${MODULE_ID}.incomeCareerPatch`);

/**
 * Pomocnik poprawnej polskiej deklinacji waluty w Warhammerze
 * 1 pens / 2-4 pensy / 5-21 pensów
 * 1 szyling / 2-4 szylingi / 5 szylingów
 * 1 korona / 2-4 korony / 5 koron
 */
export function formatCurrencyPL(amt, tier) {
  const n = typeof amt === "string" ? parseFloat(amt) : amt;
  if (isNaN(n)) return `${amt}`;
  const rounded = tier === "b" ? Math.ceil(n) : n;

  function getPlural(val, one, few, many) {
    const v = Math.abs(Math.round(val));
    if (v === 1) return one;
    const rem10 = v % 10;
    const rem100 = v % 100;
    if (rem10 >= 2 && rem10 <= 4 && !(rem100 >= 12 && rem100 <= 14)) return few;
    return many;
  }

  switch (tier) {
    case "b":
      return `${rounded} ${getPlural(rounded, "brązowy pens", "brązowe pensy", "brązowych pensów")}`;
    case "s":
      return `${rounded} ${getPlural(rounded, "srebrny szyling", "srebrne szylingi", "srebrnych szylingów")}`;
    case "g":
      return `${rounded} ${getPlural(rounded, "złota korona", "złote korony", "złotych koron")}`;
    default:
      return `${rounded}${tier}`;
  }
}

/**
 * Bezpieczne dodawanie monet do postaci.
 * Wyszukuje monety po wartości (coinValue) oraz po nazwach PL/EN.
 * Jeśli postać nie ma danego typu monety, tworzy ją w ekwipunku.
 * Porażka rzutu (amt <= 0) nigdy nie zeruje oszczędności postaci!
 */
export async function safeAddMoneyTo(actor, moneyString, { suppressNotification = false } = {}) {
  if (!actor || !moneyString || typeof moneyString !== "string") return false;

  const type = moneyString.slice(-1).toLowerCase();
  const rawAmt = moneyString.slice(0, -1);
  let amt = parseFloat(rawAmt);

  if (isNaN(amt) || amt <= 0) {
    // 0 zarobku (porażka) - nie modyfikujemy istniejącego majątku!
    return false;
  }

  let halfS = false;
  let halfG = false;

  if (type === "b") {
    // Pensy zaokrąglamy w górę (np. 12.5 -> 13)
    amt = Math.ceil(amt);
  } else if (type === "s") {
    if (rawAmt.includes(".")) halfS = true;
    amt = Math.floor(amt);
  } else if (type === "g") {
    if (rawAmt.includes(".")) halfG = true;
    amt = Math.floor(amt);
  }

  const coinConfigs = {
    b: {
      coinValue: 1,
      namePL: game.i18n?.localize("NAME.BP") || "Brązowy Pens",
      altNames: ["brązowy pens", "brązowe pensy", "brązowych pensów", "brass penny", "brass pennies"],
    },
    s: {
      coinValue: 12,
      namePL: game.i18n?.localize("NAME.SS") || "Srebrny Szyling",
      altNames: ["srebrny szyling", "srebrne szylingi", "srebrnych szylingów", "silver shilling", "silver shillings"],
    },
    g: {
      coinValue: 240,
      namePL: game.i18n?.localize("NAME.GC") || "Złota Korona",
      altNames: ["złota korona", "złote korony", "złotych koron", "gold crown", "gold crowns"],
    },
  };

  const mainCfg = coinConfigs[type];
  if (!mainCfg) return false;

  function findCoinItem(cfg) {
    const moneyItems = (actor.items || []).filter(i => i.type === "money");
    // Dopasowanie po wartości numerycznej monety
    let match = moneyItems.find(i => i.system?.coinValue?.value === cfg.coinValue);
    if (match) return match;
    // Dopasowanie po nazwie (polskiej lub angielskiej)
    return moneyItems.find(i => {
      const nm = (i.name || "").toLowerCase().trim();
      return nm === cfg.namePL.toLowerCase().trim() || cfg.altNames.includes(nm);
    });
  }

  const updates = [];
  const creates = [];

  // 1. Główna moneta
  if (amt > 0) {
    const existing = findCoinItem(mainCfg);
    if (existing) {
      const currentVal = Number(existing.system?.quantity?.value) || 0;
      updates.push({ _id: existing.id, "system.quantity.value": currentVal + amt });
    } else {
      let compendiumItem = await game.wfrp4e?.utility?.find?.(mainCfg.namePL, "money");
      let itemData = compendiumItem?.toObject ? compendiumItem.toObject() : null;
      if (itemData) {
        itemData.system.quantity.value = amt;
      } else {
        itemData = {
          name: mainCfg.namePL,
          type: "money",
          img: "modules/wfrp4e-core/icons/blank.png",
          system: {
            coinValue: { value: mainCfg.coinValue },
            quantity: { value: amt },
            encumbrance: { value: 0.005 },
          },
        };
      }
      creates.push(itemData);
    }
  }

  // 2. Połówki (połowa szylinga = 6 pensów, połowa korony = 10 szylingów)
  if (halfS) {
    const existingBP = findCoinItem(coinConfigs.b);
    if (existingBP) {
      const currentVal = Number(existingBP.system?.quantity?.value) || 0;
      updates.push({ _id: existingBP.id, "system.quantity.value": currentVal + 6 });
    } else {
      let compendiumItem = await game.wfrp4e?.utility?.find?.(coinConfigs.b.namePL, "money");
      let itemData = compendiumItem?.toObject ? compendiumItem.toObject() : null;
      if (itemData) {
        itemData.system.quantity.value = 6;
      } else {
        itemData = {
          name: coinConfigs.b.namePL,
          type: "money",
          img: "modules/wfrp4e-core/icons/blank.png",
          system: {
            coinValue: { value: 1 },
            quantity: { value: 6 },
            encumbrance: { value: 0.005 },
          },
        };
      }
      creates.push(itemData);
    }
  }

  if (halfG) {
    const existingSS = findCoinItem(coinConfigs.s);
    if (existingSS) {
      const currentVal = Number(existingSS.system?.quantity?.value) || 0;
      updates.push({ _id: existingSS.id, "system.quantity.value": currentVal + 10 });
    } else {
      let compendiumItem = await game.wfrp4e?.utility?.find?.(coinConfigs.s.namePL, "money");
      let itemData = compendiumItem?.toObject ? compendiumItem.toObject() : null;
      if (itemData) {
        itemData.system.quantity.value = 10;
      } else {
        itemData = {
          name: coinConfigs.s.namePL,
          type: "money",
          img: "modules/wfrp4e-core/icons/blank.png",
          system: {
            coinValue: { value: 12 },
            quantity: { value: 10 },
            encumbrance: { value: 0.005 },
          },
        };
      }
      creates.push(itemData);
    }
  }

  if (updates.length > 0) {
    await actor.updateEmbeddedDocuments("Item", updates);
  }
  if (creates.length > 0) {
    await actor.createEmbeddedDocuments("Item", creates);
  }

  // Odtworzenie dźwięku monet
  try {
    if (game.wfrp4e?.audio?.PlayContextAudio) {
      game.wfrp4e.audio.PlayContextAudio({ item: { type: "money" }, action: "gain" });
    }
  } catch (_e) {}

  if (!suppressNotification) {
    const formatted = formatCurrencyPL(amt, type);
    ui.notifications?.info(`${actor.name}: dodano ${formatted} do majątku.`);
  }

  return true;
}

/**
 * Rejestr 12 rodzin umiejętności WFRP4e ze wzorcami PL/EN.
 * Pozwala rozpoznać ogólne umiejętności dochodu takie jak "Rzemiosło (Dowolne)", "Trade (Any)",
 * "Wiedza (Dowolna)", "Broń Biała (Dowolna)", "Sztuka (Dowolna)", "Występy (Dowolne)" itp.
 */
const SKILL_GROUP_MAP = [
  { basePL: "Rzemiosło", baseEN: "Trade", patterns: [/rzemios[łl]o/i, /\btrade\b/i] },
  { basePL: "Broń Biała", baseEN: "Melee", patterns: [/bro[ńn]\s+bia[łl]a/i, /\bmelee\b/i] },
  { basePL: "Wiedza", baseEN: "Lore", patterns: [/wiedza/i, /\blore\b/i] },
  { basePL: "Występy", baseEN: "Entertain", patterns: [/wyst[ęe]p/i, /\bentertain\b/i, /kuglarstwo/i] },
  { basePL: "Sztuka", baseEN: "Art", patterns: [/sztuka(?!\s+przetrwania)/i, /\bart\b/i] },
  { basePL: "Skradanie", baseEN: "Stealth", patterns: [/skradanie/i, /\bstealth\b/i] },
  { basePL: "Język", baseEN: "Language", patterns: [/j[ęe]zyk/i, /\blanguage\b/i] },
  { basePL: "Muzyka", baseEN: "Play", patterns: [/muzyka/i, /\bplay\b/i] },
  { basePL: "Broń Zasięgowa", baseEN: "Ranged", patterns: [/bro[ńn]\s+zasi[ęe]gowa/i, /\branged\b/i] },
  { basePL: "Jeździectwo", baseEN: "Ride", patterns: [/je[źz]dziectwo/i, /\bride\b/i] },
  { basePL: "Powożenie", baseEN: "Drive", patterns: [/powo[żz]enie/i, /\bdrive\b/i] },
  { basePL: "Żeglarstwo", baseEN: "Sail", patterns: [/żeglarstwo/i, /zeglarstwo/i, /\bsail\b/i] },
];

/**
 * Słownik dwukierunkowych aliasów umiejętności PL <-> EN dla umiejętności dochodu
 */
const SKILL_ALIASES = {
  "haggle": "targowanie",
  "targowanie": "haggle",
  "intimidate": "zastraszanie",
  "zastraszanie": "intimidate",
  "perception": "percepcja",
  "percepcja": "perception",
  "endurance": "odporność",
  "odporność": "endurance",
  "charm": "charyzma",
  "charyzma": "charm",
  "gossip": "plotkowanie",
  "plotkowanie": "gossip",
  "leadership": "dowodzenie",
  "dowodzenie": "leadership",
  "pray": "modlitwa",
  "modlitwa": "pray",
  "heal": "leczenie",
  "leczenie": "heal",
  "intuition": "intuicja",
  "intuicja": "intuition",
  "outdoor survival": "sztuka przetrwania",
  "sztuka przetrwania": "outdoor survival",
  "evaluate": "wycena",
  "wycena": "evaluate",
  "drive": "powożenie",
  "powożenie": "drive",
  "sail": "żeglarstwo",
  "żeglarstwo": "sail",
  "gamble": "hazard",
  "hazard": "gamble",
  "research": "badania naukowe",
  "badania naukowe": "research",
  "language (magick)": "język (magiczny)",
  "język (magiczny)": "language (magick)",
  "melee (basic)": "broń biała (podstawowa)",
  "broń biała (podstawowa)": "melee (basic)",
  "stealth (urban)": "skradanie (miasto)",
  "skradanie (miasto)": "stealth (urban)",
  "stealth (rural)": "skradanie (wieś)",
  "skradanie (wieś)": "stealth (rural)",
};

/**
 * Rozwiązuje listę pasujących umiejętności dochodu z karty postaci dla danej profesji.
 * Obsługuje:
 * - Pełne dopasowanie po nazwie (PL i EN)
 * - Umiejętności ogólne z dopiskiem (Dowolne) / (Any) / (Wieś lub Miasto) itp.
 * - Mapowanie rodzin umiejętności (np. Rzemiosło (Cieśla) dla Rzemiosło (Dowolne))
 * - Słownik aliasów językowych PL <-> EN
 * - Awaryjne dopasowanie specjalizacji w ramach tej samej rodziny
 */
export function resolveEarningSkills(actor, career) {
  if (!actor || !career) return [];

  const actorSkills = actor.itemTypes?.skill || (actor.items || []).filter(i => i.type === "skill");

  // Pobranie nazw umiejętności dochodu z profesji
  const incomeIndices = career.system?.incomeSkill || career.incomeSkill || [];
  const careerSkills = career.system?.skills || career.skills || [];
  let rawNames = incomeIndices.map(i => careerSkills[i]).filter(Boolean);

  if (rawNames.length === 0 && Array.isArray(career.earningSkills)) {
    rawNames = career.earningSkills;
  }
  if (rawNames.length === 0 && Array.isArray(career.system?.earningSkills)) {
    rawNames = career.system.earningSkills;
  }

  // Awaryjne wykrycie typowych umiejętności zarobkowych z listy umiejętności profesji
  if (rawNames.length === 0 && careerSkills.length > 0) {
    for (const cs of careerSkills) {
      if (typeof cs === "string" && SKILL_GROUP_MAP.some(g => g.patterns.some(p => p.test(cs)))) {
        rawNames.push(cs);
      }
    }
  }

  const matched = [];

  for (const rawName of rawNames) {
    if (typeof rawName !== "string" || !rawName.trim()) continue;
    const trimmed = rawName.trim();
    const lower = trimmed.toLowerCase();
    const isGeneric = /(dowoln|wybran|any|rural or urban|wie[sś] lub miasto)/i.test(lower);

    // 1. Grupa z ogólną specjalizacją (np. Rzemiosło (Dowolne), Broń Biała (Dowolna))
    const group = SKILL_GROUP_MAP.find(g => g.patterns.some(p => p.test(trimmed)));
    if (group && isGeneric) {
      const groupSkills = actorSkills.filter(sk => group.patterns.some(p => p.test(sk.name)));
      matched.push(...groupSkills);
      continue;
    }

    // 2. Dokładne dopasowanie nazwy
    const exact = actorSkills.find(sk => (sk.name || "").trim().toLowerCase() === lower);
    if (exact) {
      matched.push(exact);
      continue;
    }

    // 3. Dopasowanie aliasu PL <-> EN
    const alias = SKILL_ALIASES[lower];
    if (alias) {
      const aliasMatch = actorSkills.find(sk => (sk.name || "").trim().toLowerCase() === alias);
      if (aliasMatch) {
        matched.push(aliasMatch);
        continue;
      }
    }

    // 4. Awaryjne dopasowanie grupy, jeśli postać posiada inną specjalizację tej rodziny
    if (group) {
      const fallbackGroupSkills = actorSkills.filter(sk => group.patterns.some(p => p.test(sk.name)));
      if (fallbackGroupSkills.length > 0) {
        matched.push(...fallbackGroupSkills);
        continue;
      }
    }
  }

  // Usuwanie duplikatów
  const unique = [];
  const seenIds = new Set();
  for (const sk of matched) {
    const key = sk.id || sk._id || sk.name;
    if (!seenIds.has(key)) {
      seenIds.add(key);
      unique.push(sk);
    }
  }

  return unique;
}

/**
 * Bezpiecznie oblicza status postaci (poziom: "b"|"s"|"g" oraz szczebel: liczba całkowita >= 0).
 * Zapobiega krytycznemu błędowi WFRP4e "NaNd10", który pojawia się, gdy status postaci
 * ma wartość numeryczną 0 z modelu NumberField.
 */
export function resolveIncomeStatus(actor, career) {
  let tier = null;
  let standing = null;

  // 1. Status z profesji
  if (career) {
    const cStatus = career.system?.status || career.status;
    if (cStatus && typeof cStatus.tier === "string" && ["b", "s", "g"].includes(cStatus.tier.toLowerCase())) {
      tier = cStatus.tier.toLowerCase();
      standing = parseInt(cStatus.standing, 10);
    }
  }

  // 2. Parsowanie ze stringa statusu na karcie (np. "Srebro 3", "Brass 2", "Złoto 1")
  const actorStatus = actor?.system?.details?.status;
  if (actorStatus?.value && typeof actorStatus.value === "string") {
    const parts = actorStatus.value.trim().split(/\s+/);
    if (parts.length >= 2) {
      const tierWord = parts[0].toLowerCase();
      const num = parseInt(parts[1], 10);
      if (!isNaN(num)) {
        if (/br[aą]z|brass/i.test(tierWord)) {
          tier = "b";
          standing = num;
        } else if (/srebr|silver/i.test(tierWord)) {
          tier = "s";
          standing = num;
        } else if (/z[łl]ot|gold/i.test(tierWord)) {
          tier = "g";
          standing = num;
        }
      }
    }
  }

  // 3. Fallback do jawnych pól postaci, jeśli tier jest prawidłowym symbolem
  if (!tier && typeof actorStatus?.tier === "string" && ["b", "s", "g"].includes(actorStatus.tier.toLowerCase())) {
    tier = actorStatus.tier.toLowerCase();
    const num = parseInt(actorStatus.standing, 10);
    if (!isNaN(num)) standing = num;
  }

  // 4. Modifikator statusu, jeśli dostępny
  if (actor?.system?._applyStatusModifier && tier && standing !== null) {
    try {
      const modified = actor.system._applyStatusModifier({ standing, tier });
      if (modified?.tier && modified?.standing !== undefined) {
        tier = modified.tier;
        standing = modified.standing;
      }
    } catch (_e) {}
  }

  // 5. Gwarantowane wartości domyślne (nigdy NaN / undefined / invalid)
  if (!tier || !["b", "s", "g"].includes(tier)) tier = "b";
  if (standing === null || isNaN(standing) || standing < 0) standing = 1;

  return { tier, standing };
}

/**
 * Główna uniwersalna metoda wykonująca rzut na dochód dla wskazanego aktora.
 * Używana zarówno przez kartę postaci, makra, jak i pasek Token Action HUD.
 */
export async function rollIncomeForActor(actor, { career = null, event = null, testOptions = {} } = {}) {
  if (!actor) {
    console.warn("wfrp4e-core-pl | rollIncomeForActor: brak wskazanego aktora.");
    return null;
  }

  // 1. Znalezienie aktywnej profesji
  if (!career) {
    career = actor.currentCareer ||
             actor.system?.details?.career ||
             actor.itemTypes?.career?.find(c => c.system?.current?.value) ||
             actor.system?.career?.path?.document ||
             actor.itemTypes?.careerPath?.[0];
  }

  if (!career) {
    ui.notifications?.warn(game.i18n?.localize("SHEET.NoCurrentCareer") || "Postać nie ma zaznaczonej aktywnej profesji.");
    return null;
  }

  // 2. Weryfikacja wymaganego wyposażenia
  if (career.system?.requiredTrappingStatus?.length && career.system.requiredTrappingStatus.some(t => !t.owned)) {
    ui.notifications?.error(game.i18n?.localize("SHEET.RequiredTrappingsError") || "Nie posiadasz wymaganego wyposażenia profesji!");
    return null;
  }

  // 3. Rozpoznanie umiejętności dochodu
  const skills = resolveEarningSkills(actor, career);
  if (!skills || skills.length === 0) {
    const careerSkills = career.system?.skills || [];
    const incomeIndices = career.system?.incomeSkill || [];
    let expected = incomeIndices.map(i => careerSkills[i]).filter(Boolean).join(", ");
    if (!expected && Array.isArray(career.earningSkills)) expected = career.earningSkills.join(", ");
    if (!expected) expected = career.name;
    ui.notifications?.warn(
      `Postać nie posiada na karcie wymaganej umiejętności dochodu dla profesji "${career.name}" (oczekiwano: ${expected}).`
    );
    return null;
  }

  // 4. Wybór pojedynczej umiejętności (z bezpiecznym dialogiem wyboru przy wielu opcjach)
  let skill = null;
  if (skills.length === 1) {
    skill = skills[0];
  } else {
    const ItemDialogClass = globalThis.ItemDialog || warhammer?.apps?.ItemDialog || game.wfrp4e?.apps?.ItemDialog;
    if (ItemDialogClass?.create) {
      const title = game.i18n?.localize("Income") || "Dochód";
      const text = game.i18n?.localize("Choose Earning Skill to roll for Income") || "Wybierz umiejętność do rzutu na dochód:";
      try {
        const chosen = await ItemDialogClass.create(skills, 1, { title, text });
        skill = chosen?.[0];
      } catch (err) {
        console.warn("wfrp4e-core-pl | Anulowano lub błąd ItemDialog:", err);
      }
    }
    if (!skill) skill = skills[0];
  }

  if (!skill) return null;

  // 5. Bezpieczne obliczenie statusu
  const status = resolveIncomeStatus(actor, career);

  // 6. Przygotowanie opcji testu
  const careerObj = career.toObject ? career.toObject() : career;
  const options = foundry.utils.mergeObject({
    title: `${skill.name} - ${game.i18n?.localize("Income") || "Dochód"}`,
    income: status,
    career: careerObj,
  }, testOptions);

  // 7. Uruchomienie rzutu
  try {
    const test = await actor.setupSkill(skill, options);
    if (test?.roll) {
      await test.roll();
      return test;
    } else if (actor.basicTest) {
      return await actor.basicTest(test);
    }
    return test;
  } catch (err) {
    console.error("wfrp4e-core-pl | Błąd podczas wykonywania rzutu na dochód:", err);
    ui.notifications?.error(`Błąd rzutu na dochód: ${err.message || err}`);
    return null;
  }
}

/**
 * Patch rynku:
 * 1. MarketWFRP4e.addMoneyTo -> bezpieczne safeAddMoneyTo
 * 2. MarketWFRP4e.rollIncome -> zabezpieczenie przed NaNd10 przy niepoprawnym statusie
 */
function installMarketIncomePatch() {
  const Market = game.wfrp4e?.market;
  if (!Market) return false;

  if (!Market[MARKET_PATCH_MARK] && typeof Market.addMoneyTo === "function") {
    Market.addMoneyTo = function(actor, moneyString) {
      safeAddMoneyTo(actor, moneyString, { suppressNotification: false }).catch(err => {
        console.error("wfrp4e-core-pl | Błąd safeAddMoneyTo:", err);
      });
      return [];
    };
    Object.defineProperty(Market, MARKET_PATCH_MARK, { value: true });
  }

  if (!Market[MARKET_ROLL_INCOME_PATCH_MARK] && typeof Market.rollIncome === "function") {
    const originalRollIncome = Market.rollIncome;
    Market.rollIncome = async function(career, { standing, tier } = {}) {
      let safeTier = (typeof tier === "string") ? tier.trim().toLowerCase()[0] : null;
      if (!["b", "s", "g"].includes(safeTier)) {
        const cTier = career?.system?.status?.tier;
        if (typeof cTier === "string") safeTier = cTier.trim().toLowerCase()[0];
      }
      if (!["b", "s", "g"].includes(safeTier)) safeTier = "b";

      let safeStanding = Number(standing);
      if (isNaN(safeStanding) || safeStanding < 0) {
        safeStanding = Number(career?.system?.status?.standing);
      }
      if (isNaN(safeStanding) || safeStanding < 0) safeStanding = 1;

      return originalRollIncome.call(this, career, { standing: safeStanding, tier: safeTier });
    };
    Object.defineProperty(Market, MARKET_ROLL_INCOME_PATCH_MARK, { value: true });
  }

  return true;
}

/**
 * Patch rzutu na zarabianie (TestWFRP i TestWFRP5e handleIncomeTest).
 * Gwarantuje poprawne dane dochodu, deklinację PL i automatyczne księgowanie monet.
 */
function installIncomeRollPatch() {
  const rollClasses = [
    game.wfrp4e?.rolls?.TestWFRP,
    game.wfrp4e?.rolls5e?.TestWFRP5e
  ].filter(Boolean);

  let anyPatched = false;

  for (const TestClass of rollClasses) {
    if (TestClass[INCOME_PATCH_MARK] || typeof TestClass.prototype?.handleIncomeTest !== "function") continue;

    const originalHandleIncomeTest = TestClass.prototype.handleIncomeTest;

    TestClass.prototype.handleIncomeTest = async function() {
      // Zapewnienie poprawnych danych options / context
      this.options = this.options || {};
      const status = this.options.income || this.context?.income || (this.actor ? resolveIncomeStatus(this.actor) : { tier: "b", standing: 1 });
      this.options.income = status;
      if (this.context) this.context.income = status;

      await originalHandleIncomeTest.call(this);

      if (!this.result?.earned) return;

      const type = this.result.earned.slice(-1).toLowerCase();
      const rawAmt = this.result.earned.slice(0, -1);
      let amt = parseFloat(rawAmt);

      if (isNaN(amt) || amt <= 0) {
        this.result.incomeResult = game.i18n?.localize("INCOME.Failure") || "Porażka. Nic.";
        return;
      }

      if (type === "b") {
        amt = Math.ceil(amt);
        this.result.earned = `${amt}b`;
      }

      // Poprawiona polska deklinacja
      const formatted = formatCurrencyPL(amt, type);
      this.result.incomeFormatted = formatted;
      this.result.incomeResult = `${game.i18n?.localize("INCOME.YouEarn") || "Zarobek:"} ${formatted}.`;

      // Automatyczne dopisanie monet do postaci
      if (this.actor && this.actor.isOwner) {
        try {
          await safeAddMoneyTo(this.actor, this.result.earned, { suppressNotification: false });
          this.result.incomeApplied = true;
        } catch (err) {
          console.error("wfrp4e-core-pl | Błąd automatycznego dopisywania zarobku do postaci:", err);
        }
      }
    };

    Object.defineProperty(TestClass, INCOME_PATCH_MARK, { value: true });
    anyPatched = true;
  }

  return anyPatched;
}

/**
 * Patch kart postaci (StandardWFRP4eActorSheet oraz akcji rollIncome).
 * Zastępuje wadliwą implementację _onRollIncome (błąd undefined w ItemDialog,
 * brak obsługi specjalizacji generic, awaria careerPath).
 */
function installSheetPatches() {
  const CharSheet = game.wfrp4e?.apps?.ActorSheetWFRP4eCharacter;
  const StandardSheet = CharSheet ? Object.getPrototypeOf(CharSheet) : null;
  const sheetClasses = [StandardSheet, CharSheet, game.wfrp4e?.apps?.ActorSheetWFRP4eNPC].filter(Boolean);

  for (const cls of sheetClasses) {
    if (cls[SHEET_PATCH_MARK]) continue;

    cls._onRollIncome = async function(ev, target) {
      let career = null;
      try {
        if (typeof this._getDocument === "function") {
          career = this._getDocument(ev);
        }
      } catch (_e) {}

      if (!career && target) {
        const row = target.closest?.("[data-uuid]");
        if (row?.dataset?.uuid) {
          career = await fromUuid(row.dataset.uuid);
        }
      }

      return rollIncomeForActor(this.actor, { career, event: ev });
    };

    if (cls.DEFAULT_OPTIONS?.actions) {
      cls.DEFAULT_OPTIONS.actions.rollIncome = cls._onRollIncome;
    }

    Object.defineProperty(cls, SHEET_PATCH_MARK, { value: true });
  }

  // Dodatkowy listener renderowania dla gwarancji działania każdego przycisku rollIncome
  Hooks.on("renderActorSheet", (sheet, html) => {
    const root = html?.[0] || html;
    if (!root?.querySelectorAll) return;
    const buttons = root.querySelectorAll('[data-action="rollIncome"]');
    for (const btn of buttons) {
      if (btn[SHEET_PATCH_MARK]) continue;
      btn[SHEET_PATCH_MARK] = true;
      btn.addEventListener("click", async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        let career = null;
        try {
          if (typeof sheet._getDocument === "function") {
            career = sheet._getDocument(ev);
          }
        } catch (_e) {}
        if (!career) {
          const row = btn.closest("[data-uuid]");
          if (row?.dataset?.uuid) {
            career = await fromUuid(row.dataset.uuid);
          }
        }
        await rollIncomeForActor(sheet.actor, { career, event: ev });
      }, { capture: true });
    }
  });

  return true;
}

/**
 * Patch modeli profesji (CareerPathModel, CareerModel, CharacterCareerModel)
 * Zabezpiecza wywołania career.rollIncome().
 */
function installCareerModelPatches() {
  const CareerPathModel = CONFIG.Item?.dataModels?.["careerPath"];
  if (CareerPathModel?.prototype && !CareerPathModel.prototype[CAREER_PATCH_MARK]) {
    CareerPathModel.prototype.rollIncome = async function() {
      const actor = this.actor || this.parent?.parent || this.parent?.actor;
      return rollIncomeForActor(actor, { career: this.parent || this });
    };
    Object.defineProperty(CareerPathModel.prototype, CAREER_PATCH_MARK, { value: true });
  }

  const CareerModel = CONFIG.Item?.dataModels?.["career"];
  if (CareerModel?.prototype && !CareerModel.prototype[CAREER_PATCH_MARK]) {
    CareerModel.prototype.rollIncome = async function() {
      const actor = this.actor || this.parent?.parent || this.parent?.actor;
      return rollIncomeForActor(actor, { career: this.parent || this });
    };
    Object.defineProperty(CareerModel.prototype, CAREER_PATCH_MARK, { value: true });
  }

  const CharacterModel = CONFIG.Actor?.dataModels?.["character"];
  const CharacterCareerModel = CharacterModel?.schema?.fields?.career?.model;
  if (CharacterCareerModel?.prototype && !CharacterCareerModel.prototype[CAREER_PATCH_MARK]) {
    CharacterCareerModel.prototype.rollIncome = async function() {
      const actor = this.parent?.parent || this.actor;
      const career = this.path?.document || this.current;
      return rollIncomeForActor(actor, { career });
    };
    Object.defineProperty(CharacterCareerModel.prototype, CAREER_PATCH_MARK, { value: true });
  }

  return true;
}

/**
 * Pomocnik patchujący metodę addActions klasy ActionHandler w Token Action HUD
 */
function patchTahActionHandlerClass(ActionHandlerClass) {
  if (!ActionHandlerClass?.prototype || ActionHandlerClass.prototype[TAH_PATCH_MARK]) return false;

  const originalAddActions = ActionHandlerClass.prototype.addActions;
  ActionHandlerClass.prototype.addActions = async function(actions, groupData) {
    if (Array.isArray(actions)) {
      for (const action of actions) {
        if (action?.id === "incomeRoll") {
          action.onClick = async (event) => {
            const actors = this.actors || (this.actor ? [this.actor] : []);
            for (const actor of actors) {
              await rollIncomeForActor(actor, { event });
            }
          };
        }
      }
    }
    return originalAddActions.call(this, actions, groupData);
  };

  Object.defineProperty(ActionHandlerClass.prototype, TAH_PATCH_MARK, { value: true });
  return true;
}

/**
 * Patch integracji Token Action HUD:
 * - Podmienia akcję incomeRoll w addActions
 * - Rejestruje hooki tokenActionHudCoreApiReady oraz tokenActionHudSystemReady
 * - Dodaje przechwytujący listener kliknięcia na przyciskach paska HUD
 */
function installTokenActionHudPatch() {
  // 1. Sprawdzenie, czy TAH Core API jest już załadowane
  const tahCore = game.modules?.get?.("token-action-hud-core");
  if (tahCore?.api?.ActionHandler) {
    patchTahActionHandlerClass(tahCore.api.ActionHandler);
  }

  // 2. Hook na gotowość API TAH Core
  Hooks.on("tokenActionHudCoreApiReady", (coreModule) => {
    if (coreModule?.api?.ActionHandler) {
      patchTahActionHandlerClass(coreModule.api.ActionHandler);
    }
  });

  // 3. Hook na gotowość modułu systemowego TAH
  Hooks.on("tokenActionHudSystemReady", (systemModule) => {
    const SystemManager = systemModule?.api?.SystemManager;
    if (SystemManager?.prototype?.getActionHandler) {
      // Dodatkowe zabezpieczenie
    }
  });

  // 4. Globalny przechwytujący click listener dla elementów DOM paska HUD
  if (globalThis.document && !document[TAH_PATCH_MARK]) {
    document.addEventListener("click", (ev) => {
      const btn = ev.target?.closest?.('[data-id="incomeRoll"], [data-action-id="incomeRoll"], [id*="incomeRoll"]');
      if (!btn) return;

      const isInsideTah = Boolean(btn.closest("#token-action-hud, .tah-container, #tah-hud"));
      if (!isInsideTah) return;

      ev.preventDefault();
      ev.stopPropagation();
      ev.stopImmediatePropagation();

      const controlled = canvas?.tokens?.controlled?.map(t => t.actor).filter(Boolean) || [];
      const actors = controlled.length > 0 ? controlled : (game.user?.character ? [game.user.character] : []);

      if (actors.length === 0) {
        ui.notifications?.warn("Zaznacz token postaci, aby wykonać rzut na dochód.");
        return;
      }

      for (const actor of actors) {
        rollIncomeForActor(actor, { event: ev });
      }
    }, true); // faza przechwytywania (capture)

    Object.defineProperty(document, TAH_PATCH_MARK, { value: true });
  }

  return true;
}

/**
 * Usprawnienia interfejsu czatu dla kart rzutu na zarabianie:
 * - Wskaźnik "Dodano do sakwy postaci" jeśli zarobek został już zaksięgowany
 * - Przycisk "Dodaj zarobek do sakwy" umożliwiający ręczne dodanie, jeśli nie dodano automatycznie
 * - Kliknięcie w napis kwoty dodaje monety
 */
function registerChatHooks() {
  function enhanceIncomeCard(message, html) {
    const root = html?.[0] || html;
    if (!root?.querySelector) return;

    const test = message.system?.test;
    const isIncome = Boolean(test?.options?.income || root.querySelector(".money-drag"));
    if (!isIncome) return;

    const moneyDrag = root.querySelector(".money-drag");
    if (!moneyDrag || moneyDrag[INCOME_PATCH_MARK]) return;
    moneyDrag[INCOME_PATCH_MARK] = true;

    const earned = moneyDrag.dataset.amt || test?.result?.earned;
    const actorId = test?.actor?.id || message.speaker?.actor;
    const actor = actorId ? game.actors?.get(actorId) : null;
    const isApplied = Boolean(
      message.getFlag?.("wfrp4e-core-pl", "incomeApplied") ||
      test?.result?.incomeApplied ||
      message.flags?.["wfrp4e-core-pl"]?.incomeApplied
    );

    const container = moneyDrag.parentElement || moneyDrag;

    if (isApplied) {
      if (!container.querySelector(".income-applied-tag")) {
        const badge = document.createElement("div");
        badge.className = "income-applied-tag";
        badge.style.cssText = "display: inline-flex; align-items: center; gap: 5px; color: #2e7d32; font-size: 0.85em; margin-top: 4px; padding: 2px 8px; background: rgba(46, 125, 50, 0.12); border-radius: 4px; font-weight: 500;";
        badge.innerHTML = `<i class="fa-solid fa-check-circle"></i> <span>Dodano do sakwy postaci</span>`;
        container.appendChild(badge);
      }
    } else if (earned && earned !== "0b" && actor?.isOwner) {
      if (!container.querySelector(".apply-income-btn")) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "chat-button apply-income-btn";
        btn.style.cssText = "margin-top: 6px; width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; padding: 4px 8px;";
        btn.innerHTML = `<i class="fa-solid fa-coins"></i> <span>Dodaj zarobek do sakwy</span>`;

        btn.addEventListener("click", async (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          btn.disabled = true;
          const ok = await safeAddMoneyTo(actor, earned);
          if (ok) {
            try {
              await message.setFlag("wfrp4e-core-pl", "incomeApplied", true);
            } catch (_e) {}
            btn.innerHTML = `<i class="fa-solid fa-check"></i> <span>Dodano do sakwy</span>`;
            btn.style.color = "#2e7d32";
          } else {
            btn.disabled = false;
          }
        });
        container.appendChild(btn);
      }
    }

    // Kliknięcie w sam napis zarobku
    moneyDrag.style.cursor = "pointer";
    moneyDrag.title = isApplied
      ? "Zarobek został już dodany do sakwy"
      : "Kliknij, aby dodać zarobek do sakwy (lub przeciągnij na kartę postaci)";

    moneyDrag.addEventListener("click", async (ev) => {
      ev.preventDefault();
      const currentApplied = Boolean(
        message.getFlag?.("wfrp4e-core-pl", "incomeApplied") ||
        test?.result?.incomeApplied ||
        message.flags?.["wfrp4e-core-pl"]?.incomeApplied
      );
      if (currentApplied) {
        ui.notifications?.info(`Zarobek (${earned}) został już wcześniej dodany do sakwy.`);
        return;
      }
      if (actor && actor.isOwner && earned && earned !== "0b") {
        const ok = await safeAddMoneyTo(actor, earned);
        if (ok) {
          try {
            await message.setFlag("wfrp4e-core-pl", "incomeApplied", true);
          } catch (_e) {}
          ui.notifications?.info(`Dodano zarobek do sakwy postaci ${actor.name}.`);
        }
      }
    });
  }

  Hooks.on("renderChatMessageHTML", enhanceIncomeCard);
  Hooks.on("renderChatMessage", enhanceIncomeCard);
}

/**
 * Inicjalizacja wszystkich modułów kompatybilności dochodu
 */
export function installIncomeCompatibility() {
  const rollOk = installIncomeRollPatch();
  const marketOk = installMarketIncomePatch();
  const sheetOk = installSheetPatches();
  const careerOk = installCareerModelPatches();
  const tahOk = installTokenActionHudPatch();

  return { roll: rollOk, market: marketOk, sheet: sheetOk, career: careerOk, tah: tahOk };
}

if (globalThis.Hooks) {
  Hooks.once("init", () => queueMicrotask(installIncomeCompatibility));
  Hooks.once("ready", () => {
    installIncomeCompatibility();
    registerChatHooks();
  });
}
