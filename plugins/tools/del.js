export default {
  name: 'Delete Bot Message',
  command: ['del', 'delete'],
  category: 'tools',
  description: 'Hapus pesan yang dikirim oleh bot',
  settings: { premium: true },

  async run({ m, sock, chat }) {
    if (!m.quoted) {
      return m.reply('❌ Reply pesan bot yang ingin dihapus, lalu kirim *.del*')
    }

    try {
      await m.quoted.delete()
      await m.delete()
    } catch (e) {
      m.reply('❌ Gagal menghapus pesan:\n```' + (e.message || e) + '```')
    }
  }
}
