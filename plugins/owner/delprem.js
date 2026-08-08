import { removePremium } from '../../lib/premiumDB.js'

export default {
  name: 'Remove Premium',
  command: ['delprem'],
  category: 'owner',
  description: 'Menghapus status member premium',
  settings: { owner: true },
  async run({ m, args }) {
    let target = args[0] ? args[0].replace(/[^0-9]/g, '') : ''
    if (!target && m.quoted) target = m.quoted.sender.split('@')[0].replace(/[^0-9]/g, '')
    if (!target) return m.reply('Tag user, reply pesan, atau masukkan nomor target.')

    removePremium(target)
    await m.reply(`[Premium] Berhasil menghapus *@${target}* dari Member Premium.`, { mentions: [`${target}@s.whatsapp.net`] })
  }
}
