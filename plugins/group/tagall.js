import { extractText } from '../../lib/helper.js'

export default {
  name: 'Tag All Members',
  command: ['tagall'],
  category: 'group',
  description: 'Tag seluruh member grup dengan rincian nama',
  settings: { admin: true, private: false },
  async run({ m, args, sock, groupMetadata }) {
    if (!groupMetadata) return m.reply('[Error] Metadata grup tidak ditemukan.')
    const participants = groupMetadata.participants || []
    const memberJids = participants.map((p) => p.id)

    const pesan = extractText(args, m) || 'Pemberitahuan Grup'
    let text = `[ TAG ALL MEMBERS ]\nPesan: ${pesan}\n\n`
    for (const p of participants) {
      text += `◦ @${p.id.split('@')[0]}\n`
    }
    await sock.sendMessage(m.chat, { text, mentions: memberJids })
  }
}
