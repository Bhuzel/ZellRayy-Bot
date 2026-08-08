import fetch from 'node-fetch'
import { extractUrl } from '../../lib/helper.js'

export default {
  name: 'SoundCloud Downloader',
  command: ['soundcloud', 'sc', 'scloud'],
  category: 'downloader',
  description: 'Download audio MP3 dari SoundCloud',

  async run({ m, args, react, config }) {
    const url = extractUrl(args, m)
    if (!url || !url.includes('soundcloud.com')) {
      return m.reply('Kirim atau reply pesan yang berisi link SoundCloud valid.\nContoh: .soundcloud https://soundcloud.com/xxx/xxx')
    }

    await react('loading')

    try {
      const apiUrl = `${config.api.zellrayy}/download/soundcloud?url=${encodeURIComponent(url)}`
      const res = await fetch(apiUrl)
      const json = await res.json()

      if (!json.status || !json.result?.downloadUrl) {
        await react('error')
        return m.reply('[SoundCloud Error] Gagal mengambil data track.')
      }

      const { title, artist, durationMs, downloadUrl } = json.result

      const totalSec = Math.floor((durationMs || 0) / 1000)
      const mins = Math.floor(totalSec / 60)
      const secs = String(totalSec % 60).padStart(2, '0')
      const durationStr = `${mins}:${secs}`

      await m.reply(
        `[ SoundCloud Downloader ]\n\n` +
        `Judul : ${title}\n` +
        `Artis : ${artist}\n` +
        `Durasi: ${durationStr}`
      )

      const audioRes = await fetch(downloadUrl)
      if (!audioRes.ok) throw new Error(`Gagal fetch audio: ${audioRes.status}`)

      const buffer = Buffer.from(await audioRes.arrayBuffer())

      await m.sendDocument(buffer, `${title || 'track'} - ${artist || 'soundcloud'}.mp3`, { mimetype: 'audio/mpeg' })
      await react('ok')

    } catch (e) {
      await react('error')
      m.reply(`[SoundCloud Error] ${e.message}`)
    }
  }
}
