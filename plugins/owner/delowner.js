import { removeOwner } from '../../lib/ownerDB.js'

export default {
  name: 'Hapus Extra Owner',
  command: ['delowner'],
  category: 'owner',
  description: 'Menghapus daftar extra owner bot',
  settings: { owner: true },
  async run({ m, args }) {
    let target = args[0] ? args[0].replace(/[^0-9]/g, '') : ''
    if (!target && m.quoted) target = m.quoted.sender.split('@')[0].replace(/[^0-9]/g, '')
    if (!target) return m.reply('Tag user, reply pesan, atau masukkan nomor target.')

    removeOwner(target)
    await m.reply(`[Owner] Berhasil menghapus *@${target}* dari daftar Owner.`, { mentions: [`${target}@s.whatsapp.net`] })
  }
}
