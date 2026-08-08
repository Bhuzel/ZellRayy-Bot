export default {
  name: 'Ubah Watermark Sticker',
  command: ['wm', 'stickername', 'sn'],
  category: 'maker',
  description: 'Ganti metadata packname & author pada stiker WebP',
  async run({ m, args, react }) {
    if (!m.quoted || (m.quoted.mtype !== 'stickerMessage' && !m.quoted.mtype?.includes('sticker'))) {
      return m.reply(
        '❌ Reply sticker dulu ya, baru ketik:\n' +
        '• `.sn <author>`\n' +
        '• `.sn <packname> | <author>`'
      )
    }

    const input = args.join(' ').trim()
    if (!input) {
      return m.reply(
        'Masukkan nama dulu ya:\n' +
        '• `.sn <author>` — ganti author aja\n' +
        '• `.sn <packname> | <author>` — ganti keduanya'
      )
    }

    const sepIdx = input.indexOf(' | ')
    let packname, author
    if (sepIdx === -1) {
      packname = input
      author = ''
    } else {
      packname = input.slice(0, sepIdx).trim()
      author = input.slice(sepIdx + 3).trim()
    }
    try {
      const buffer = await m.download(true)
      if (!buffer) throw new Error('Gagal download sticker')
      await m.sendSticker(buffer, { type: 'sticker', packname, author })
    } catch (e) {
      await react('error')
      await m.reply(`❌ Gagal: ${e.message}`)
    }
  }
}
