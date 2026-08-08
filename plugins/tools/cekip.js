import fetch from 'node-fetch'
import { extractText } from '../../lib/helper.js'

export default {
  name: 'Cek IP',
  command: ['cekip', 'ipcek', 'ip'],
  category: 'tools',
  description: 'Memeriksa detail lokasi dan ISP dari IP address / domain',

  async run({ m, args, react }) {
    const query = extractText(args, m)
    if (!query) {
      return m.reply('Masukkan IP address atau domain.\nContoh: .cekip 1.1.1.1 atau .cekip google.com')
    }

    await react('loading')

    try {
      const res = await fetch(`https://ipwho.is/${encodeURIComponent(query)}`)
      const data = await res.json()

      if (!data.success) {
        await react('error')
        return m.reply(`[Cek IP Error] ${data.message || 'IP / Domain tidak ditemukan.'}`)
      }

      const text = `[ Detail IP Address ]\n\n` +
        `IP         : ${data.ip}\n` +
        `Tipe       : ${data.type}\n` +
        `Benua      : ${data.continent}\n` +
        `Negara     : ${data.country} (${data.country_code})\n` +
        `Wilayah    : ${data.region}\n` +
        `Kota       : ${data.city}\n` +
        `Kode Pos   : ${data.postal || '-'}\n` +
        `ISP        : ${data.connection?.isp || '-'}\n` +
        `Organisasi : ${data.connection?.org || '-'}\n` +
        `ASN        : ${data.connection?.asn || '-'}\n` +
        `Timezone   : ${data.timezone?.id || '-'} (${data.timezone?.utc || '-'})\n` +
        `Koordinat  : ${data.latitude}, ${data.longitude}`

      await m.reply(text)
      await react('ok')
    } catch (e) {
      await react('error')
      m.reply(`[Cek IP Error] ${e.message}`)
    }
  }
}
