import { banUser } from '../../lib/bannedDB.js'

export default {
  name: 'Ban User',
  command: ['ban', 'banuser'],
  category: 'owner',
  description: 'Memblokir user dari penggunaan bot',
  settings: { owner: true },
  async run({ m, args }) {
    let target = args[0] ? args[0].replace(/[^0-9]/g, '') : ''
    if (!target && m.quoted) target = m.quoted.sender.split('@')[0].replace(/[^0-9]/g, '')
    if (!target) return m.reply('Tag user, reply pesan, atau masukkan nomor target.')

    banUser(target)
    await m.reply(`[Banned] Berhasil me-ban user *@${target}* dari penggunaan bot.`, { mentions: [`${target}@s.whatsapp.net`] })
  }
}
