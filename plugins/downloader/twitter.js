import fetch from 'node-fetch'
import fetchBuffer from '../../lib/fetchBuffer.js'
import { extractUrl } from '../../lib/helper.js'

export default {
  name: 'Twitter/X Downloader',
  command: ['twitter', 'twdl', 'xdl'],
  category: 'downloader',
  description: 'Download foto atau video dari Twitter/X',

  async run({ m, args, react, config }) {
    const url = extractUrl(args, m)
    if (!url || (!url.includes('twitter.com') && !url.includes('x.com'))) {
      return m.reply('Kirim atau reply pesan yang berisi link Twitter/X valid.\nContoh: .twitter https://x.com/user/status/xxx')
    }

    await react('loading')

    try {
      const apiUrl = `${config.api.zellrayy}/download/x?url=${encodeURIComponent(url)}`
      const res = await fetch(apiUrl)
      const json = await res.json()

      if (!json.status || !json.result?.media) {
        await react('error')
        return m.reply('[Twitter Error] Gagal mengambil data media.')
      }

      const { text, likes, retweets, replies, media } = json.result
      const caption =
        `[ Twitter/X ]\n` +
        `Deskripsi: ${text?.replace(/https?:\/\/\S+/g, '').trim() || '-'}\n` +
        `Likes: ${likes || 0} | Retweets: ${retweets || 0} | Balasan: ${replies || 0}`

      if (media.videos?.length) {
        const video = media.videos[0]
        if (!video.video_urls?.length) {
          await react('error')
          return m.reply('[Twitter Error] URL video tidak tersedia.')
        }
        const best = video.video_urls.reduce((a, b) => (a.bitrate > b.bitrate ? a : b))

        const buffer = await fetchBuffer(best.url)
        await m.sendVideo(buffer, caption)
        await react('ok')
        return
      }

      if (media.images?.length) {
        const images = media.images
        let sent = 0
        for (const img of images) {
          try {
            const buffer = await fetchBuffer(img.image_url)
            await m.sendImage(buffer, sent === 0 ? caption : '')
            sent++
          } catch (e) {
            console.error(`[XDLT] Gagal kirim gambar ${sent + 1}:`, e.message)
          }
        }

        if (sent === 0) {
          await react('error')
          return m.reply('[Twitter Error] Semua gambar gagal didownload.')
        }
        await react('ok')
        return
      }

      await react('error')
      m.reply('[Twitter Error] Media tidak ditemukan pada tweet tersebut.')
    } catch (e) {
      await react('error')
      m.reply(`[Twitter Error] ${e.message}`)
    }
  }
}
