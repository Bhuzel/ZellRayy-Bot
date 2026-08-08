import { getExtraOwners } from '../../lib/ownerDB.js'

export default {
  name: 'List Extra Owner',
  command: ['listowner'],
  category: 'owner',
  description: 'Menampilkan daftar extra owner bot',
  settings: { owner: true },
  async run({ m }) {
    const owners = getExtraOwners()
    if (!owners.length) return m.reply('[Owner] Tidak ada extra owner terdaftar.')
    await m.reply(`[ Daftar Extra Owner ]\n` + owners.map((n, i) => `${i + 1}. @${n}`).join('\n'), { mentions: owners.map(n => `${n}@s.whatsapp.net`) })
  }
}
