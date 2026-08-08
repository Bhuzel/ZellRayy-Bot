import fetch from 'node-fetch'
import { extractUrl } from '../../lib/helper.js'

export default {
  name: 'Dailymotion Downloader',
  command: ['dailymotion', 'dm', 'dmdl'],
  category: 'downloader',
  description: 'Download video Dailymotion',

  async run({ m, args, react, config }) {
    const url = extractUrl(args, m)
    if (!url || !url.includes('dailymotion.com')) {
      return m.reply('Kirim atau reply pesan yang berisi link Dailymotion valid.\nContoh: .dailymotion https://www.dailymotion.com/video/xxx')
    }

    await react('loading')

    try {
      const apiUrl = `${config.api.zellrayy}/download/dailymotion?url=${encodeURIComponent(url)}`
      const res = await fetch(apiUrl)
      const json = await res.json()

      if (!json.status || !json.result?.medias?.length) {
        await react('error')
        return m.reply('[Dailymotion Error] Gagal mengambil data video.')
      }

      const { title, duration, medias } = json.result
      const best = medias[medias.length - 1]

      const videoRes = await fetch(best.url)
      if (!videoRes.ok) throw new Error(`Gagal fetch video: ${videoRes.status}`)

      const buffer = Buffer.from(await videoRes.arrayBuffer())
      await m.sendDocument(buffer, `${title || 'dailymotion'}.mp4`, { mimetype: 'video/mp4' })
      await react('ok')

    } catch (e) {
      await react('error')
      m.reply(`[Dailymotion Error] ${e.message}`)
    }
  }
}
