import {resolveBorrowedCourageInline} from './script-compatibility.js';

const PATCH = Symbol.for('wfrp4e-core-pl.sourceImportCallbacks');
const SPELL_PATCH = Symbol.for('wfrp4e-core-pl.partialOvercastMigration');
const sourceCallbacks = new WeakMap();
const sourceActorWrites = new Map();
const calculatedWounds = new WeakMap();
const sourceSceneWrites = new Map();

export async function withSourceSceneContext(ids, invoke) {
    const unique = new Set(ids.filter(Boolean));
    for (const id of unique) sourceSceneWrites.set(id, (sourceSceneWrites.get(id) ?? 0) + 1);
    try {return await invoke();}
    finally {
        for (const id of unique) {
            const count = sourceSceneWrites.get(id) - 1;
            if (count) sourceSceneWrites.set(id, count); else sourceSceneWrites.delete(id);
        }
    }
}

export function automaticActorValues(actor) {
    const model = actor?.system;
    if (!model) return null;
    const values = {};
    if (model.autoCalc?.wounds) values.wounds = calculatedWounds.get(model);
    const size = game.wfrp4e?.config?.tokenSizes?.[model.details?.size?.value];
    if (model.autoCalc?.size && Number.isFinite(size)) values.width = values.height = Math.max(1, size);
    return values;
}

// Constructors prepare Actors before _preCreate receives the operation options.
// Scope this context to the affected IDs, including nested writes and rollback.
export async function withSourceActorContext(ids, invoke) {
    const unique = new Set(ids.filter(Boolean));
    for (const id of unique) sourceActorWrites.set(id, (sourceActorWrites.get(id) ?? 0) + 1);
    try {return await invoke();}
    finally {
        for (const id of unique) {
            const count = sourceActorWrites.get(id) - 1;
            if (count) sourceActorWrites.set(id, count); else sourceActorWrites.delete(id);
        }
    }
}
const mutationTriggers = new Set(['immediate', 'onCreate', 'addItems', 'update',
    'updateDocument', 'preUpdateDocument', 'deleteEffect', 'equipToggle']);
const lifecycleMethods = ['_preCreate', '_onCreate', '_preUpdate', '_onUpdate', '_preDelete', '_onDelete'];
const enabled = () => game.release?.generation >= 14 && game.system?.id === 'wfrp4e' && game.i18n?.lang === 'pl';
const managed = options => !!options?.wfrp4eContentLifecycle;

function documentsFor(document) {
    const result = new Set();
    for (let current = document; current && typeof current === 'object' && !result.has(current); current = current.parent) result.add(current);
    if (document?.actor && typeof document.actor === 'object') result.add(document.actor);
    return [...result];
}

function inSourceCallback(document) {
    return document && documentsFor(document).some(entry => sourceCallbacks.has(entry)
        || (entry.documentName === 'Actor' && !entry.pack && sourceActorWrites.has(entry.id ?? entry._id))
        || (entry.documentName === 'Scene' && sourceSceneWrites.has(entry.id ?? entry._id)));
}

async function sourceCallback(document, invoke) {
    const documents = documentsFor(document);
    for (const entry of documents) sourceCallbacks.set(entry, (sourceCallbacks.get(entry) ?? 0) + 1);
    try {return await invoke();}
    finally {
        for (const entry of documents) {
            const count = sourceCallbacks.get(entry) - 1;
            if (count) sourceCallbacks.set(entry, count); else sourceCallbacks.delete(entry);
        }
    }
}

function wrap(prototype, name, replacement) {
    if (!prototype || typeof prototype[name] !== 'function') return;
    const key = Symbol.for(`${String(PATCH)}.${name}`);
    if (Object.hasOwn(prototype, key)) return;
    const original = prototype[name];
    prototype[name] = replacement(original);
    Object.defineProperty(prototype, key, {value: true});
}

export function installSourceImportCompatibility() {
    if (!enabled()) return;
    game.wfrp4eCorePl ??= {};
    game.wfrp4eCorePl.sourceImport = {isManagedDocument: inSourceCallback, withActorContext: withSourceActorContext};
    for (const type of ['Actor', 'Item', 'ActiveEffect', 'Scene', 'Token', 'ActorDelta']) {
        const config = globalThis.CONFIG?.[type];
        const prototype = config?.documentClass?.prototype;
        for (const name of lifecycleMethods) {
            wrap(prototype, name, original => function(...args) {
                const options = name.endsWith('Delete') ? args[0] : args[1];
                if (!managed(options)) return original.apply(this, args);
                // Keep native document validation/migration/render callbacks.
                // Only gameplay scripts and model lifecycle actions are gated.
                return sourceCallback(this, () => original.apply(this, args));
            });
        }
        wrap(prototype, 'runScripts', original => function(trigger, args, ...rest) {
            if (mutationTriggers.has(trigger) && (managed(args?.options) || inSourceCallback(this))) return [];
            return original.call(this, trigger, args, ...rest);
        });
        wrap(prototype, 'handleImmediateScripts', original => function(data, options, ...rest) {
            if (managed(options) || inSourceCallback(this)) return true;
            return original.call(this, data, options, ...rest);
        });
        if (type === 'Actor') wrap(prototype, 'checkSystemEffects', original => function(...args) {
            if (inSourceCallback(this)) return;
            return original.apply(this, args);
        });
        // Applying a spell/condition during play may prompt, resist, merge or
        // move effects. Importing its definition must retain the source IDs.
        const applicationMethods = type === 'Item' ? ['_handleConditions'] : type === 'ActiveEffect'
            ? ['_handleFilter', '_handleEffectPrevention', '_handleConditionCreation', '_handleItemApplication'] : [];
        for (const name of applicationMethods) {
            wrap(prototype, name, original => function(data, options, ...rest) {
                if (managed(options) || inSourceCallback(this)) return;
                return original.call(this, data, options, ...rest);
            });
        }
        for (const Model of Object.values(config?.dataModels ?? {})) {
            for (const name of lifecycleMethods) {
                wrap(Model.prototype, name, original => function(...args) {
                    const options = name.endsWith('Delete') ? args[0] : args[1];
                    if (managed(options)) return;
                    return original.apply(this, args);
                });
            }
            wrap(Model.prototype, 'allowCreation', original => function(data, options, ...rest) {
                // Source books may contain distinct skills with the same name.
                // Gameplay deduplication must not discard those native IDs.
                if (managed(options)) return true;
                return original.call(this, data, options, ...rest);
            });
            if (type === 'Actor') wrap(Model.prototype, 'updateSingleton', original => function(...args) {
                if (inSourceCallback(this.parent)) return;
                return original.apply(this, args);
            });
            if (type === 'Actor') {
                wrap(Model.prototype, 'checkSize', original => function(...args) {
                    if (inSourceCallback(this.parent)) return;
                    return original.apply(this, args);
                });
                wrap(Model.prototype, 'computeWounds', original => function(...args) {
                    const result = original.apply(this, args);
                    calculatedWounds.set(this, result);
                    return result;
                });
                wrap(Model.prototype, 'checkWounds', original => function(...args) {
                    // Native checkWounds starts an unawaited Actor.update during
                    // prepareData. Keep calculations, without a second world
                    // write racing the source replacement and its fingerprint.
                    if (inSourceCallback(this.parent)) {this.computeWounds(); return;}
                    return original.apply(this, args);
                });
            }
        }
    }
    const scriptPrototype = globalThis.warhammer?.apps?.WarhammerScript?.prototype;
    // This inline source rule must also work before the system script registry
    // and Polish catalog are available to the general translation installer.
    wrap(scriptPrototype, '_handleScriptId', original => function(reference) {
        return resolveBorrowedCourageInline(original.call(this, reference), this);
    });
    wrap(scriptPrototype, 'execute', original => function(args) {
        if (mutationTriggers.has(this.trigger) && (managed(args?.options)
            || [this.context?.actor, this.context?.item, this.context?.effect, this.context?.document].some(inSourceCallback))) return;
        return original.call(this, args);
    });
}

export function installPartialOvercastMigration() {
    if (!enabled()) return;
    for (const Model of Object.values(globalThis.CONFIG?.Item?.dataModels ?? {})) {
        let prototype = Model.prototype;
        while (prototype && !Object.getOwnPropertyDescriptor(prototype, 'hasOvercast')) prototype = Object.getPrototypeOf(prototype);
        const Base = prototype?.constructor;
        if (!Base || Object.hasOwn(Base, SPELL_PATCH) || typeof Base.migrateData !== 'function') continue;
        const original = Base.migrateData;
        Base.migrateData = function(data, ...args) {
            if (!data || typeof data !== 'object' || data.overcast !== undefined) return original.call(this, data, ...args);
            // The native migration unconditionally reads legacy overcast.enabled
            // even on partial modern updates. This temporary sentinel prevents
            // legacy conversion; no fabricated overcast data is persisted.
            const had = Object.hasOwn(data, 'overcast'), value = data.overcast;
            const sentinel = {enabled: false};
            data.overcast = sentinel;
            try {return original.call(this, data, ...args);}
            finally {
                if (data.overcast === sentinel) {
                    if (had) data.overcast = value; else delete data.overcast;
                }
            }
        };
        Object.defineProperty(Base, SPELL_PATCH, {value: true});
    }
}

// The selected language is not populated during init on every Foundry boot.
// i18nInit/setup run before world Actor preparation; ready is already too late.
for (const event of ['init', 'i18nInit', 'setup', 'ready']) {
    Hooks.once(event, installSourceImportCompatibility);
    Hooks.once(event, installPartialOvercastMigration);
}
