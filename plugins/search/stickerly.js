import fetch from 'node-fetch'
import fetchBuffer from '../../lib/fetchBuffer.js'
import { extractText } from '../../lib/helper.js'

export default {
  name: 'Stickerly Search',
  command: ['stickerly', 'cariSticker', 'stickerpack'],
  category: 'search',
  description: 'Cari sticker pack di Stickerly berdasarkan kata kunci',

  async run({ m, args, react, config }) {
    const query = extractText(args, m)
    if (!query) {
      return m.reply('Ketik kata kunci atau reply pesan teks.\nContoh: .stickerly anime')
    }

    await react('loading')

    try {
      const apiUrl = `${config.api.zellrayy}/search/stickerly?q=${encodeURIComponent(query)}`
      const res = await fetch(apiUrl)
      const json = await res.json()

      if (!json.status || !json.result?.length) {
        await react('error')
        return m.reply('[Stickerly Search] Tidak ada sticker pack ditemukan.')
      }

      const pack = json.result[0]
      const stickers = pack.stickers || []

      if (!stickers.length) {
        await react('error')
        return m.reply('[Stickerly Search] Sticker pack kosong.')
      }

      await m.reply(
        `[ Stickerly Search ]\n` +
        `Pack  : ${pack.name}\n` +
        `Author: ${pack.author}\n` +
        `Total : ${stickers.length} stiker\n\nMengirim stiker...`
      )

      let sent = 0
      for (const url of stickers) {
        try {
          const buffer = await fetchBuffer(url)
          await m.sendSticker(buffer, {
            type: 'sticker',
            packname: pack.name || 'Stickerly',
            author: pack.author || ''
          })
          sent++
        } catch (e) {
          console.error(`[STICKERLY] Gagal kirim sticker ${sent + 1}:`, e.message)
        }
      }

      if (sent === 0) m.reply('[Stickerly Search] Semua stiker gagal dikirim.')
      else await react('ok')
    } catch (e) {
      await react('error')
      m.reply(`[Stickerly Search Error] ${e.message}`)
    }
  }
}
