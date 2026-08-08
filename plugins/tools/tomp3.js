import { toMp3 } from '../../lib/converter.js'

export default {
  name: 'To MP3',
  command: ['tomp3', 'toaudio', 'tomp3doc', 'toaudiodoc'],
  category: 'tools',
  description: 'Mengubah video, Voice Note (VN), atau audio menjadi MP3 (bisa dikirim sebagai audio atau dokumen dengan .tomp3 doc)',

  async run({ m, command, args, react }) {
    const q = m.quoted
    const isMedia = q && (
      q.mtype?.includes('audio') ||
      q.mtype?.includes('video') ||
      q.mtype?.includes('document') ||
      q.mtype === 'audioMessage' ||
      q.mtype === 'videoMessage' ||
      q.mtype === 'documentMessage' ||
      q.mtype === 'documentWithCaptionMessage'
    )

    if (!isMedia) {
      return m.reply('Reply video, Voice Note (VN), atau audio yang ingin diubah menjadi audio MP3.\n💡 Gunakan *.tomp3 doc* untuk mengirim sebagai dokumen MP3.')
    }

    await react('loading')
    try {
      const mediaBuf = await q.download()
      if (!mediaBuf || mediaBuf.length === 0) {
        await react('error')
        return m.reply('Gagal mengunduh file media.')
      }

      const docMsg = q.msg?.message?.documentMessage || q.msg
      const hint = docMsg?.mimetype || docMsg?.fileName || docMsg?.title || q.mtype || ''
      const mp3Buf = await toMp3(mediaBuf, hint)

      const isDoc = command.includes('doc') || args[0]?.toLowerCase() === 'doc' || args[0]?.toLowerCase() === 'document'

      if (isDoc) {
        const fileName = (q.msg?.fileName || 'audio').replace(/\.[^/.]+$/, '') + '.mp3'
        await m.sendDocument(mp3Buf, fileName, { mimetype: 'audio/mpeg' })
      } else {
        await m.sendAudio(mp3Buf, false, { mimetype: 'audio/mpeg' })
      }

      await react('ok')
    } catch (e) {
      await react('error')
      await m.reply(`[ToMP3 Error] ${e.message}`)
    }
  }
}
