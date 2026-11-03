const PATCH = Symbol.for('wfrp4e-core-pl.v14MigrationOperators');
const EQUIPMENT_PATCH = Symbol.for('wfrp4e-core-pl.sourceEquipmentCallbacks');

export function sourceEquipmentUpdate(data, options) {
    if (!options?.wfrp4eContentLifecycle) return data;
    // The document already contains the source equipment state. Restoring a
    // book is not a player equipping an item: equipToggle scripts may enqueue
    // additional Items without returning their promises to Foundry.
    const result = {...data};
    for (const key of Object.keys(result)) {
        if (key === 'system.equipped' || key.startsWith('system.equipped.')) delete result[key];
    }
    if (data.system && Object.hasOwn(data.system, 'equipped')) {
        result.system = {...data.system};
        delete result.system.equipped;
    }
    return result;
}

export function installSourceEquipmentCompatibility() {
    if (game.release?.generation < 14 || game.system?.id !== 'wfrp4e' || game.i18n?.lang !== 'pl') return;
    for (const Model of Object.values(globalThis.CONFIG?.Item?.dataModels ?? {})) {
        const prototype = Model.prototype;
        if (!prototype || Object.hasOwn(prototype, EQUIPMENT_PATCH) || typeof prototype._onUpdate !== 'function') continue;
        const original = prototype._onUpdate;
        prototype._onUpdate = function(data, options, ...args) {
            return original.call(this, sourceEquipmentUpdate(data, options), options, ...args);
        };
        Object.defineProperty(prototype, EQUIPMENT_PATCH, {value: true});
    }
}

// Preserve WFRP's migration itself, using the operator supported by Foundry 14.
// This runs before the native caller expands/merges the migration update.
export function modernMigrationUpdate(value) {
    if (Array.isArray(value)) return value.map(modernMigrationUpdate);
    if (!value || Object.getPrototypeOf(value) !== Object.prototype) return value;
    const result = {};
    for (const [key, entry] of Object.entries(value)) {
        if (/(^|\.)-=[^.]+$/u.test(key)) {
            result[key.replace(/(^|\.)-=/u, '$1')] = new foundry.data.operators.ForcedDeletion();
        } else result[key] = modernMigrationUpdate(entry);
    }
    return result;
}

export function installMigrationCompatibility() {
    if (game.release?.generation < 14 || game.system?.id !== 'wfrp4e' || game.i18n?.lang !== 'pl'
        || !globalThis.foundry?.data?.operators?.ForcedDeletion) return;
    const migration = game.wfrp4e?.migration;
    if (!migration?.migrateEffectData || migration[PATCH]) return;
    const original = migration.migrateEffectData;
    migration.migrateEffectData = function(...args) {
        return modernMigrationUpdate(original.apply(this, args));
    };
    migration[PATCH] = true;
}

Hooks.once('init', installMigrationCompatibility);
Hooks.once('ready', installMigrationCompatibility);
Hooks.once('init', installSourceEquipmentCompatibility);
Hooks.once('ready', installSourceEquipmentCompatibility);
