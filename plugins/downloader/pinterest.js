import fetch from 'node-fetch'
import { extractUrl } from '../../lib/helper.js'

export default {
  name: 'Pinterest Downloader',
  command: ['pinterestdl', 'pindl', 'pinterest'],
  category: 'downloader',
  description: 'Download foto atau video dari Pinterest',

  async run({ m, args, react, config }) {
    const url = extractUrl(args, m)
    if (!url || (!url.includes('pinterest.com') && !url.includes('pin.it'))) {
      return m.reply('Kirim atau reply pesan yang berisi link Pinterest valid.\nContoh: .pinterestdl https://pin.it/xxx')
    }

    await react('loading')

    try {
      const apiUrl = `${config.api.zellrayy}/download/pinterest?url=${encodeURIComponent(url)}`
      const res = await fetch(apiUrl)
      const json = await res.json()

      if (!json.status || !json.result?.media) {
        await react('error')
        return m.reply('[Pinterest Error] Gagal mengambil data media.')
      }

      const { type, title, author, username, media } = json.result
      const caption = `[ Pinterest ]\nJudul: ${title || '-'}\nUploader: ${author || username || '-'}`

      const mediaRes = await fetch(media)
      if (!mediaRes.ok) throw new Error(`Gagal fetch media: ${mediaRes.status}`)

      const buffer = Buffer.from(await mediaRes.arrayBuffer())

      if (type === 'video') {
        await m.sendVideo(buffer, caption)
      } else {
        await m.sendImage(buffer, caption)
      }
      await react('ok')

    } catch (e) {
      await react('error')
      m.reply(`[Pinterest Error] ${e.message}`)
    }
  }
}
