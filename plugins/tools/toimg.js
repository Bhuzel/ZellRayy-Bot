import { webpToImage, isAnimatedWebp } from '../../lib/converter.js'

export default {
  name: 'To Image',
  command: ['toimg', 'toimage'],
  category: 'tools',
  description: 'Mengubah stiker WebP (statis/gerak) menjadi gambar PNG/JPEG',

  async run({ m, react }) {
    if (!m.quoted || (!m.quoted.mtype?.includes('sticker') && m.quoted.mtype !== 'stickerMessage')) {
      return m.reply('Reply stiker yang ingin diubah menjadi gambar.\n💡 Untuk stiker gerak ke video, gunakan *.tovid*')
    }
    await react('loading')
    try {
      const webpBuf = await m.quoted.download()
      if (!webpBuf || webpBuf.length === 0) {
        await react('error')
        return m.reply('Gagal mengunduh file stiker.')
      }

      const isAnim = await isAnimatedWebp(webpBuf)
      const imgBuf = await webpToImage(webpBuf)

      const caption = isAnim
        ? '[ Convert Stiker Ke Gambar ]\n💡 *Tip*: Stiker ini bergerak! Kamu juga bisa ubah ke video pakai *.tovid*'
        : '[ Convert Stiker Ke Gambar ]'

      await m.sendImage(imgBuf, caption)
      await react('ok')
    } catch (e) {
      await react('error')
      await m.reply(`[ToImg Error] ${e.message}`)
    }
  }
}
