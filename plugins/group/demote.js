export default {
  name: 'Demote Admin',
  command: ['demote'],
  category: 'group',
  description: 'Menurunkan jabatan admin menjadi member biasa',
  settings: { admin: true, botAdmin: true },
  async run({ m, args, sock }) {
    let targets = (m.mentionedJid && m.mentionedJid.length) ? m.mentionedJid : []
    if (!targets.length && m.quoted) targets = [m.quoted.sender]
    if (!targets.length && args[0]) targets = [`${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net`]

    if (!targets.length) return m.reply('Tag admin atau reply pesan admin yang ingin diturunkan.')
    await sock.groupParticipantsUpdate(m.chat, targets, 'demote')
    await m.reply('[Demote] Berhasil menurunkan jabatan admin.')
  }
}
