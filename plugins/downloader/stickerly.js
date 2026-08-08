import fetch from 'node-fetch'
import fetchBuffer from '../../lib/fetchBuffer.js'
import { extractUrl } from '../../lib/helper.js'

export default {
  name: 'Stickerly Downloader',
  command: ['stickerdown', 'stickerdl', 'stickerurl'],
  category: 'downloader',
  description: 'Download sticker pack dari Stickerly',

  async run({ m, args, react, config }) {
    const url = extractUrl(args, m)
    if (!url || (!url.includes('sticker.ly') && !url.includes('getstickerpack.com'))) {
      return m.reply('Kirim atau reply pesan yang berisi link Stickerly valid.\nContoh: .stickerdown https://sticker.ly/s/9E32A2')
    }

    await react('loading')

    try {
      const apiUrl = `${config.api.zellrayy}/download/stickerly?url=${encodeURIComponent(url)}`
      const res = await fetch(apiUrl)
      const json = await res.json()

      if (!json.status || !json.result?.stickers?.length) {
        await react('error')
        return m.reply('[Stickerly Error] Gagal mengambil data stiker.')
      }

      const { title, author, stickers } = json.result

      await m.reply(`[ Stickerly ]\nPack  : ${title || '-'}\nAuthor: ${author || '-'}\nTotal : ${stickers.length} stiker\n\nMengirim stiker...`)

      let sent = 0
      for (const stickerUrl of stickers) {
        try {
          const buffer = await fetchBuffer(stickerUrl)
          await m.sendSticker(buffer, {
            type: 'sticker',
            packname: title || 'Stickerly',
            author: author || ''
          })
          sent++
        } catch (e) {
          console.error(`[STICKERDL] Gagal kirim sticker ${sent + 1}:`, e.message)
        }
      }

      if (sent === 0) m.reply('[Stickerly Error] Semua stiker gagal dikirim.')
      else await react('ok')
    } catch (e) {
      await react('error')
      m.reply(`[Stickerly Error] ${e.message}`)
    }
  }
}
