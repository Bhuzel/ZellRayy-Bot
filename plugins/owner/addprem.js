import { addPremium } from '../../lib/premiumDB.js'

export default {
  name: 'Tambahkan Member Premium',
  command: ['addprem'],
  category: 'owner',
  description: 'Menambahkan status member premium',
  settings: { owner: true },
  async run({ m, args }) {
    let target = args[0] ? args[0].replace(/[^0-9]/g, '') : ''
    if (!target && m.quoted) target = m.quoted.sender.split('@')[0].replace(/[^0-9]/g, '')
    if (!target) return m.reply('Tag user, reply pesan, atau masukkan nomor target.')

    addPremium(target)
    await m.reply(`[Premium] Berhasil menambahkan *@${target}* sebagai Member Premium.`, { mentions: [`${target}@s.whatsapp.net`] })
  }
}
