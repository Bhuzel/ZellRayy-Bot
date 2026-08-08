import { banChat, isBannedChat } from '../../lib/bannedChatDB.js'
import { extractUrl, extractText } from '../../lib/helper.js'

const GROUP_LINK_REGEX = /(?:chat\.whatsapp\.com\/|invite\/)([0-9A-Za-z]{20,26})/i

export default {
  name: 'Ban Chat Group Tertentu',
  command: ['banchat', 'bangroup', 'bangrup', 'bancol'],
  category: 'owner',
  description: 'Memblokir bot agar tidak merespon di grup/chat tertentu (Khusus Owner)',
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

    if (isBannedChat(targetJid)) {
      return m.reply(`[Ban Chat] Chat \`${targetJid}\` sudah berada dalam daftar ban.`)
    }

    banChat(targetJid)
    await react('ok')
    await m.reply(`✅ *[Ban Chat]* Berhasil memblokir bot di chat:\n\`${targetJid}\`\n\nBot tidak akan merespon pesan/perintah anggota di chat ini.`)
  }
}
