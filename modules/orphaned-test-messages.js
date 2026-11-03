const PATCH = Symbol.for('wfrp4e-core-pl.orphanedTestMessages');
const enabled = () => game.system?.id === 'wfrp4e' && /^pl(?:-|$)/u.test(game.i18n?.lang ?? '');

export function missingTestActor(model) {
    const speaker = model.testData?.context?.speaker;
    if (!speaker || !model.testData?.preData) return false;
    // Preserve token identity: a removed synthetic Actor must not resolve to a
    // different world Actor just because the base Actor still exists.
    if (speaker.scene && speaker.token) return !game.scenes?.get(speaker.scene)?.tokens?.get(speaker.token)?.actor;
    return !game.actors?.get(speaker.actor);
}

function renderHistoricalTest(html) {
    const content = html.querySelector('.message-content') ?? html;
    if (content.querySelector('.wfrp4e-missing-test-actor')) return;
    const notice = document.createElement('p');
    notice.classList.add('wfrp4e-missing-test-actor');
    notice.textContent = 'Postać powiązana z tym testem jest niedostępna. Zapisany wynik pozostaje w historii; akcje testu są wyłączone.';
    content.appendChild(notice);
    for (const action of content.querySelectorAll('[data-action]')) {
        action.setAttribute('aria-disabled', 'true');
        action.title = 'Postać powiązana z testem jest niedostępna.';
        if (action.tagName === 'BUTTON') action.disabled = true;
    }
    // The native ChatMessage attaches its action handler after model.onRender.
    // Capture blocks only test-card actions, preserving message edit/delete UI.
    content.addEventListener('click', event => {
        const action = event.target.closest?.('[data-action]');
        if (!action || !content.contains(action)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
    }, {capture: true});
}

export function installOrphanedTestMessages() {
    if (!enabled()) return;
    for (const type of ['test', 'test5e']) {
        const prototype = globalThis.CONFIG?.ChatMessage?.dataModels?.[type]?.prototype;
        if (!prototype || prototype[PATCH] || typeof prototype.onRender !== 'function') continue;
        const original = prototype.onRender;
        prototype.onRender = async function(html, ...args) {
            if (!enabled() || !missingTestActor(this)) return original.call(this, html, ...args);
            // Use the message's saved HTML. Never recreate a roll, fabricate an
            // Actor or change the persisted result merely to render history.
            renderHistoricalTest(html);
        };
        Object.defineProperty(prototype, PATCH, {value: true});
    }
}

for (const event of ['init', 'i18nInit', 'setup', 'ready']) Hooks.once(event, installOrphanedTestMessages);
