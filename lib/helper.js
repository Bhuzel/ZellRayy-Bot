const URL_REGEX = /https?:\/\/[^\s]+/i

/**
 * Ekstrak URL dari argumen command atau dari pesan yang di-reply (m.quoted).
 * @param {string[]} args
 * @param {object} m
 * @returns {string|null}
 */
export function extractUrl(args = [], m = {}) {
  const text = args.join(' ').trim()
  if (text) {
    const match = text.match(URL_REGEX)
    if (match) return match[0]
  }

  if (m && m.quoted) {
    const qText =
      m.quoted.text ||
      m.quoted.body ||
      m.quoted.caption ||
      (m.quoted.msg && (m.quoted.msg.text || m.quoted.msg.caption || m.quoted.msg.matchedText)) ||
      ''
    const match = qText.match(URL_REGEX)
    if (match) return match[0]
  }

  return null
}

/**
 * Ekstrak teks query dari argumen command atau dari pesan yang di-reply (m.quoted).
 * @param {string[]} args
 * @param {object} m
 * @returns {string}
 */
export function extractText(args = [], m = {}) {
  const text = args.join(' ').trim()
  if (text) return text

  if (m && m.quoted) {
    const qText =
      m.quoted.text ||
      m.quoted.body ||
      m.quoted.caption ||
      (m.quoted.msg && (m.quoted.msg.text || m.quoted.msg.caption)) ||
      ''
    if (qText.trim()) return qText.trim()
  }

  return ''
}

/**
 * Bangun daftar JID penerima (statusJidList) untuk posting/menghapus Status WhatsApp.
 * PENTING: WhatsApp/Baileys mewajibkan `statusJidList` yang SAMA persis dipakai saat
 * mengirim status DAN saat menghapusnya. Kalau tidak, notifikasi hapus (revoke) cuma
 * nyampe ke device bot sendiri — status akan tampak "terhapus" di nomor bot, tapi
 * kontak/nomor lain yang sudah menerima status itu tidak pernah dapat notifikasi hapus,
 * jadi status itu tetap kelihatan buat mereka sampai 24 jam.
 * @param {import('@whiskeysockets/baileys').WASocket} sock
 * @param {string} senderJid
 * @returns {string[]}
 */
export function buildStatusJidList(sock, senderJid) {
  const botJid = (sock.user?.id || '').split(':')[0] + '@s.whatsapp.net'
  const statusJids = new Set([senderJid, botJid].filter(Boolean))

  if (sock.store?.contacts) {
    for (const jid of Object.keys(sock.store.contacts)) {
      if (jid.endsWith('@s.whatsapp.net')) statusJids.add(jid)
    }
  }

  return Array.from(statusJids)
}