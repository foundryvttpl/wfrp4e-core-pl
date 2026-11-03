import {variantFlag} from './actor-variants-core.js';

let namePolicy;
const polish = () => game.system?.id === 'wfrp4e'
    && /^pl(?:-|$)/u.test(game.i18n?.lang ?? '');

// Only the suffix belonging to this managed variant is a presentation label.
export function actorVariantSuffixes(actor, policy) {
    const flag = variantFlag(actor);
    if (flag?.role !== 'secondary') return [];
    const publication = policy?.publications?.[flag.publicationKey];
    const key = policy?.moduleNameSuffixes?.[flag.module];
    const label = publication?.abbreviation ?? policy?.nameSuffixes?.[key];
    if (!label) return [];
    return [...new Set([label, ...(publication?.legacyAbbreviations ?? []),
        ...Object.entries(policy.nameSuffixes ?? {}).filter(([, value]) => value === label).map(([name]) => name)])];
}

export function withoutVariantSuffix(name, suffixes) {
    if (typeof name !== 'string') return name;
    for (const suffix of suffixes) {
        const ending = ` (${suffix})`;
        if (name.endsWith(ending) && name.length > ending.length) return name.slice(0, -ending.length);
    }
    return name;
}

export function actorChatAlias(actor, speaker, token, policy) {
    const suffixes = actorVariantSuffixes(actor, policy);
    if (!suffixes.length || typeof actor?.name !== 'string') return null;
    const flag = variantFlag(actor);
    const cleanName = withoutVariantSuffix(actor.name, suffixes);
    // Old default token names can survive an Actor rename. They must not force
    // the chat back to baseName; other token names and explicit aliases are private.
    const defaults = new Set([actor.name, cleanName]);
    if (flag.baseName) {
        defaults.add(flag.baseName);
        for (const suffix of suffixes) defaults.add(`${flag.baseName} (${suffix})`);
    }
    if (speaker?.alias && !defaults.has(speaker.alias)) return speaker.alias;
    const tokenName = token?.name ?? actor.token?.name ?? actor.prototypeToken?.name;
    if (tokenName && !defaults.has(tokenName)) return tokenName;
    return cleanName;
}

export function localizeActorChatName(message) {
    if (!namePolicy || !polish()) return;
    const ooc = globalThis.CONST?.CHAT_MESSAGE_STYLES?.OOC;
    if (ooc !== undefined && message.style === ooc) return;
    const speaker = message.speaker;
    if (!speaker) return;
    const token = speaker.scene && speaker.token
        ? game.scenes?.get(speaker.scene)?.tokens?.get(speaker.token) : null;
    const actor = token?.actor ?? game.actors?.get(speaker.actor);
    if (!actor) return;
    const alias = actorChatAlias(actor, speaker, token, namePolicy);
    if (typeof alias === 'string' && alias !== (speaker.alias || actor.name)) {
        message.updateSource({'speaker.alias': alias});
    }
}

Hooks.once('init', async () => {
    try {
        const response = await fetch(new URL('./actor-source-policy.json', import.meta.url));
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        namePolicy = await response.json();
    } catch (error) {
        console.error('WFRP PL: nie udało się wczytać nazw źródeł aktorów.', error);
    }
});
Hooks.on('preCreateChatMessage', localizeActorChatName);
