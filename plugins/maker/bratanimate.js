import fetchBuffer from '../../lib/fetchBuffer.js'

export default {
  name: 'Sticker Brat Animate',
  command: ['bratvid', 'bratanimate', 'brata'],
  category: 'maker',
  description: 'Buat stiker animasi bergaya Brat dari teks',
  async run({ m, args, react, config }) {
    const text = args.join(' ').trim()
    if (!text) {
      return m.reply('⚠️ Masukkan teks dulu.\n\nContoh: *.bratanimate Halo Dunia*')
    }
    try {
      const apiUrl = `${config.api.zellrayy}/maker/bratvid?q=${encodeURIComponent(text)}`
      const buffer = await fetchBuffer(apiUrl)

      if (!buffer || buffer.length === 0) {
        await react('error')
        return m.reply('❌ Gagal buat sticker Brat Animate. Coba lagi nanti.')
      }

      await m.sendSticker(buffer, { type: 'video', crop: false })
    } catch (e) {
      console.error('[bratanimate]', e.message)
      await react('error')
      m.reply('❌ Gagal buat sticker Brat Animate. API mungkin sedang down.')
    }
  }
}
