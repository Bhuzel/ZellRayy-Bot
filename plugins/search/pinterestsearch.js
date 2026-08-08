import fetch from 'node-fetch'
import fetchBuffer from '../../lib/fetchBuffer.js'
import { extractText } from '../../lib/helper.js'

export default {
  name: 'Pinterest Search',
  command: ['pinsearch', 'pinterestsearch', 'pins'],
  category: 'search',
  description: 'Cari & dapatkan gambar dari Pinterest',

  async run({ m, args, react, config }) {
    const query = extractText(args, m)
    if (!query) {
      return m.reply('Ketik kata kunci atau reply pesan teks.\nContoh: .pinsearch aesthetic wallpaper')
    }

    await react('loading')

    try {
      const apiUrl = `${config.api.zellrayy}/search/pinterest?q=${encodeURIComponent(query)}`
      const res = await fetch(apiUrl)
      const json = await res.json()

      if (!json.status || !json.result?.length) {
        await react('error')
        return m.reply('[Pinterest Search] Tidak ada hasil ditemukan.')
      }

      const results = json.result.filter(r => r.image)
      if (!results.length) {
        await react('error')
        return m.reply('[Pinterest Search] Gambar tidak ditemukan.')
      }

      const pick = results[Math.floor(Math.random() * results.length)]
      const buffer = await fetchBuffer(pick.image)

      const caption =
        `[ Pinterest Search ]\n` +
        `Query : ${query}\n` +
        `Judul : ${pick.title || '-'}\n` +
        `User  : ${pick.fullName || pick.username || '-'}`

      await m.sendImage(buffer, caption)
      await react('ok')
    } catch (e) {
      await react('error')
      m.reply(`[Pinterest Search Error] ${e.message}`)
    }
  }
}
