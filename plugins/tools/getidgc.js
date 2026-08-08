import { extractUrl, extractText } from '../../lib/helper.js'

const GROUP_LINK_REGEX = /(?:chat\.whatsapp\.com\/|invite\/)([0-9A-Za-z]{20,26})/i

export default {
  name: 'Get ID Group',
  command: ['getidgc', 'cekidgc', 'idgc', 'idgroup'],
  category: 'tools',
  description: 'Cek ID/JID Group Chat secara langsung di grup atau dari link grup WhatsApp',

  async run({ m, args, react, sock }) {
    const textInput = extractText(args, m)
    const urlInput = extractUrl(args, m)
    const rawTarget = urlInput || textInput || ''
    const match = rawTarget.match(GROUP_LINK_REGEX)
    const inviteCode = match ? match[1] : (!rawTarget.includes(' ') && rawTarget.length >= 20 && rawTarget.length <= 26 ? rawTarget : null)

    await react('loading')

    try {
      if (inviteCode) {
        try {
          const meta = await sock.groupGetInviteInfo(inviteCode)
          const subject = meta.subject || 'Grup WhatsApp'
          const jid = meta.id ? (meta.id.endsWith('@g.us') ? meta.id : `${meta.id}@g.us`) : '-'
          const owner = meta.owner ? meta.owner.split('@')[0] : '-'
          const size = meta.size || meta.participants?.length || '-'
          const desc = meta.desc || '-'

          const text = `*🔍 Cek ID Group (Via Link)*\n\n` +
            `• Nama Group : *${subject}*\n` +
            `• Group ID   : \`${jid}\`\n` +
            (owner !== '-' ? `• Pembuat    : @${owner}\n` : '') +
            `• Anggota    : ${size} member\n` +
            (desc !== '-' ? `• Deskripsi  : ${desc.slice(0, 120)}${desc.length > 120 ? '...' : ''}\n` : '')

          await m.reply(text, { mentions: meta.owner ? [meta.owner] : [] })
          await react('ok')
          return
        } catch (e) {
          await react('error')
          return m.reply(`[Cek ID GC Error] Gagal mendapatkan info dari link grup: ${e.message || 'Link tidak valid atau kadaluarsa.'}`)
        }
      }

      if (m.isGroup) {
        let metadata = null
        try {
          metadata = await sock.groupMetadata(m.chat)
        } catch (e) {
          // fallback jika metadata gagal
        }

        const subject = metadata?.subject || 'Grup Ini'
        const jid = m.chat
        const memberCount = metadata?.participants?.length || '-'
        const owner = metadata?.owner || metadata?.subjectOwner || '-'

        const text = `*🔍 Cek ID Group (Grup Saat Ini)*\n\n` +
          `• Nama Group   : *${subject}*\n` +
          `• Group ID     : \`${jid}\`\n` +
          (owner !== '-' ? `• Pembuat JID  : \`${owner}\`\n` : '') +
          `• Total Member : ${memberCount}`

        await m.reply(text)
        await react('ok')
        return
      }

      await react('error')
      return m.reply(
        '*[ Cek ID Group Chat ]*\n\n' +
        'Perintah ini digunakan untuk mengecek ID/JID unik grup WhatsApp.\n\n' +
        '📌 *Cara Penggunaan*:\n' +
        '1. Ketik `.cekidgc` langsung di dalam grup.\n' +
        '2. Ketik `.cekidgc <link_grup_wa>`\n' +
        '3. Reply link grup WhatsApp lalu ketik `.cekidgc`\n\n' +
        'Contoh:\n' +
        '`.cekidgc https://chat.whatsapp.com/B1Xxxxxxxxxx`'
      )
    } catch (e) {
      await react('error')
      await m.reply(`[Cek ID GC Error] ${e.message}`)
    }
  }
}
