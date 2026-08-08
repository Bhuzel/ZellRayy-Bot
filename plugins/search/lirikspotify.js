import fetch from 'node-fetch'
import { extractUrl } from '../../lib/helper.js'

export default {
  name: 'Search Lirik Dari Link Spotify',
  command: ['lirikspotify'],
  category: 'search',
  description: 'Ambil lirik lagu dari link Spotify',

  async run({ m, args, react, config }) {
    const url = extractUrl(args, m)
    if (!url || !url.includes('spotify.com/track')) {
      return m.reply('Kirim atau reply pesan yang berisi link Spotify track valid.\nContoh: .lirikspotify https://open.spotify.com/track/xxx')
    }

    await react('loading')

    try {
      const apiUrl = `${config.api.zellrayy}/search/lirik-spotify?url=${encodeURIComponent(url)}`
      const res = await fetch(apiUrl)
      const json = await res.json()

      if (!json.status || !json.result) {
        await react('error')
        return m.reply('[Lirik Spotify] Gagal mengambil data lirik.')
      }

      const { metadata, lyrics } = json.result

      if (!lyrics || lyrics.instrumental || !lyrics.plain) {
        await react('error')
        return m.reply(`[Lirik Spotify] Lirik tidak tersedia untuk lagu ${metadata?.title || '-'}.`)
      }

      const { title, artists, duration, album } = metadata
      const artistNames = Array.isArray(artists) ? artists.join(', ') : artists

      const header =
        `[ Lirik Spotify ]\n` +
        `Judul : ${title}\n` +
        `Artis : ${artistNames}\n` +
        `Album : ${album?.name || '-'}\n` +
        `───────────────────────────────\n\n`

      const fullText = header + lyrics.plain

      const MAX = 4000
      if (fullText.length <= MAX) {
        await m.reply(fullText)
      } else {
        await m.reply(header + lyrics.plain.slice(0, MAX - header.length))
        let offset = MAX - header.length
        while (offset < lyrics.plain.length) {
          await m.reply(lyrics.plain.slice(offset, offset + MAX))
          offset += MAX
        }
      }
      await react('ok')
    } catch (e) {
      await react('error')
      m.reply(`[Lirik Spotify Error] ${e.message}`)
    }
  }
}
