export async function loadSamples(signal) {
  // Vite serves public assets at the root; raw source hosting retains public/.
  const base = new URL(
    import.meta.env ? './samples/' : './public/samples/',
    globalThis.location.href
  );
  const response = await fetch(new URL('manifest.json', base), { signal });
  if (!response.ok) {
    throw new Error('Cannot load public sample manifest');
  }
  const manifest = await response.json();
  const transfer = new globalThis.DataTransfer();
  const references = {};
  for (const record of manifest.records) {
    const audio = await fetch(new URL(record.file, base), { signal });
    if (!audio.ok) {
      throw new Error(`Cannot load ${record.file}`);
    }
    const bytes = await audio.arrayBuffer();
    const hash = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    const digest = Array.from(new Uint8Array(hash), (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('');
    if (digest !== record.sha256) {
      throw new Error(`Public sample hash mismatch: ${record.file}`);
    }
    transfer.items.add(
      new globalThis.File([bytes], record.file, { type: 'audio/wav' })
    );
    references[record.file] = record.reference;
  }
  return { files: transfer.files, references };
}
