// Settings are sent together with the entire world at login. Small socket
// messages alone are insufficient: two raw snapshots can exceed V8's maximum
// string length when Foundry serializes that initial response.
export const MAX_SNAPSHOT_CHARACTERS = 64 * 1024 * 1024;
const MAX_UNPACKED_CHARACTERS = 384 * 1024 * 1024;

function base64(bytes) {
    if (typeof bytes.toBase64 === 'function') return bytes.toBase64();
    const parts = [];
    // All intermediate blocks must contain a multiple of three bytes.
    for (let offset = 0; offset < bytes.length; offset += 30_720) {
        parts.push(btoa(String.fromCharCode(...bytes.subarray(offset, offset + 30_720))));
    }
    return parts.join('');
}

function bytesFromBase64(text) {
    if (typeof Uint8Array.fromBase64 === 'function') return Uint8Array.fromBase64(text);
    const bytes = new Uint8Array(Math.floor(text.length / 4) * 3 - (text.endsWith('==') ? 2 : text.endsWith('=') ? 1 : 0));
    let position = 0;
    for (let offset = 0; offset < text.length; offset += 32_768) {
        const block = atob(text.slice(offset, offset + 32_768));
        for (let index = 0; index < block.length; index++) bytes[position++] = block.charCodeAt(index);
    }
    return bytes;
}

export async function encodeSnapshot(snapshot) {
    if (typeof CompressionStream !== 'function') throw new Error('Przeglądarka nie obsługuje kompresji kopii bezpieczeństwa. Użyj aktualnej przeglądarki lub aplikacji Foundry.');
    const text = JSON.stringify(snapshot);
    if (text.length > MAX_UNPACKED_CHARACTERS) throw new Error('Kopia operacji jest zbyt duża. Zaktualizuj mniejszą liczbę modułów naraz; nie zapisano zmian zawartości.');
    let offset = 0;
    const encoder = new TextEncoder();
    const source = new ReadableStream({pull(controller) {
        if (offset >= text.length) {controller.close(); return;}
        let end = Math.min(offset + 1_000_000, text.length);
        // Do not split a UTF-16 surrogate pair between encoder calls.
        if (end < text.length && text.charCodeAt(end - 1) >= 0xD800 && text.charCodeAt(end - 1) <= 0xDBFF) end--;
        controller.enqueue(encoder.encode(text.slice(offset, end)));
        offset = end;
    }});
    const reader = source.pipeThrough(new CompressionStream('gzip')).getReader();
    const parts = [];
    let size = 0;
    try {
        for (;;) {
            const {value, done} = await reader.read();
            if (done) break;
            size += value.length;
            if (Math.ceil(size / 3) * 4 > MAX_SNAPSHOT_CHARACTERS) {
                await reader.cancel();
                throw new Error('Skompresowana kopia operacji przekracza bezpieczny limit. Zaktualizuj mniejszą liczbę modułów naraz; nie zapisano zmian zawartości.');
            }
            parts.push(value);
        }
    } finally {reader.releaseLock();}
    const compressed = new Uint8Array(size);
    let position = 0;
    for (const part of parts) {compressed.set(part, position); position += part.length;}
    return {data: base64(compressed), encoding: 'gzip-base64', characters: text.length};
}

export async function decodeSnapshot(text, pointer) {
    if (pointer.encoding !== 'gzip-base64' || text.length > MAX_SNAPSHOT_CHARACTERS) throw new Error('Nieobsługiwany lub zbyt duży zapis kopii bezpieczeństwa. Kopia pozostaje zachowana.');
    try {
        const bytes = bytesFromBase64(text);
        let offset = 0;
        const source = new ReadableStream({pull(controller) {
            if (offset >= bytes.length) {controller.close(); return;}
            controller.enqueue(bytes.subarray(offset, offset += 65_536));
        }});
        const reader = source.pipeThrough(new DecompressionStream('gzip')).pipeThrough(new TextDecoderStream('utf-8', {fatal: true})).getReader();
        const parts = [];
        let characters = 0;
        try {
            for (;;) {
                const {value, done} = await reader.read();
                if (done) break;
                characters += value.length;
                if (characters > MAX_UNPACKED_CHARACTERS) {await reader.cancel(); throw new Error('Przekroczony rozmiar kopii.');}
                parts.push(value);
            }
        } finally {reader.releaseLock();}
        if (characters !== pointer.characters) throw new Error('Niepełna kopia bezpieczeństwa.');
        return JSON.parse(parts.join(''));
    } catch (cause) {
        throw new Error('Nie można odczytać kompletnej kopii bezpieczeństwa. Nie zmieniono zawartości; kopia pozostaje zachowana.', {cause});
    }
}
