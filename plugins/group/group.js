export default {
  name: 'Grup Setting',
  command: ['group'],
  category: 'group',
  description: 'Membuka atau menutup chat grup',
  settings: { admin: true, botAdmin: true },
  async run({ m, args, sock }) {
    const action = args[0]?.toLowerCase()
    if (action === 'open' || action === 'buka') {
      await sock.groupSettingUpdate(m.chat, 'not_announcement')
      await m.reply('[Group] Grup berhasil dibuka. Semua member dapat mengirim pesan.')
    } else if (action === 'close' || action === 'tutup') {
      await sock.groupSettingUpdate(m.chat, 'announcement')
      await m.reply('[Group] Grup berhasil ditutup. Hanya admin yang dapat mengirim pesan.')
    } else {
      await m.reply('Ketik .group open untuk membuka grup atau .group close untuk menutup grup.')
    }
  }
}
