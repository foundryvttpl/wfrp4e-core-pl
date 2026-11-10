const escape = value => String(value).replace(/[&<>"']/gu, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const preview = value => {
    if (value === undefined) return '(brak pola)';
    const deletion = globalThis.foundry?.data?.operators?.ForcedDeletion;
    if (deletion && value instanceof deletion) return '(usunięcie pola)';
    const operators = globalThis.foundry?.data?.operators;
    if (operators?.ForcedReplacement && value instanceof operators.ForcedReplacement) value = operators.DataFieldOperator.get(value);
    const text = JSON.stringify(value) ?? String(value);
    return text.length > 800 ? text.slice(0, 800) + '… [skrócono]' : text;
};

// Comparison of actual writer patches, not a guess from a changed hash.
export function inspectDocumentWrite(document, incoming, rootUpdate, limit = 160, prepared = null, snapshot = null) {
    const changes = [];
    let truncated = false;
    const add = (path, before, after, kind = 'wartość') => {
        if (changes.length >= limit) {truncated = true; return;}
        changes.push({path, before: preview(before), after: preview(after), kind});
    };
    function diff(before, after, path) {
        if (changes.length >= limit) {truncated = true; return;}
        const operators = globalThis.foundry?.data?.operators;
        if (operators?.ForcedReplacement && after instanceof operators.ForcedReplacement) after = operators.DataFieldOperator.get(after);
        if (operators?.ForcedDeletion && after instanceof operators.ForcedDeletion) {add(path, before, after); return;}
        if (JSON.stringify(before) === JSON.stringify(after)) return;
        if (before && after && typeof before === 'object' && typeof after === 'object'
            && !Array.isArray(before) && !Array.isArray(after)) {
            const start = changes.length;
            for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) diff(before[key], after[key], path ? `${path}.${key}` : key);
            if (changes.length === start && !truncated) add(path, before, after, 'kolejność kluczy');
        } else add(path, before, after);
    }
    function visit(current, target, prefix = '', plan = null, saved = null) {
        if (changes.length >= limit) {truncated = true; return;}
        const before = saved ?? current.toObject(), patch = plan ? plan.patch : rootUpdate(current, target);
        for (const key of Object.keys(patch ?? {}).sort((a, b) => Number(a === 'flags') - Number(b === 'flags'))) {
            // Resolve minimal dotted patches as well as whole Actor root fields.
            const previous = key.split('.').reduce((value, part) => value?.[part], before);
            diff(previous, patch[key], prefix + key);
        }
        for (const [type, field] of Object.entries(current.constructor.metadata?.embedded ?? {})) {
            if (plan) {
                const group = plan.collections.find(group => group.type === type);
                if (!group) continue;
                const existing = current.getEmbeddedCollection(type);
                const previous = new Map((before[field] ?? []).map(child => [child._id, child]));
                for (const child of group.update) visit(existing.get(child.id), null, `${prefix}${field}[${child.id}].`, child.changes, previous.get(child.id));
                for (const child of group.create) add(`${prefix}${field}[${child._id}]`, undefined, {name: child.name, _id: child._id}, 'dodanie dokumentu');
                for (const id of group.remove) add(`${prefix}${field}[${id}]`, {name: previous.get(id)?.name, _id: id}, undefined, 'usunięcie dokumentu');
                continue;
            }
            if (type === 'ActorDelta' || (!Array.isArray(target[field]) && !Array.isArray(current[field]?.contents))) continue;
            const children = target[field] ?? [];
            const existing = current.getEmbeddedCollection(type), ids = new Set(children.map(child => child._id));
            for (const child of children) {
                const old = existing.get(child._id), path = `${prefix}${field}[${child._id}]`;
                if (old) visit(old, child, path + '.'); else add(path, undefined, {name: child.name, _id: child._id}, 'dodanie dokumentu');
            }
            for (const child of existing.contents ?? existing) if (!ids.has(child.id)) add(`${prefix}${field}[${child.id}]`, {name: child.name, _id: child.id}, undefined, 'usunięcie dokumentu');
        }
    }
    visit(document, incoming, '', prepared, snapshot);
    return {changes, truncated};
}

export const diagnosticReason = reason => ({
    mixed: 'Niejednoznaczne pochodzenie dokumentu.',
    baseline: 'Stan dokumentu nie zgadza się z zapamiętaną sumą kontrolną. Nie oznacza to automatycznie ręcznej edycji.',
    legacy: 'Brak zgodnego wzorca poprzedniego importu.',
    automatic: 'Wyłącznie automatyczne przeliczenie Ran, rozmiaru żetonu lub efektu Obciążenia; pozostałe dane są zgodne z zapisanym wzorcem importu.',
    automaticScene: 'Wyłącznie różnice zapisu danych żetonów lub automatycznych efektów Obciążenia; pozostałe dane sceny są zgodne.',
    source: 'Zmiana zawartości źródłowej; brak ostrzeżenia o zmianach lokalnych.'
}[reason] ?? reason);

export function inspectionHtml(report) {
    return report.documents.filter(document => document.warning).map(document => `<li><details><summary>${escape(document.name)}</summary>
        <p>${escape(diagnosticReason(document.reason))}</p>
        ${document.targetResolved ? '' : '<p>Docelowy folder wymaga przygotowania; poniżej pokazano plan danych źródłowych.</p>'}
        <ul>${document.changes.map(change => `<li><code>${escape(change.path)}</code> (${escape(change.kind)})<br>
            Teraz: <code style="white-space:pre-wrap;overflow-wrap:anywhere">${escape(change.before)}</code><br>
            Po aktualizacji: <code style="white-space:pre-wrap;overflow-wrap:anywhere">${escape(change.after)}</code></li>`).join('')}</ul>
        ${document.truncated ? '<p>Lista została skrócona.</p>' : ''}</details></li>`).join('');
}

const documentTypes = {Actor: 'Aktor', Item: 'Przedmiot', JournalEntry: 'Dziennik', Scene: 'Scena', RollTable: 'Tabela', Macro: 'Makro'};

export function problemsHtml(problems) {
    return `<p>Te elementy pominięto i pozostały bez zmian. Pozostałą zawartość zaktualizowano. Kolejna aktualizacja spróbuje ponownie.</p>
        <ul style="max-height: min(45vh, 24rem); overflow-y: auto; overflow-wrap: anywhere;">${problems.map(problem => `<li><strong>${escape(problem.name)}</strong>
            (${escape(documentTypes[problem.type] ?? problem.type)}${problem.modules.length ? `, ${escape(problem.modules.join(', '))}` : ''}${problem.id ? `, ID ${escape(problem.id)}` : ''})<br>
            ${escape(problem.reason)}</li>`).join('')}</ul>`;
}
