const PATCH_MARK = Symbol.for("wfrp4e-core-pl.valueDialogLocalization");
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

if (globalThis.Hooks) {
  Hooks.once("init", () => queueMicrotask(installValueDialogLocalization));
  Hooks.once("ready", installValueDialogLocalization);
}
