import fetch from 'node-fetch'
import { extractUrl } from '../../lib/helper.js'

export default {
  name: 'Spotify Downloader',
  command: ['spotify', 'sptfy', 'spotdl'],
  category: 'downloader',
  description: 'Download audio MP3 lagu Spotify',

  async run({ m, args, react, config }) {
    const url = extractUrl(args, m)
    if (!url || !url.includes('spotify.com/track')) {
      return m.reply('Kirim atau reply pesan yang berisi link Spotify track valid.\nContoh: .spotify https://open.spotify.com/track/xxx')
    }

    await react('loading')

    try {
      const apiUrl = `${config.api.zellrayy}/download/spotify?url=${encodeURIComponent(url)}`
      const res = await fetch(apiUrl)
      const json = await res.json()

      if (!json.status || !json.result?.download) {
        await react('error')
        return m.reply('[Spotify Error] Gagal mengambil data track.')
      }

      const { title, artist, duration, download } = json.result

      const totalSec = Math.floor((duration || 0) / 1000)
      const mins = Math.floor(totalSec / 60)
      const secs = String(totalSec % 60).padStart(2, '0')
      const durationStr = `${mins}:${secs}`

      await m.reply(
        `[ Spotify Downloader ]\n\n` +
        `Judul : ${title}\n` +
        `Artis : ${artist}\n` +
        `Durasi: ${durationStr}`
      )

      const audioRes = await fetch(download)
      if (!audioRes.ok) throw new Error(`Gagal fetch audio: ${audioRes.status}`)

      const buffer = Buffer.from(await audioRes.arrayBuffer())

      await m.sendDocument(buffer, `${title || 'track'} - ${artist || 'artist'}.mp3`, { mimetype: 'audio/mpeg' })
      await react('ok')
    } catch (e) {
      await react('error')
      m.reply(`[Spotify Error] ${e.message}`)
    }
  }
}
