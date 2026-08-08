import axios from 'axios'
import { extractUrl } from '../../lib/helper.js'

export default {
  name: 'YouTube MP4',
  command: ['ytmp4', 'yt4', 'ytvideo'],
  category: 'downloader',
  description: 'Download video MP4 dari YouTube',

  async run({ m, args, react, config }) {
    const url = extractUrl(args, m)
    if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
      return m.reply('Kirim atau reply pesan yang berisi link YouTube valid.\nContoh: .ytmp4 https://youtu.be/xxx')
    }

    await react('loading')

    try {
      const apiUrl = `${config.api.zellrayy}/download/youtube?url=${encodeURIComponent(url)}&format=mp4`
      const { data: json } = await axios.get(apiUrl)

      if (!json.status || !json.result?.downloadURL) {
        await react('error')
        return m.reply('[YouTube MP4] Gagal mengambil data. Pastikan link YouTube valid.')
      }

      const { title, downloadURL } = json.result

      const { data: buffer } = await axios.get(downloadURL, {
        responseType: 'arraybuffer',
        maxRedirects: 10
      })

      await m.sendVideo(Buffer.from(buffer), `${title || 'youtube'}.mp4`, { mimetype: 'video/mp4' })
      await react('ok')

    } catch (e) {
      await react('error')
      m.reply(`[YouTube MP4 Error] ${e.message}`)
    }
  }
}
