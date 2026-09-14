const PATCH_MARK = Symbol.for("wfrp4e-core-pl.dualWieldingLocalization");
const SYSTEM_NOTIFICATION = "No Targets - Directing offhand attack at the same target as the primary attack";

function isPolish() {
	return game.i18n?.lang === "pl";
}

function localizeDualWielderButton(_message, html) {
	if (!isPolish()) return;

	const root = html instanceof HTMLElement ? html : html?.[0];
	const button = root?.querySelector?.('[data-action="rollDualWielder"]');
	if (button) {
		button.textContent = game.i18n.localize("WFRP4E.PL.DualWielderAttack");
	}
}

function installDualWieldingLocalization() {
	const notifications = ui?.notifications;
	if (!notifications || notifications[PATCH_MARK]) return false;

	const originalInfo = notifications.info;
	if (typeof originalInfo !== "function") return false;

	notifications.info = function(message, ...args) {
		if (isPolish() && message === SYSTEM_NOTIFICATION) {
			message = game.i18n.localize("WFRP4E.PL.DualWielderNoTargets");
		}
		return originalInfo.call(this, message, ...args);
	};

	Object.defineProperty(notifications, PATCH_MARK, { value: true });
	return true;
}

Hooks.on("renderChatMessageHTML", localizeDualWielderButton);
Hooks.once("init", () => queueMicrotask(installDualWieldingLocalization));
Hooks.once("ready", installDualWieldingLocalization);
