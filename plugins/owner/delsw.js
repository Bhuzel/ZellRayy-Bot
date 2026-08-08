import { buildStatusJidList } from '../../lib/helper.js'

global.sentStatusKeys = global.sentStatusKeys || []

export default {
  name: 'Hapus Status',
  command: ['delsw', 'deletesw', 'hapussw'],
  category: 'owner',
  settings: { owner: true },
  description: 'Menghapus seluruh Status WhatsApp yang pernah diunggah oleh bot',

  async run({ m, react, sock }) {
    await react('loading')

    try {
      if (!global.sentStatusKeys.length) {
        if (m.quoted) {
          try {
            // Kita tidak tahu persis statusJidList asli status yang di-reply ini
            // (misal statusnya dibuat manual lewat WA, bukan lewat .sw), jadi kita
            // rekonstruksi daftar penerima yang sama seperti yang dipakai .sw supaya
            // revoke tetap nyampe ke kontak-kontak yang mungkin melihat status ini.
            const statusJidList = buildStatusJidList(sock, m.quoted.sender || m.sender)
            await sock.sendMessage('status@broadcast', {
              delete: {
                remoteJid: 'status@broadcast',
                fromMe: true,
                id: m.quoted.isBaileys ? m.quoted.id : m.quoted.msg?.id
              }
            }, { statusJidList })
            await react('ok')
            return m.reply('[Delete Status] Status yang di-reply berhasil dihapus.')
          } catch (e) {
            await react('error')
            return m.reply(`[Delete Status Error] Gagal menghapus status reply: ${e.message}`)
          }
        }

        await react('ok')
        return m.reply('[Delete Status] Tidak ada riwayat status di memory bot. Reply status yang ingin dihapus lalu ketik *.delsw*.')
      }

      let deletedCount = 0
      for (const entry of global.sentStatusKeys) {
        try {
          const id = typeof entry === 'object' ? (entry.key?.id || entry.id) : entry
          // Kalau entry lama (format string doang, dari sebelum fix ini), kita tetap
          // fallback bangun statusJidList supaya minimal tetap mencoba broadcast delete
          // ke kontak yang diketahui, bukan cuma ke bot sendiri.
          const statusJidList = (typeof entry === 'object' && entry.statusJidList) || buildStatusJidList(sock, m.sender)

          await sock.sendMessage('status@broadcast', {
            delete: {
              remoteJid: 'status@broadcast',
              fromMe: true,
              id
            }
          }, { statusJidList })
          deletedCount++
        } catch (e) {
          console.error('[DelSW Error]:', e.message)
        }
      }

      global.sentStatusKeys = []
      await react('ok')
      await m.reply(`[Delete Status] Berhasil menghapus ${deletedCount} status dari WhatsApp.`)

    } catch (e) {
      console.error('[DelSW Error]:', e)
      await react('error')
      await m.reply(`[Delete Status Error] ${e.message}`)
    }
  }
}