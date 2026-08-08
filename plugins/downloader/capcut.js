import fetch from 'node-fetch'
import { extractUrl } from '../../lib/helper.js'

export default {
  name: 'CapCut Downloader',
  command: ['capcut', 'cc', 'capcutdl'],
  category: 'downloader',
  description: 'Download video CapCut tanpa watermark',

  async run({ m, args, react, config }) {
    const url = extractUrl(args, m)
    if (!url || !url.includes('capcut.com')) {
      return m.reply('Kirim atau reply pesan yang berisi link CapCut valid.\nContoh: .capcut https://www.capcut.com/t/xxx')
    }

    await react('loading')

    try {
      const apiUrl = `${config.api.zellrayy}/download/capcut?url=${encodeURIComponent(url)}`
      const res = await fetch(apiUrl)
      const json = await res.json()

      if (!json.status || !json.result?.mediaUrls?.length) {
        await react('error')
        return m.reply('[CapCut Error] Gagal mengambil data video.')
      }

      const { title, mediaUrls } = json.result
      const best = mediaUrls[0]

      const videoRes = await fetch(best.url)
      if (!videoRes.ok) throw new Error(`Gagal fetch video: ${videoRes.status}`)

      const buffer = Buffer.from(await videoRes.arrayBuffer())

      const safeTitle = (title || 'capcut').replace(/[#\n]/g, '').trim().slice(0, 50) || 'capcut'
      await m.sendDocument(buffer, `${safeTitle}.mp4`, { mimetype: 'video/mp4' })
      await react('ok')

    } catch (e) {
      await react('error')
      m.reply(`[CapCut Error] ${e.message}`)
    }
  }
}
