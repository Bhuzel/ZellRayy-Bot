import { unbanUser } from '../../lib/bannedDB.js'

export default {
  name: 'Unban User',
  command: ['unban', 'unbanuser'],
  category: 'owner',
  description: 'Membuka blokir user dari bot',
  settings: { owner: true },
  async run({ m, args }) {
    let target = args[0] ? args[0].replace(/[^0-9]/g, '') : ''
    if (!target && m.quoted) target = m.quoted.sender.split('@')[0].replace(/[^0-9]/g, '')
    if (!target) return m.reply('Tag user, reply pesan, atau masukkan nomor target.')

    unbanUser(target)
    await m.reply(`[Unban] Berhasil me-unban user *@${target}*.`, { mentions: [`${target}@s.whatsapp.net`] })
  }
}
