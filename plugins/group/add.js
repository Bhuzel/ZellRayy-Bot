export default {
  name: 'Add Member',
  command: ['add'],
  category: 'group',
  description: 'Menambahkan member baru ke grup',
  settings: { admin: true, botAdmin: true },
  async run({ m, args, sock }) {
    let number = args[0] ? args[0].replace(/[^0-9]/g, '') : ''
    if (!number && m.quoted) number = m.quoted.sender.split('@')[0]
    if (!number) return m.reply('Masukkan nomor telepon target (contoh: .add 628xxxx).')

    const targetJid = `${number}@s.whatsapp.net`
    await sock.groupParticipantsUpdate(m.chat, [targetJid], 'add')
    await m.reply(`[Add] Mengundang/Menambahkan @${number} ke grup.`, { mentions: [targetJid] })
  }
}
