import fetch from 'node-fetch'
import { extractText } from '../../lib/helper.js'

export default {
  name: 'Spotify Search',
  command: ['spotsearch', 'searchspotify', 'carimusik'],
  category: 'search',
  description: 'Cari track lagu di Spotify',

  async run({ m, args, react, config }) {
    const query = extractText(args, m)
    if (!query) {
      return m.reply('Ketik kata kunci atau reply pesan teks.\nContoh: .spotsearch Coldplay Yellow')
    }

    await react('loading')

    try {
      const apiUrl = `${config.api.zellrayy}/search/spotify?q=${encodeURIComponent(query)}`
      const res = await fetch(apiUrl)
      const json = await res.json()

      if (!json.status || !json.result?.length) {
        await react('error')
        return m.reply('[Spotify Search] Tidak ada hasil ditemukan.')
      }

      const results = json.result.slice(0, 10)

      const list = results.map((track, i) =>
        `[${i + 1}] ${track.name}\n` +
        `    Artis: ${track.artist}\n` +
        `    Album: ${track.album}\n` +
        `    URL  : ${track.spotifyUrl}`
      ).join('\n\n')

      await m.reply(
        `[ Hasil Pencarian Spotify ]\n` +
        `Query: "${query}"\n` +
        `───────────────────────────────\n\n` +
        list
      )
      await react('ok')
    } catch (e) {
      await react('error')
      m.reply(`[Spotify Search Error] ${e.message}`)
    }
  }
}
