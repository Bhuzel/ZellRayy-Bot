import fetchBuffer from '../../lib/fetchBuffer.js'

export default {
  name: 'Sticker Brat',
  command: ['brat'],
  category: 'maker',
  description: 'Buat stiker bergaya Brat dari teks',
  async run({ m, args, react, config }) {
    const text = args.join(' ').trim()
    if (!text) {
      return m.reply('⚠️ Masukkan teks dulu.\n\nContoh: *.brat Halo Dunia*')
    }
    try {
      const apiUrl = `${config.api.zellrayy}/maker/brat?q=${encodeURIComponent(text)}`
      const buffer = await fetchBuffer(apiUrl)

      if (!buffer || buffer.length === 0) {
        await react('error')
        return m.reply('❌ Gagal buat sticker Brat. Coba lagi nanti.')
      }

      await m.sendSticker(buffer, { type: 'image', crop: false })
    } catch (e) {
      console.error('[brat]', e.message)
      await react('error')
      m.reply('❌ Gagal buat sticker Brat. API mungkin sedang down.')
    }
  }
}
