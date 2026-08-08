import fetch from 'node-fetch'
import { extractText } from '../../lib/helper.js'

export default {
  name: 'YouTube Play Music',
  command: ['ytplay', 'ytplaymusic', 'play'],
  category: 'downloader',
  description: 'Cari & download audio lagu dari YouTube via kata kunci',

  async run({ m, args, react, config }) {
    const query = extractText(args, m)
    if (!query) {
      return m.reply('Ketik kata kunci atau reply pesan yang berisi judul lagu.\nContoh: .play Bruno Mars Die With A Smile')
    }

    await react('loading')

    try {
      const apiUrl = `${config.api.zellrayy}/download/ytplaymusic?q=${encodeURIComponent(query)}`
      const res = await fetch(apiUrl)
      const json = await res.json()

      if (!json.status || !json.result?.download) {
        await react('error')
        return m.reply('[YouTube Play] Lagu tidak ditemukan.')
      }

      const { title, filesize, duration, download } = json.result

      const totalSec = Math.floor(duration || 0)
      const mins = Math.floor(totalSec / 60)
      const secs = String(totalSec % 60).padStart(2, '0')
      const durationStr = `${mins}:${secs}`
      const sizeMB = filesize ? (filesize / 1024 / 1024).toFixed(2) : '-'

      await m.reply(
        `[ YouTube Play ]\n\n` +
        `Judul : ${title}\n` +
        `Durasi: ${durationStr} | Ukuran: ${sizeMB} MB`
      )

      const audioRes = await fetch(download)
      if (!audioRes.ok) throw new Error(`Gagal fetch audio: ${audioRes.status}`)

      const buffer = Buffer.from(await audioRes.arrayBuffer())

      await m.sendDocument(buffer, `${title || 'song'}.mp3`, { mimetype: 'audio/mpeg' })
      await react('ok')
    } catch (e) {
      await react('error')
      m.reply(`[YouTube Play Error] ${e.message}`)
    }
  }
}
