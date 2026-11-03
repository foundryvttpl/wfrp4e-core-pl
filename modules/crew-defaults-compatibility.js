// Sea of Claws asks once per newly created vehicle lacking crew items.
// Imports recreate many vehicles. Share the answer only within that operation.
const PATCH = Symbol.for('wfrp4e-core-pl.crewDefaults');
let currentBatch;

export async function withCrewDefaultsPrompt(task) {
    if (game.i18n?.lang !== 'pl') return task();
    const batch = currentBatch ??= {depth: 0, decision: null};
    batch.depth++;
    try {
        return await task();
    } finally {
        batch.depth--;
        if (!batch.depth) {
            try {
                // createActor hooks are asynchronous but Foundry does not await
                // them. Keep the update open until the shared question is answered.
                if (batch.decision) await batch.decision;
            } finally {
                if (currentBatch === batch) currentBatch = null;
            }
        }
    }
}

function isCrewQuestion(content) {
    if (typeof content !== 'string') return false;
    const plain = content.replace(/<[^>]*>/g, '').trim();
    return [
        'Add default Crew Tests and Crew Roles?',
        'DIALOG.AddRolesAndTestsContent',
        game.i18n.localize('DIALOG.AddRolesAndTestsContent')
    ].includes(plain);
}

function installCrewDefaultsCompatibility() {
    const Dialog = foundry.applications.api.DialogV2;
    if (!Dialog[PATCH]) {
        const original = Dialog.confirm;
        Dialog.confirm = function(config = {}, ...args) {
            if (game.i18n?.lang !== 'pl' || !isCrewQuestion(config.content)) {
                return original.call(this, config, ...args);
            }
            if (game.wfrp4eCorePl?.contentLifecycle?.strictActorImport) return Promise.resolve(false);
            const batch = currentBatch;
            const localized = {
                ...config,
                title: game.i18n.localize('DIALOG.AddRolesAndTestsTitle'),
                window: {...config.window, title: game.i18n.localize('DIALOG.AddRolesAndTestsTitle')},
                content: `<p>${game.i18n.localize(batch
                    ? 'WH.Initializer.CrewDefaultsBatch' : 'DIALOG.AddRolesAndTestsContent')}</p>`,
                yes: {...config.yes, label: 'Tak'},
                no: {...config.no, label: 'Nie'}
            };
            const ask = () => original.call(this, localized, ...args);
            // Assign the promise before opening the dialog so simultaneous
            // createActor hooks reuse it, including a negative answer.
            if (batch) return batch.decision ??= Promise.resolve().then(ask);
            return ask();
        };
        Object.defineProperty(Dialog, PATCH, {value: true});
    }
    const prototype = typeof WarhammerModuleContentHandler === 'undefined'
        ? null : WarhammerModuleContentHandler.prototype;
    if (!prototype || prototype[PATCH]) return;
    for (const method of ['initialize', 'update']) {
        const original = prototype[method];
        if (typeof original !== 'function') continue;
        prototype[method] = function(...args) {
            return withCrewDefaultsPrompt(() => original.apply(this, args));
        };
    }
    Object.defineProperty(prototype, PATCH, {value: true});
}

Hooks.once('init', installCrewDefaultsCompatibility);
Hooks.once('ready', installCrewDefaultsCompatibility);
