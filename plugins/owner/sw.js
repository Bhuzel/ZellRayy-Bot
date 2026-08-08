// sw.js – upload to WhatsApp status
import { buildStatusJidList } from '../../lib/helper.js'

export default {
  name: 'Upload Status',
  command: ['sw', 'upsw'],
  category: 'owner',
  settings: { owner: true },
  description: 'Upload teks, foto, video, atau voice note ke Status WhatsApp (Biasa)',

  async run({ m, args, react, sock }) {
    const isQuoted = !!m.quoted
    const mediaMsg = isQuoted ? m.quoted : m
    const mime = mediaMsg.mtype || mediaMsg.msg?.mimetype || ''
    const userText = args.join(' ').trim()
    const quotedCaption = isQuoted ? (m.quoted.caption || m.quoted.text || m.quoted.msg?.caption || '') : ''
    let directCaption = m.msg?.caption || ''
    if (directCaption) {
      directCaption = directCaption.replace(/^\.?(sw|upsw)\s*/i, '').trim()
    }
    const caption = userText || quotedCaption || directCaption || ''

    await react('loading')

    try {
      const statusJidList = buildStatusJidList(sock, m.sender)
      const opts = { statusJidList }
      let resKey = null

      if (mime.includes('image') || mediaMsg.mtype === 'imageMessage') {
        const buf = isQuoted ? await m.quoted.download() : await m.download()
        resKey = await sock.sendMessage('status@broadcast', { image: buf, caption }, opts)
        await m.reply('[Status WA] Foto berhasil diunggah ke Status WhatsApp.')
      } else if (mime.includes('video') || mediaMsg.mtype === 'videoMessage') {
        const buf = isQuoted ? await m.quoted.download() : await m.download()
        resKey = await sock.sendMessage('status@broadcast', { video: buf, caption }, opts)
        await m.reply('[Status WA] Video berhasil diunggah ke Status WhatsApp.')
      } else if (mime.includes('audio') || mediaMsg.mtype === 'audioMessage') {
        const buf = isQuoted ? await m.quoted.download() : await m.download()
        resKey = await sock.sendMessage('status@broadcast', { audio: buf, mimetype: 'audio/ogg; codecs=opus', ptt: true }, opts)
        await m.reply('[Status WA] Voice Note berhasil diunggah ke Status WhatsApp.')
      } else if (caption) {
        resKey = await sock.sendMessage('status@broadcast', {
          text: caption,
          backgroundColor: '#2B5E53',
          font: 1
        }, opts)
        await m.reply('[Status WA] Teks berhasil diunggah ke Status WhatsApp.')
      } else {
        await react('error')
        return m.reply('Kirim atau reply media/teks dengan command *.sw* atau *.upsw* untuk upload status.')
      }

      if (resKey?.key?.id) {
        // Simpan id PLUS statusJidList yang sama persis dipakai saat posting,
        // supaya .delsw bisa broadcast revoke ke semua penerima yang sama (bukan cuma ke bot sendiri)
        global.sentStatusKeys.push({ id: resKey.key.id, statusJidList })
      }

      await react('ok')
    } catch (e) {
      console.error('[SW Error]:', e)
      await react('error')
      await m.reply(`[Status WA Error] ${e.message}`)
    }
  }
}