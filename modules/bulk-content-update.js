import {managedModule, runContentOperation} from './content-lifecycle.js';

// Add a single bulk action to the upstream initializer without replacing its
// template or changing how individual modules update their documents.
let bulkUpdateRunning = false;
const lockedButtons = new Map();
const text = key => game.i18n.localize(`WH.Initializer.BulkUpdate.${key}`);
const contentTypes = {actors: 'Aktorzy', journals: 'Dzienniki', items: 'Przedmioty',
    tables: 'Tabele', scenes: 'Sceny i mapy', macros: 'Makra'};
const escapeHtml = value => String(value).replace(/[&<>"']/gu,
    char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));

async function selectScope(modules) {
    const dialog = foundry.applications.api.DialogV2;
    // Older dialog adapters still support the previous all-content action.
    if (typeof dialog.wait !== 'function') {
        if (!await dialog.confirm({window: {title: text('Label')},
            content: `<p>${game.i18n.format('WH.Initializer.BulkUpdate.Confirm', {count: modules.length})}</p>`
                + game.i18n.localize('WH.Initializer.UpdaterText'), classes: ['initialization']})) return null;
        return {moduleIds: modules.map(entry => entry.key), settings: {...Object.fromEntries(Object.keys(contentTypes).map(key => [key, true])), excludeNameChange: false}};
    }
    while (true) {
        const selection = await dialog.wait({window: {title: text('Label')}, rejectClose: false,
            content: `<p>Wybierz książki i zawartość do aktualizacji. Przed zapisem zostaną sprawdzone Twoje zmiany.</p>
                <fieldset><legend>Książki</legend><div style="max-height:32vh;overflow:auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0.4rem">
                ${modules.map(entry => `<label style="display:flex;align-items:center;gap:0.4rem"><input type="checkbox" name="wfrp-module" value="${escapeHtml(entry.key)}" checked>${escapeHtml(entry.title ?? entry.key)}</label>`).join('')}</div></fieldset>
                <fieldset><legend>Zawartość</legend><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0.4rem">
                ${Object.entries(contentTypes).map(([key, label]) => `<label style="display:flex;align-items:center;gap:0.4rem"><input type="checkbox" name="wfrp-type" value="${key}" checked>${label}</label>`).join('')}</div></fieldset>`,
            buttons: [{action: 'update', label: 'Sprawdź i aktualizuj', default: true,
                callback: (_event, _button, app) => ({
                    moduleIds: Array.from(app.element.querySelectorAll('input[name="wfrp-module"]:checked'), input => input.value),
                    typeIds: Array.from(app.element.querySelectorAll('input[name="wfrp-type"]:checked'), input => input.value)
                })}, {action: 'cancel', label: 'Anuluj', callback: () => null}]});
        if (!selection || selection === 'cancel') return null;
        const moduleIds = modules.filter(entry => selection.moduleIds?.includes(entry.key)).map(entry => entry.key);
        const settings = Object.fromEntries(Object.keys(contentTypes).map(key => [key, selection.typeIds?.includes(key) === true]));
        if (moduleIds.length && Object.values(settings).some(Boolean)) return {moduleIds, settings: {...settings, excludeNameChange: false}};
        ui.notifications.warn('Wybierz co najmniej jedną książkę i jeden rodzaj zawartości.');
    }
}

async function availableModules(app) {
    const context = await app._prepareContext({});
    return (context.modules ?? []).filter(entry => {
        const module = game.modules.get(entry.key);
        const packs = module?.flags?.initializationPacks;
        return entry.installed && entry.active && entry.initialized && module?.active
            && managedModule(module) && Array.isArray(packs) && packs.length > 0
            && packs.every(id => game.packs.has(id));
    });
}

function lockControls(root) {
    for (const button of root.querySelectorAll('.module-list button, .wfrp4e-update-all')) {
        if (!lockedButtons.has(button)) lockedButtons.set(button, button.disabled);
        button.disabled = true;
    }
}

async function updateAll(app, button) {
    if (bulkUpdateRunning || !game.user?.isGM || game.i18n?.lang !== 'pl') return;
    // Set the guard before awaiting context or confirmation, including across
    // multiple initializer windows. Always release it on cancel or failure.
    bulkUpdateRunning = true;
    let started = false;
    try {
        lockControls(app.element);
        const available = await availableModules(app);
        if (!available.length) return;
        const selection = await selectScope(available);
        if (!selection) return;
        const modules = available.filter(entry => selection.moduleIds.includes(entry.key));
        for (const entry of modules) {
            const module = game.modules.get(entry.key);
            if (!module?.active || !managedModule(module) || !game.settings.get(entry.key, 'initialized')
                || !module.flags?.initializationPacks?.every(id => game.packs.has(id))) {
                throw new Error(`Książka nie jest już dostępna: ${entry.title ?? entry.key}`);
            }
        }
        started = true;
        const settings = selection.settings;
        await runContentOperation(modules.map(entry => ({
            module: game.modules.get(entry.key), mode: 'update', settings: {...settings}
        })), message => {button.textContent = message;});
    } catch (error) {
        console.error('WFRP PL | Bulk content update failed', error);
        ui.notifications.error(error.message || text('Error'), {permanent: true});
    } finally {
        bulkUpdateRunning = false;
        for (const [control, disabled] of lockedButtons) control.disabled = disabled;
        lockedButtons.clear();
        button.textContent = text('Label');
        if (started && app.rendered) app.render();
    }
}

Hooks.on('renderWarhammerModuleInitializationV2', async (app, element) => {
    if (!game.user?.isGM || game.i18n?.lang !== 'pl') return;
    const root = element?.[0] ?? element;
    const instructions = root?.querySelector('.initializer .instructions');
    if (!instructions || instructions.querySelector('.wfrp4e-update-all')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'wfrp4e-update-all';
    button.textContent = text('Label');
    button.title = text('Hint');
    button.style.cssText = 'display:inline-flex;width:auto;margin:0 0 0 1em;padding:2px 10px;vertical-align:middle';
    button.disabled = true;
    button.addEventListener('click', () => updateAll(app, button));
    // Place beside the help link, in the space above the flat module grid.
    (instructions.querySelector('p:last-child') ?? instructions).append(button);
    try {
        button.disabled = !(await availableModules(app)).length;
        if (bulkUpdateRunning) lockControls(root);
    } catch (error) {
        console.error('WFRP PL | Could not prepare bulk content update', error);
    }
});
