import { extractText } from '../../lib/helper.js'

export default {
  name: 'Hidetag',
  command: ['hidetag', 'h'],
  category: 'group',
  description: 'Tag seluruh member grup secara tersembunyi',
  settings: { admin: true, private: false },
  async run({ m, args, sock, groupMetadata }) {
    if (!groupMetadata) return m.reply('[Error] Metadata grup tidak ditemukan.')
    const participants = groupMetadata.participants || []
    const memberJids = participants.map((p) => p.id)

    const qText = extractText(args, m) || 'Pemberitahuan Grup'
    await sock.sendMessage(m.chat, {
      text: qText,
      mentions: memberJids
    })
  }
}
