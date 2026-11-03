import {SCOPE, values} from './actor-variants-core.js';

// Look at live source/embedded data without cloning whole Actors or serializing
// Babele's saved English payloads. This mirrors rewriteReferences' exclusions.
export function hasActorReference(document, pattern, names = null) {
    function walk(value, path = '', excluded = null) {
        if (typeof value === 'string') {
            if (pattern.test(value)) return true;
            if (names?.size && value.includes('game.actors.getName')) {
                for (const match of value.matchAll(/game\.actors\.getName\((['"])([^'"\n]+)\1\)/gu)) if (names.has(match[2])) return true;
            }
            return false;
        }
        if (Array.isArray(value)) return value.some(child => walk(child, path));
        if (!value || typeof value !== 'object') return false;
        for (const [key, child] of Object.entries(value)) {
            const next = path ? `${path}.${key}` : key;
            if (excluded?.has(key) || key === '_stats' || key === 'sourceId' || key === 'sourceUuid'
                || key === 'originalPayload' || next === `flags.${SCOPE}`) continue;
            if (walk(child, next)) return true;
        }
        return false;
    }
    function visit(current, path = '') {
        // Lightweight adapters without a source view retain the full check.
        if (!current._source) return walk(current.toObject(), path);
        const embedded = Object.entries(current.constructor.metadata?.embedded ?? {})
            .filter(([type, field]) => type !== 'ActorDelta'
                && (Array.isArray(current._source[field]) || Array.isArray(current[field]?.contents)));
        if (walk(current._source, path, new Set(embedded.map(([, field]) => field)))) return true;
        for (const [type, field] of embedded) {
            for (const child of values(current.getEmbeddedCollection(type))) {
                if (visit(child, path ? `${path}.${field}` : field)) return true;
            }
        }
        return false;
    }
    return visit(document);
}
