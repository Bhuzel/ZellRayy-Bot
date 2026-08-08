import { getBannedList } from '../../lib/bannedDB.js'

export default {
  name: 'List Banned User',
  command: ['listban'],
  category: 'owner',
  description: 'Menampilkan daftar user yang di-ban',
  settings: { owner: true },
  async run({ m }) {
    const banned = getBannedList()
    if (!banned.length) return m.reply('[Banned] Tidak ada user ter-ban.')
    await m.reply(`[ Daftar User Banned ]\n` + banned.map((n, i) => `${i + 1}. @${n}`).join('\n'), { mentions: banned.map(n => `${n}@s.whatsapp.net`) })
  }
}
