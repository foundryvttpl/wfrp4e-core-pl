const PATCH_MARK = Symbol.for("wfrp4e-core-pl.valueDialogLocalization");
const ITEM_DIALOG_PATCH_MARK = Symbol.for("wfrp4e-core-pl.itemDialogLocalization");
const XP_PROMPT = /^Non-numeric value provided \(([\s\S]*)\)\. Enter actual XP value to award\.$/;

function isPolishWfrp() {
  return globalThis.game?.system?.id === "wfrp4e" && game.i18n?.lang === "pl";
}

export function installValueDialogLocalization() {
  const Dialog = globalThis.warhammer?.apps?.ValueDialog;
  if (!Dialog || Object.hasOwn(Dialog, PATCH_MARK)) return false;
  const originalCreate = Dialog.create;
  const originalContext = Dialog.prototype._prepareContext;
  if (typeof originalCreate !== "function" || typeof originalContext !== "function") return false;

  Dialog.create = function(input, ...args) {
    if (isPolishWfrp() && input?.title === "Experience" && typeof input.text === "string") {
      const match = XP_PROMPT.exec(input.text);
      if (match) input = {
        ...input,
        title: game.i18n.localize("Experience"),
        text: game.i18n.format("WFRP4E.PL.ExperienceValuePrompt", {amount: match[1]})
      };
    }
    return originalCreate.call(this, input, ...args);
  };

  Dialog.prototype._prepareContext = async function(...args) {
    const context = await originalContext.apply(this, args);
    if (!isPolishWfrp()) return context;
    // Only library defaults: never rewrite supplied labels, choices or values.
    if (!this.text && context.label === "Enter Value") {
      context.label = game.i18n.localize("WFRP4E.PL.EnterValue");
    } else if (!this.text && context.label === "Select Value") {
      context.label = game.i18n.localize("WFRP4E.PL.SelectValue");
    }
    for (const button of context.buttons ?? []) {
      if (button.type === "submit" && button.label === "Submit") {
        button.label = game.i18n.localize("Submit");
      }
    }
    return context;
  };
  Object.defineProperty(Dialog, PATCH_MARK, {value: true});
  return true;
}

const ITEM_DIALOG_PROMPTS = Object.freeze({
  "Choose Sense": "Wybierz Zmysł",
  "Choose Terrain": "Wybierz Teren",
  "Choose Training": "Wybierz Szkolenie",
  "Choose Group": "Wybierz Grupę",
  "Choose Breath": "Wybierz Zionięcie",
  "Choose Location": "Wybierz Lokację",
  "Choose Characteristic": "Wybierz Cechę",
  "Choose Lore": "Wybierz Tradycję",
  "Select a Lore": "Wybierz Tradycję",
  "Choose Lores to Add": "Wybierz Tradycje do dodania",
  "Choose Size": "Wybierz Rozmiar",
  "Choose Symptoms": "Wybierz Objawy",
  "Select Property": "Wybierz Właściwość",
  "Select Quality": "Wybierz Jakość",
  "Choose Qualities to add": "Wybierz Zalety do dodania",
  "Choose Flaws to remove": "Wybierz Wady do usunięcia",
  "Choose Skill": "Wybierz Umiejętność",
  "Choose Earning Skill to roll for Income": "Wybierz Umiejętność Zarobkową do testu Zarobków"
});

const ITEM_DIALOG_NAMES = Object.freeze({
  // Senses (Acute Sense / Wyczulony Zmysł)
  taste: "Smak",
  sight: "Wzrok",
  smell: "Węch",
  hearing: "Słuch",
  touch: "Dotyk",
  Taste: "Smak",
  Sight: "Wzrok",
  Smell: "Węch",
  Hearing: "Słuch",
  Touch: "Dotyk",

  // Terrains (Orientation / Strider)
  coastal: "Wybrzeże",
  deserts: "Pustynie",
  marshes: "Bagna",
  rocky: "Góry",
  tundra: "Tundra",
  woodlands: "Lasy",
  Coastal: "Wybrzeże",
  Deserts: "Pustynie",
  Marshes: "Bagna",
  Rocky: "Góry",
  Tundra: "Tundra",
  Woodlands: "Lasy",

  // Animal training
  broken: "Ujeżdżony",
  drive: "Pociągowy",
  entertain: "Rozrywkowy",
  fetch: "Aportujący",
  guard: "Strażniczy",
  home: "Domowy",
  magic: "Magiczny",
  mount: "Wierzchowiec",
  war: "Bojowy",
  Broken: "Ujeżdżony",
  Drive: "Pociągowy",
  Entertain: "Rozrywkowy",
  Fetch: "Aportujący",
  Guard: "Strażniczy",
  Home: "Domowy",
  Magic: "Magiczny",
  Mount: "Wierzchowiec",
  War: "Bojowy",

  // Etiquette groups
  nobles: "Szlachta",
  guilders: "Gildie",
  servants: "Służba",
  Nobles: "Szlachta",
  Guilders: "Gildie",
  Servants: "Służba",

  // Breath types
  corrosion: "Korozja",
  fire: "Ogień",
  electricity: "Elektryczność",
  poison: "Trucizna",
  smoke: "Dym",
  various: "Różne",
  Corrosion: "Korozja",
  Fire: "Ogień",
  Electricity: "Elektryczność",
  Poison: "Trucizna",
  Smoke: "Dym",
  Various: "Różne"
});

function localizeDialogOptions(options) {
  if (typeof options === "string") {
    const prompt = ITEM_DIALOG_PROMPTS[options] || options;
    return { text: prompt, title: prompt };
  }
  if (!options || typeof options !== "object") return options;
  let text = options.text;
  let title = options.title;
  if (typeof text === "string" && ITEM_DIALOG_PROMPTS[text]) {
    text = ITEM_DIALOG_PROMPTS[text];
  }
  if (typeof title === "string" && ITEM_DIALOG_PROMPTS[title]) {
    title = ITEM_DIALOG_PROMPTS[title];
  }
  return { ...options, text, title };
}

function localizeDialogItems(items) {
  if (!items) return items;
  if (Array.isArray(items)) {
    return items.map(item => {
      if (!item || typeof item !== "object") return item;
      const transName = ITEM_DIALOG_NAMES[item.id] || ITEM_DIALOG_NAMES[item.name];
      if (transName) {
        return { ...item, name: transName };
      }
      return item;
    });
  }
  if (typeof items === "object" && !(items instanceof (globalThis.foundry?.utils?.Collection || Map))) {
    const localized = {};
    for (const [k, v] of Object.entries(items)) {
      localized[k] = ITEM_DIALOG_NAMES[k] || ITEM_DIALOG_NAMES[v] || v;
    }
    return localized;
  }
  return items;
}

export function installItemDialogLocalization() {
  const Dialog = globalThis.warhammer?.apps?.ItemDialog;
  if (!Dialog || Object.hasOwn(Dialog, ITEM_DIALOG_PATCH_MARK)) return false;
  const originalCreate = Dialog.create;
  const originalPrepareContext = Dialog.prototype._prepareContext;
  if (typeof originalCreate !== "function") return false;

  Dialog.create = function(items, count = 1, options = {}) {
    if (isPolishWfrp()) {
      items = localizeDialogItems(items);
      options = localizeDialogOptions(options);
    }
    return originalCreate.call(this, items, count, options);
  };

  if (typeof originalPrepareContext === "function") {
    Dialog.prototype._prepareContext = async function(...args) {
      const context = await originalPrepareContext.apply(this, args);
      if (!isPolishWfrp()) return context;
      if (typeof context.text === "string" && ITEM_DIALOG_PROMPTS[context.text]) {
        context.text = ITEM_DIALOG_PROMPTS[context.text];
      }
      if (typeof context.title === "string" && ITEM_DIALOG_PROMPTS[context.title]) {
        context.title = ITEM_DIALOG_PROMPTS[context.title];
      }
      if (Array.isArray(context.items)) {
        for (const item of context.items) {
          if (!item) continue;
          const locName = ITEM_DIALOG_NAMES[item.id] || ITEM_DIALOG_NAMES[item.name];
          if (locName) item.name = locName;
        }
      }
      return context;
    };
  }

  Object.defineProperty(Dialog, ITEM_DIALOG_PATCH_MARK, {value: true});
  return true;
}

export function installAllDialogLocalization() {
  installValueDialogLocalization();
  installItemDialogLocalization();
}

if (globalThis.Hooks) {
  Hooks.once("init", () => queueMicrotask(installAllDialogLocalization));
  Hooks.once("ready", installAllDialogLocalization);
}
