const MODULE_ID = "wfrp4e-core-pl";
const INCOME_PATCH_MARK = Symbol.for(`${MODULE_ID}.incomeCompatibility`);
const MARKET_PATCH_MARK = Symbol.for(`${MODULE_ID}.incomeMarketPatch`);

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
 * Patch metody MarketWFRP4e.addMoneyTo
 */
function installMarketIncomePatch() {
  const Market = game.wfrp4e?.market;
  if (!Market || Market[MARKET_PATCH_MARK] || typeof Market.addMoneyTo !== "function") return false;

  Market.addMoneyTo = function(actor, moneyString) {
    // Bezpieczne dodanie monet
    safeAddMoneyTo(actor, moneyString, { suppressNotification: false }).catch(err => {
      console.error("wfrp4e-core-pl | Błąd safeAddMoneyTo:", err);
    });
    // Zwracamy pustą tablicę, by updateEmbeddedDocuments w _onDropIncome nie dublował zapisu
    return [];
  };

  Object.defineProperty(Market, MARKET_PATCH_MARK, { value: true });
  return true;
}

/**
 * Patch rzutu na zarabianie (TestWFRP.prototype.handleIncomeTest)
 * Automatycznie dopisuje zarobione monety do sakwy postaci po udanym rzucie.
 */
function installIncomeRollPatch() {
  const TestWFRP = game.wfrp4e?.rolls?.TestWFRP;
  if (!TestWFRP || TestWFRP[INCOME_PATCH_MARK]) return false;

  const originalHandleIncomeTest = TestWFRP.prototype.handleIncomeTest;
  TestWFRP.prototype.handleIncomeTest = async function() {
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

    // Automatyczne dopisanie monet do postaci, jeśli użytkownik jest właścicielem
    if (this.actor && this.actor.isOwner) {
      try {
        await safeAddMoneyTo(this.actor, this.result.earned, { suppressNotification: false });
        this.result.incomeApplied = true;
      } catch (err) {
        console.error("wfrp4e-core-pl | Błąd automatycznego dopisywania zarobku do postaci:", err);
      }
    }
  };

  Object.defineProperty(TestWFRP, INCOME_PATCH_MARK, { value: true });
  return true;
}

/**
 * Usprawnienia interfejsu czatu dla kart rzutu na zarabianie:
 * - Wskaźnik "Dodano do sakwy postaci" jeśli zarobek został już zaksięgowany
 * - Przycisk "Dodaj zarobek do sakwy" umożliwiający ręczne dodanie, jeśli nie dodano automatycznie
 * - Kliknięcie w napis kwoty dodaje monety
 */
function registerChatHooks() {
  Hooks.on("renderChatMessageHTML", async (message, html) => {
    const test = message.system?.test;
    const isIncome = Boolean(test?.options?.income || html.querySelector(".money-drag"));
    if (!isIncome) return;

    const moneyDrag = html.querySelector(".money-drag");
    if (!moneyDrag) return;

    const earned = moneyDrag.dataset.amt || test?.result?.earned;
    const actorId = test?.actor?.id || message.speaker?.actor;
    const actor = actorId ? game.actors?.get(actorId) : null;
    const isApplied = Boolean(
      message.getFlag?.("wfrp4e-core-pl", "incomeApplied") ||
      test?.result?.incomeApplied ||
      message.flags?.["wfrp4e-core-pl"]?.incomeApplied
    );

    // Wygląd wskaźnika / przycisku
    const container = moneyDrag.parentElement || moneyDrag;

    if (isApplied) {
      const badge = document.createElement("div");
      badge.className = "income-applied-tag";
      badge.style.cssText = "display: inline-flex; align-items: center; gap: 5px; color: #2e7d32; font-size: 0.85em; margin-top: 4px; padding: 2px 8px; background: rgba(46, 125, 50, 0.12); border-radius: 4px; font-weight: 500;";
      badge.innerHTML = `<i class="fa-solid fa-check-circle"></i> <span>Dodano do sakwy postaci</span>`;
      container.appendChild(badge);
    } else if (earned && earned !== "0b" && actor?.isOwner) {
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
  });
}

/**
 * Inicjalizacja modułu kompatybilności dochodu
 */
export function installIncomeCompatibility() {
  const rollOk = installIncomeRollPatch();
  const marketOk = installMarketIncomePatch();
  return { roll: rollOk, market: marketOk };
}

if (globalThis.Hooks) {
  Hooks.once("init", () => queueMicrotask(installIncomeCompatibility));
  Hooks.once("ready", () => {
    installIncomeCompatibility();
    registerChatHooks();
  });
}
