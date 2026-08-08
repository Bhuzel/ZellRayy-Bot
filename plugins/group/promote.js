export default {
  name: 'Promote Admin',
  command: ['promote'],
  category: 'group',
  description: 'Menaikkan jabatan member menjadi admin grup',
  settings: { admin: true, botAdmin: true },
  async run({ m, args, sock }) {
    let targets = (m.mentionedJid && m.mentionedJid.length) ? m.mentionedJid : []
    if (!targets.length && m.quoted) targets = [m.quoted.sender]
    if (!targets.length && args[0]) targets = [`${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net`]

    if (!targets.length) return m.reply('Tag user atau reply pesan member yang ingin dijadikan admin.')
    await sock.groupParticipantsUpdate(m.chat, targets, 'promote')
    await m.reply('[Promote] Berhasil menaikkan jabatan admin.')
  }
}
