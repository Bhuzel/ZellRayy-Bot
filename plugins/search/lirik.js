import fetch from 'node-fetch'
import fetchBuffer from '../../lib/fetchBuffer.js'
import { extractText } from '../../lib/helper.js'

export default {
  name: 'Search Lirik Lagu',
  command: ['lirik', 'liriksearch', 'liriklagu', 'lyrics'],
  category: 'search',
  description: 'Pencarian lirik lagu berdasarkan judul/penyanyi',

  async run({ m, args, react, config }) {
    const query = extractText(args, m)
    if (!query) {
      return m.reply('Masukkan judul lagu atau reply pesan teks.\nContoh: .lirik Risk It All')
    }

    await react('loading')

    try {
      const apiUrl = `${config.api.zellrayy}/search/lirik?q=${encodeURIComponent(query)}`
      const res = await fetch(apiUrl)
      const json = await res.json()

      const resData = json.result || json.data || json

      const lyrics = resData.plainLyrics || resData.lyrics || resData.lirik || ''
      if (!json.status || !lyrics) {
        await react('error')
        return m.reply('[Lirik] Lirik lagu tidak ditemukan untuk kata kunci tersebut.')
      }

      const title = resData.trackName || resData.name || resData.title || query
      const artist = resData.artistName || resData.artist || '-'
      const album = resData.albumName || resData.album || '-'
      const image = resData.image || resData.thumbnail || resData.cover || resData.artwork || ''

      const fullText = `[ Lirik Lagu ]\n\n` +
        `• Judul    : ${title}\n` +
        `• Penyanyi : ${artist}\n` +
        `• Album    : ${album}\n` +
        `───────────────────────────────\n\n` +
        `${lyrics.trim()}`

      if (image) {
        try {
          const imgBuf = await fetchBuffer(image)
          await m.sendImage(imgBuf, fullText)
          await react('ok')
          return
        } catch {
          // fallback to text if image fails
        }
      }

      await m.reply(fullText)
      await react('ok')

    } catch (e) {
      await react('error')
      m.reply(`[Lirik Error] ${e.message}`)
    }
  }
}
