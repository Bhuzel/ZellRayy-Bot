import { toVn } from '../../lib/converter.js'

export default {
  name: 'To Voice Note',
  command: ['tovn', 'vn', 'toptt'],
  category: 'tools',
  description: 'Mengubah video, mp3, audio, atau dokumen lagu/suara menjadi Voice Note (PTT)',

  async run({ m, react }) {
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
      return m.reply('Reply video, MP3, audio, atau dokumen lagu/suara yang ingin diubah menjadi Voice Note (VN).')
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
      const vnRes = await toVn(mediaBuf, hint)
      await m.sendAudio(vnRes, true)
      await react('ok')
    } catch (e) {
      await react('error')
      await m.reply(`[ToVN Error] ${e.message}`)
    }
  }
}
