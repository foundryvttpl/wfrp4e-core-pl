// Older catalogs name their embedded Item converter "bestiary_traits".
// Delegate all phases to Babele's current document converter, including extract
// so original-language snapshots remain usable by its rollback API.
export function registerLegacyActorItemsConverter(babele) {
    if (babele.converterNamed('bestiary_traits')) return false;
    const documents = babele.converterNamed('document');
    if (!documents) throw new Error('Brakuje konwertera dokumentów Babele wymaganego do tłumaczenia zawartości aktorów.');
    const itemContext = context => {
        let value = context.value;
        // rollbackDocument maps saved payloads against translated data. The
        // native converter otherwise short-circuits already-translated Items.
        const restoring = context.allTranslations && context.allTranslations === context.source?.flags?.babele?.originalPayload;
        if (restoring && Array.isArray(value)) {
            value = value.map(item => {
                const source = foundry.utils.deepClone(item);
                delete source.translated;
                return source;
            });
        }
        return {...context, value, params: {
            ...context.params, documentType: 'Item', cardinality: 'many',
            mapping: {...context.params?.mapping, _identity: {
                export: ['_id', 'id', 'name'], match: ['_id', 'id', 'name', 'sourceId']
            }}
        }};
    };
    babele.registerConverter('bestiary_traits', {
        prepare(context) {return documents.prepare(itemContext(context));},
        translate(context) {return documents.translate(itemContext(context));},
        extract(context) {return documents.extract(itemContext(context));}
    });
    return true;
}
