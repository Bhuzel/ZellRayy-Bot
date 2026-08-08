import { webpToVideo } from '../../lib/converter.js'

export default {
  name: 'To Video',
  command: ['tovid', 'tovideo', 'togif', 'toviddoc'],
  category: 'tools',
  description: 'Mengubah stiker gerak (GIF/WebP), stiker, atau dokumen video menjadi video MP4 (bisa dikirim sebagai dokumen dengan .tovid doc)',

  async run({ m, command, args, react }) {
    const q = m.quoted
    const isMedia = q && (
      q.mtype?.includes('sticker') ||
      q.mtype === 'stickerMessage' ||
      q.mtype?.includes('video') ||
      q.mtype === 'videoMessage' ||
      q.mtype?.includes('document') ||
      q.mtype === 'documentMessage' ||
      q.mtype === 'documentWithCaptionMessage'
    )

    if (!isMedia) {
      return m.reply('Reply stiker (GIF/WebP), video, atau dokumen video yang ingin diubah menjadi video MP4.\n💡 Gunakan *.tovid doc* untuk mengirim sebagai dokumen MP4.')
    }

    await react('loading')
    try {
      const mediaBuf = await q.download()
      if (!mediaBuf || mediaBuf.length === 0) {
        await react('error')
        return m.reply('Gagal mengunduh file media.')
      }

      let vidBuf = mediaBuf
      if (q.mtype?.includes('sticker') || q.mtype === 'stickerMessage') {
        vidBuf = await webpToVideo(mediaBuf)
      }

      const isDoc = command.includes('doc') || args[0]?.toLowerCase() === 'doc' || args[0]?.toLowerCase() === 'document'

      if (isDoc) {
        const docMsg = q.msg?.message?.documentMessage || q.msg
        const origName = docMsg?.fileName || 'video'
        const fileName = origName.replace(/\.[^/.]+$/, '') + '.mp4'
        await m.sendDocument(vidBuf, fileName, { mimetype: 'video/mp4' })
      } else {
        await m.sendVideo(vidBuf, '[ Convert Ke Video MP4 ]')
      }
      await react('ok')
    } catch (e) {
      await react('error')
      await m.reply(`[ToVid Error] ${e.message}`)
    }
  }
}
