import { unbanChat, isBannedChat } from '../../lib/bannedChatDB.js'
import { extractUrl, extractText } from '../../lib/helper.js'

const GROUP_LINK_REGEX = /(?:chat\.whatsapp\.com\/|invite\/)([0-9A-Za-z]{20,26})/i

export default {
  name: 'Unban Chat Group',
  command: ['unbanchat', 'unbangroup', 'unbangrup', 'unbancol'],
  category: 'owner',
  description: 'Membuka blokir bot di grup/chat tertentu (Khusus Owner)',
  settings: { owner: true },

  async run({ m, args, react, sock }) {
    let targetJid = m.chat

    const textInput = extractText(args, m)
    const urlInput = extractUrl(args, m)
    const rawTarget = urlInput || textInput || ''
    const match = rawTarget.match(GROUP_LINK_REGEX)

    if (match) {
      try {
        const meta = await sock.groupGetInviteInfo(match[1])
        if (meta?.id) targetJid = meta.id.endsWith('@g.us') ? meta.id : `${meta.id}@g.us`
      } catch (e) {
        return m.reply(`❌ Gagal mengambil ID grup dari link: ${e.message}`)
      }
    } else if (rawTarget.includes('@g.us') || rawTarget.includes('@s.whatsapp.net')) {
      targetJid = rawTarget.trim()
    }

    if (!targetJid) {
      return m.reply('Gunakan perintah ini di dalam grup target atau masukkan JID/link grup.')
    }

    if (!isBannedChat(targetJid)) {
      return m.reply(`[Unban Chat] Chat \`${targetJid}\` tidak ada dalam daftar ban.`)
    }

    unbanChat(targetJid)
    await react('ok')
    await m.reply(`✅ *[Unban Chat]* Berhasil membuka blokir bot di chat:\n\`${targetJid}\`\n\nBot sekarang dapat merespon kembali pesan di chat ini.`)
  }
}
