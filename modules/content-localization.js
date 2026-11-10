export class SourceCatalogUnavailableError extends Error {}

const catalogs = new Map();

async function hasLocalCatalog(pack) {
    if (!catalogs.has(pack.collection)) {
        const moduleId = game.wfrp4eCorePl?.MODULE_ID ?? 'wfrp4e-core-pl';
        catalogs.set(pack.collection, (async () => {
            const response = await fetch(`modules/${moduleId}/compendium/${pack.collection}.json`);
            if (response.status === 404) return false;
            if (!response.ok) throw new Error(`Nie można sprawdzić tłumaczenia paczki ${pack.collection}.`);
            await response.json();
            return true;
        })());
    }
    return catalogs.get(pack.collection);
}

// getDocuments can return native data when a database wrapper is unavailable or
// translation fails. Never silently persist that fallback over Polish content.
export async function readyTranslations() {
    const babele = game.babele;
    if (!babele?.init || !await babele.init()) {
        throw new Error('Tłumaczenia Babele nie są gotowe. Przeładuj Foundry i ponów aktualizację. Zawartość świata nie została zmieniona.');
    }
    return babele;
}

export async function localizedSourceData(pack, document, context = null) {
    const babele = await readyTranslations();
    context?.current();
    const data = document.toObject();
    const mapped = babele.translatedCompendiumFor(pack.collection);
    if (!mapped) {
        let available;
        try {available = await hasLocalCatalog(pack);}
        catch (error) {
            catalogs.delete(pack.collection);
            throw new SourceCatalogUnavailableError(`Nie można sprawdzić polskiego tłumaczenia paczki ${pack.collection}.`, {cause: error});
        }
        if (available) throw new SourceCatalogUnavailableError(`Nie wczytano polskiego tłumaczenia paczki ${pack.collection}. Przeładuj Foundry przed ponowieniem.`);
        return data;
    }
    // The public API is idempotent for already translated documents. Explicitly
    // invoke it here as well as through Babele's normal database wrapper.
    const translated = babele.translate(pack.collection, structuredClone(data));
    if (!translated || (mapped.hasTranslation(data) && translated.flags?.babele?.lang !== 'pl')) {
        throw new Error(`Nie udało się przetłumaczyć „${data.name}” (${pack.collection}).`);
    }
    return structuredClone(translated);
}

export function nativeSourceData(pack, type, data) {
    const rollback = game.babele?.rollbackDocument?.bind(game.babele);
    const source = structuredClone(data);
    if (!rollback) return source;
    // Restore each embedded document from its own saved payload first. A root
    // rollback alone cannot match English payload keys to translated page names
    // and can leave Polish pages inside an otherwise English comparison copy.
    const embedded = CONFIG[type]?.documentClass?.metadata?.embedded ?? {};
    for (const [childType, field] of Object.entries(embedded)) {
        if (Array.isArray(source[field])) source[field] = source[field].map(child => nativeSourceData(pack, childType, child));
    }
    return rollback(type, source, {pack: pack.collection,
        ...(type !== pack.documentName ? {customMapping: {}, runtime: {}} : {})}) ?? source;
}
