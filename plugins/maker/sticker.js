export default {
  name: 'Bikin Stiker',
  command: ['sticker', 's', 'stiker'],
  category: 'maker',
  description: 'Mengubah foto, video, atau gif menjadi stiker WebP',

  async run({ m, react, config }) {
    const isQuoted = !!m.quoted
    const mediaMsg = isQuoted ? m.quoted : m
    const mime = mediaMsg.mtype || mediaMsg.msg?.mimetype || ''

    const isImage = mime.includes('image') || mime === 'imageMessage'
    const isVideo = mime.includes('video') || mime === 'videoMessage'
    const isSticker = mime.includes('sticker') || mime === 'stickerMessage'

    if (!isImage && !isVideo && !isSticker) {
      return m.reply('Kirim atau reply gambar/video/stiker dengan caption .sticker')
    }

    await react('loading')
    const buf = await mediaMsg.download()
    if (!buf) return m.reply('[Sticker Error] Gagal mengunduh media.')

    const type = isVideo ? 'video' : (isSticker ? 'sticker' : 'image')
    await m.sendSticker(buf, { type, packname: config.spackname, author: config.sauthor })
    await react('ok')
  }
}
