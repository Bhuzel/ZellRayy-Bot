import { addOwner } from '../../lib/ownerDB.js'

export default {
  name: 'Tambahkan Extra Owner',
  command: ['addowner'],
  category: 'owner',
  description: 'Menambahkan daftar extra owner bot',
  settings: { owner: true },
  async run({ m, args }) {
    let target = args[0] ? args[0].replace(/[^0-9]/g, '') : ''
    if (!target && m.quoted) target = m.quoted.sender.split('@')[0].replace(/[^0-9]/g, '')
    if (!target) return m.reply('Tag user, reply pesan, atau masukkan nomor target.')

    addOwner(target)
    await m.reply(`[Owner] Berhasil menambahkan *@${target}* sebagai Owner Bot.`, { mentions: [`${target}@s.whatsapp.net`] })
  }
}
