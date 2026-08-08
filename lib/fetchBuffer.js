import fetch from 'node-fetch'

/**
 * Ambil buffer dari URL.
 * @param {string} url
 * @param {object} [options] - opsional, diteruskan langsung ke node-fetch (misal { headers: {...} })
 * @returns {Promise<Buffer>}
 */
export default async function fetchBuffer(url, options = {}) {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`Gagal fetch buffer, status: ${res.status}`)
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
