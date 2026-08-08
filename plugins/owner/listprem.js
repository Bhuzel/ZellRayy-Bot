import { getExtraPremium } from '../../lib/premiumDB.js'

export default {
  name: 'List Premium',
  command: ['listprem'],
  category: 'owner',
  description: 'Menampilkan daftar member premium',
  settings: { owner: true },
  async run({ m }) {
    const prems = getExtraPremium()
    if (!prems.length) return m.reply('[Premium] Tidak ada user premium terdaftar.')
    await m.reply(`[ Daftar Member Premium ]\n` + prems.map((n, i) => `${i + 1}. @${n}`).join('\n'), { mentions: prems.map(n => `${n}@s.whatsapp.net`) })
  }
}
