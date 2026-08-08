export default {
  name: 'Post Channel',
  command: ['postch'],
  category: 'owner',
  description: 'Mengirim atau memposting teks, gambar, video, dan voice note ke WhatsApp Channel',
  settings: {
    owner: true
  },
  async run({ m, args, react, sock, config }) {
    let channelJid = ''
    let remainingArgs = [...args]

    // Determine channel JID
    if (args[0]?.endsWith('@newsletter')) {
      channelJid = args[0]
      remainingArgs = args.slice(1)
    } else if (args[0]?.includes('whatsapp.com/channel/')) {
      try {
        const code = args[0].split('/channel/')[1]?.split(/[/?]/)[0]
        const meta = await sock.newsletterMetadata('invite', code)
        channelJid = meta.id
        remainingArgs = args.slice(1)
      } catch (e) {
        return m.reply(`[Post Channel Error] Gagal memproses link channel: ${e.message}`)
      }
    } else if (config && typeof config.newsletterJid === 'string') {
      channelJid = config.newsletterJid
    }

    // Validate channel JID
    if (!channelJid || !channelJid.endsWith('@newsletter')) {
      await react('error')
      return m.reply(
        '[Post Channel]\n\n' +
        'JID Channel default belum diatur di config.js atau link/JID tidak valid.\n' +
        'Penggunaan:\n' +
        '• .postch <teks/media>\n' +
        '• .postch <channelJid@newsletter> <teks/media>\n' +
        '• Reply foto/video/vn -> .postch'
      )
    }

    const isQuoted = !!m.quoted
    const msgSource = isQuoted ? m.quoted : m

    let userText = remainingArgs.join(' ').trim()
    let quotedText = m.quoted?.text || m.quoted?.msg?.caption || ''
    let directCaption = m.msg?.caption || ''

    if (directCaption) {
      directCaption = directCaption.replace(/^\.?(postch)\s*/i, '')
      if (channelJid && directCaption.startsWith(channelJid)) {
        directCaption = directCaption.slice(channelJid.length).trim()
      }
    }

    const captionText = userText || quotedText || directCaption || ''

    const mtype = msgSource.mtype || msgSource.msg?.mimetype || ''
    const isImage = mtype.includes('image') || msgSource.mtype === 'imageMessage' || !!msgSource.msg?.imageMessage
    const isVideo = mtype.includes('video') || msgSource.mtype === 'videoMessage' || !!msgSource.msg?.videoMessage
    const isAudio = mtype.includes('audio') || msgSource.mtype === 'audioMessage' || !!msgSource.msg?.audioMessage

    await react('loading')

    try {
      if (isImage) {
        const buf = await (isQuoted ? m.quoted.download() : m.download())
        if (!buf || !Buffer.isBuffer(buf)) throw new Error('Gagal mendownload media foto.')
        await sock.sendMessage(channelJid, { image: buf, caption: captionText })
      } else if (isVideo) {
        const buf = await (isQuoted ? m.quoted.download() : m.download())
        if (!buf || !Buffer.isBuffer(buf)) throw new Error('Gagal mendownload media video.')
        await sock.sendMessage(channelJid, {
          video: buf,
          caption: captionText,
          mimetype: msgSource.msg?.mimetype || 'video/mp4'
        })
      } else if (isAudio) {
        const buf = await (isQuoted ? m.quoted.download() : m.download())
        if (!buf || !Buffer.isBuffer(buf)) throw new Error('Gagal mendownload media voice note/audio.')
        let mime = msgSource.msg?.mimetype || 'audio/mp4'
        if (mime.includes('ogg') || mime.includes('opus')) {
          mime = 'audio/ogg; codecs=opus'
        }
        await sock.sendMessage(channelJid, {
          audio: buf,
          mimetype: mime,
          ptt: false
        })
      } else if (captionText) {
        await sock.sendMessage(channelJid, { text: captionText })
      } else {
        await react('error')
        return m.reply('[Post Channel] Kirim atau reply foto, video, voice note, atau teks yang ingin diposting ke Channel.')
      }

      await m.reply(`[Post Channel] Berhasil mengirim postingan ke WhatsApp Channel:\n\`${channelJid}\``)
      await react('ok')
    } catch (e) {
      console.error('[Post Channel Error]:', e)
      await react('error')
      await m.reply(`[Post Channel Error] Gagal memposting ke channel: ${e.message}`)
    }
  }
}
