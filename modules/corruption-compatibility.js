const MODULE_ID = "wfrp4e-core-pl";
const TRAIT_PATCH_MARK = Symbol.for(MODULE_ID + ".corruptionTraitDisplay");
const CHAT_PATCH_MARK = Symbol.for(MODULE_ID + ".corruptionMessageCompatibility");
const COMMAND_PATCH_MARK = Symbol.for(MODULE_ID + ".corruptionCommandCompatibility");
const ROLL_PATCH_MARK = Symbol.for(MODULE_ID + ".corruptionRollCompatibility");

const CORRUPTION_STRENGTHS = Object.freeze({
  minor: {
    key: "CORRUPTION.Minor",
    polish: "Pomniejsze",
    aliases: ["pomniejszy", "pomniejsza"],
  },
  moderate: {
    key: "CORRUPTION.Moderate",
    polish: "Umiarkowane",
    aliases: ["umiarkowany", "umiarkowana"],
  },
  major: {
    key: "CORRUPTION.Major",
    polish: "Potężne",
    aliases: ["potężny", "potężna", "poważny", "poważne", "poważna"],
  },
});

function normalized(value) {
  return typeof value === "string"
    ? value.trim().normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase()
    : "";
}

export function corruptionStrengthKey(value) {
  const candidate = normalized(value);
  if (!candidate) return null;

  for (const [strength, details] of Object.entries(CORRUPTION_STRENGTHS)) {
    const localized = game.i18n?.localize?.(details.key);
    const genericLocalized = game.i18n?.localize?.(strength[0].toUpperCase() + strength.slice(1));
    if ([strength, details.polish, ...details.aliases, localized, genericLocalized].some(alias => normalized(alias) === candidate)) {
      return strength;
    }
  }
  return null;
}

export function localizedCorruptionStrength(value) {
  const strength = corruptionStrengthKey(value);
  if (!strength) return value;
  const details = CORRUPTION_STRENGTHS[strength];
  return game.i18n?.localize?.(details.key) ?? details.polish;
}

export function createCorruptionSelectionMessage({ skill, source = "" } = {}, chatData = {}) {
  const buttons = Object.entries(CORRUPTION_STRENGTHS).map(([strength]) =>
    `<a class="chat-button" data-action="resist" data-strength="${strength}">${localizedCorruptionStrength(strength)}</a>`
  ).join("");
  const content = `
    <div class="corruption-message">
      <h3><strong>${game.i18n.localize("CHAT.CorruptingInfluence")}</strong></h3>
      <img src="modules/wfrp4e-core/art/ui/chaos.webp" height="100" width="100">
      <strong>${game.i18n.localize("Choose")}</strong>
    </div>
    <div class="chat-buttons corruption-strength-buttons">${buttons}</div>`;

  return ChatMessage.create(foundry.utils.mergeObject({
    type: "corruption",
    content,
    speaker: {
      alias: game.i18n.localize("CORRUPTION.Exposure"),
    },
    flavor: source,
    system: {
      strength: "",
      source,
      skill,
    },
  }, chatData));
}

function isCorruptionTrait(item) {
  if (item?.type !== "trait") return false;
  const names = [
    item.name,
    item.originalName,
    item.flags?.babele?.originalName,
  ];
  return names.some(name => ["corruption", "zepsucie", "spaczenie"].includes(normalized(name)));
}

function inheritedDescriptor(object, property) {
  for (let current = object; current; current = Object.getPrototypeOf(current)) {
    const descriptor = Object.getOwnPropertyDescriptor(current, property);
    if (descriptor) return descriptor;
  }
  return null;
}

function installTraitDisplayCompatibility() {
  const TraitModel = CONFIG.Item?.dataModels?.trait;
  const prototype = TraitModel?.prototype;
  if (!prototype || prototype[TRAIT_PATCH_MARK]) return false;

  const descriptor = inheritedDescriptor(prototype, "Specification");
  if (typeof descriptor?.get !== "function") return false;
  const originalGet = descriptor.get;

  try {
    Object.defineProperty(prototype, "Specification", {
      configurable: true,
      enumerable: descriptor.enumerable,
      get() {
        const value = originalGet.call(this);
        return isCorruptionTrait(this.parent) ? localizedCorruptionStrength(value) : value;
      },
    });
    Object.defineProperty(prototype, TRAIT_PATCH_MARK, { value: true });
    return true;
  }
  catch (error) {
    console.warn(MODULE_ID + " | Could not localize the displayed corruption strength", error);
    return false;
  }
}

function installChatCompatibility() {
  const Model = CONFIG.ChatMessage?.dataModels?.corruption;
  if (!Model || Model[CHAT_PATCH_MARK]) return false;

  const originalCreate = Model.createCorruptionMessage;
  const originalCommand = Model.handleCorruptionCommand;
  const originalResist = Model._onResist;
  if (
    typeof originalCreate !== "function"
    || typeof originalCommand !== "function"
    || typeof originalResist !== "function"
  ) return false;

  Model.createCorruptionMessage = function(strength, options, chatData) {
    // WFRP4e mechanics require the stable English key; the chat template localizes it for display.
    const canonicalStrength = corruptionStrengthKey(strength);
    return originalCreate.call(this, canonicalStrength ?? strength, options, chatData);
  };
  Model.handleCorruptionCommand = function(strength, skill, source) {
    if (!normalized(strength)) {
      return createCorruptionSelectionMessage({ skill, source });
    }
    const canonicalStrength = corruptionStrengthKey(strength);
    if (!canonicalStrength) {
      const usage = game.i18n?.lang === "pl"
        ? "Użycie: /corruption minor|moderate|major albo /zepsucie pomniejsze|umiarkowane|potężne"
        : "Usage: /corruption minor|moderate|major or /zepsucie pomniejsze|umiarkowane|potężne";
      return ui.notifications.error(`${game.i18n.localize("ErrorCorruption")}. ${usage}`);
    }
    return originalCommand.call(this, canonicalStrength, skill, source);
  };
  Model._onResist = async function(event, target) {
    // Older messages may already contain a Polish label written by previous module versions.
    const canonicalStrength = corruptionStrengthKey(target?.dataset?.strength ?? this.strength);
    if (!canonicalStrength) {
      return ui.notifications.error("ErrorCorruption", { localize: true });
    }

    const actors = warhammer.utility.targetedOrAssignedActors();
    if (actors.length === 0) {
      return ui.notifications.error("ErrorCharAssigned", { localize: true });
    }

    for (const actor of actors) {
      actor.corruptionDialog(canonicalStrength, this.skill);
    }
  };
  Object.defineProperty(Model, CHAT_PATCH_MARK, { value: true });
  return true;
}

function installRollCompatibility() {
  const TestWFRP = game.wfrp4e?.rolls?.TestWFRP;
  const prototype = TestWFRP?.prototype;
  if (!prototype || prototype[ROLL_PATCH_MARK] || typeof prototype.handleCorruptionResult !== "function") return false;

  const originalHandleCorruptionResult = prototype.handleCorruptionResult;
  prototype.handleCorruptionResult = async function(...args) {
    const options = this.options;
    const originalStrength = options?.corruption;
    const canonicalStrength = corruptionStrengthKey(originalStrength);
    if (!canonicalStrength || !options) {
      return originalHandleCorruptionResult.apply(this, args);
    }

    // WFRP4e 9.x compares this internal value with a localized label. Adapt it only
    // for the duration of the system calculation, then preserve the canonical value.
    options.corruption = localizedCorruptionStrength(canonicalStrength).toLocaleLowerCase();
    try {
      return await originalHandleCorruptionResult.apply(this, args);
    }
    finally {
      options.corruption = originalStrength;
    }
  };

  Object.defineProperty(prototype, ROLL_PATCH_MARK, { value: true });
  return true;
}

function installCommandAliases() {
  const commands = game.wfrp4e?.commands;
  const Model = CONFIG.ChatMessage?.dataModels?.corruption;
  if (!commands || !Model || commands[COMMAND_PATCH_MARK] || typeof commands.add !== "function") return false;

  const corruption = commands.commands?.corruption;
  if (!corruption) return false;

  const aliases = {};
  for (const command of ["zepsucie", "spaczenie", "coruption"]) {
    if (commands.commands?.[command]) continue;
    aliases[command] = {
      args: corruption.args ?? ["strength", "skill", "source"],
      defaultArg: corruption.defaultArg ?? "strength",
      description: command === "coruption"
        ? "Alias for /corruption"
        : "Test Zepsucia (alias /corruption)",
      callback: (strength, skill, source) => Model.handleCorruptionCommand(strength, skill, source),
    };
  }

  if (Object.keys(aliases).length) commands.add(aliases);
  Object.defineProperty(commands, COMMAND_PATCH_MARK, { value: true });
  return true;
}

export function installCorruptionCompatibility() {
  return {
    traitDisplay: installTraitDisplayCompatibility(),
    chat: installChatCompatibility(),
    roll: installRollCompatibility(),
    commands: installCommandAliases(),
  };
}

if (globalThis.Hooks) {
  Hooks.once("init", () => queueMicrotask(installCorruptionCompatibility));
  Hooks.once("ready", installCorruptionCompatibility);
}
