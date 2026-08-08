import { downloadMediaMessage, getContentType, generateWAMessageFromContent, proto } from '@whiskeysockets/baileys'
import fetchBuffer from './fetchBuffer.js'
import { imageToWebp, videoToWebp } from './sticker.js'
import { NATIVE_FLOW_NODES } from './wrapper.js'

/**
 * Normalisasi JID agar konsisten (buang device suffix :xx)
 */
export function jidNormalizedUser(jid) {
  if (!jid) return jid
  if (/:\d+@/i.test(jid)) {
    const [user] = jid.split(':')
    const [, server] = jid.split('@')
    return `${user}@${server}`
  }
  return jid
}

/**
 * Bungkus raw message dari Baileys jadi object `m` dengan method dan properti siap pakai.
 * @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo} msg
 * @param {import('@whiskeysockets/baileys').WASocket} sock
 * @param {object} [config] - config bot (opsional)
 */
export function serialize(msg, sock, config = {}) {
  if (!msg || !msg.message) return msg
  const m = {}

  m.raw = msg
  m.sock = sock
  m.key = msg.key
  m.id = msg.key.id
  m.isBaileys = m.id ? (m.id.startsWith('BAE5') || m.id.length === 16 || m.id.startsWith('3EB0')) : false
  m.chat = jidNormalizedUser(msg.key.remoteJid)
  m.fromMe = msg.key.fromMe
  m.isGroup = m.chat?.endsWith('@g.us') || false
  m.pushName = msg.pushName || ''
  m.messageTimestamp = msg.messageTimestamp

  // Unwrap ephemeral / viewOnce wrapper
  let message = msg.message
  if (message.ephemeralMessage) message = message.ephemeralMessage.message
  if (message.viewOnceMessage) message = message.viewOnceMessage.message
  if (message.viewOnceMessageV2) message = message.viewOnceMessageV2.message
  if (message.viewOnceMessageV2Extension) message = message.viewOnceMessageV2Extension.message
  if (message.documentWithCaptionMessage) message = message.documentWithCaptionMessage.message

  m.message = message
  const type = getContentType(message) || Object.keys(message)[0]
  m.mtype = type
  m.msg = message[type]

  // Tentukan sender:
  if (m.isGroup) {
    m.sender = jidNormalizedUser(msg.key.participant || msg.key.remoteJid)
  } else if (m.fromMe) {
    m.sender = jidNormalizedUser(sock.user?.id || m.chat)
  } else {
    m.sender = jidNormalizedUser(msg.key.remoteJid)
  }

  // Fallback / ALT JID (jika JID pengirim berupa @lid)
  const senderIsLid = m.sender?.endsWith('@lid')
  if (senderIsLid) {
    const altJid =
      msg.key.participantAlt ||
      msg.key.remoteJidAlt ||
      message[type]?.contextInfo?.participant ||
      null
    m.senderAlt = jidNormalizedUser(altJid)
  } else {
    m.senderAlt = null
  }

  if (senderIsLid && m.senderAlt && !m.senderAlt.endsWith('@lid')) {
    m.sender = m.senderAlt
    m.senderAlt = null
  }

  // Extract body text & button responses
  let extractedBody = ''

  if (message.conversation) {
    extractedBody = message.conversation
  } else if (m.msg?.text) {
    extractedBody = m.msg.text
  } else if (m.msg?.caption) {
    extractedBody = m.msg.caption
  } else if (m.mtype === 'interactiveResponseMessage' || message.interactiveResponseMessage) {
    const intMsg = m.msg || message.interactiveResponseMessage
    const nfResp = intMsg?.nativeFlowResponseMessage
    if (nfResp?.paramsJson) {
      try {
        const parsed = JSON.parse(nfResp.paramsJson)
        extractedBody = parsed.id || parsed.copy_code || parsed.text || ''
      } catch {
        extractedBody = nfResp.paramsJson
      }
    }
    if (!extractedBody) {
      extractedBody =
        intMsg?.singleSelectReply?.selectedRowId ||
        intMsg?.listResponseMessage?.singleSelectReply?.selectedRowId ||
        intMsg?.title ||
        ''
    }
  } else if (m.mtype === 'templateButtonReplyMessage' || message.templateButtonReplyMessage) {
    extractedBody = m.msg?.selectedId || m.msg?.selectedButtonId || ''
  } else if (m.mtype === 'buttonsResponseMessage' || message.buttonsResponseMessage) {
    extractedBody = m.msg?.selectedButtonId || m.msg?.selectedDisplayText || ''
  } else if (m.mtype === 'listResponseMessage' || message.listResponseMessage) {
    extractedBody = m.msg?.singleSelectReply?.selectedRowId || m.msg?.title || ''
  } else {
    extractedBody =
      m.msg?.selectedId ||
      m.msg?.singleSelectReply?.selectedRowId ||
      m.msg?.selectedButtonId ||
      (m.mtype === 'protocolMessage' && m.msg?.key?.id) ||
      ''
  }

  m.body = extractedBody
  m.text = m.body

  // Extract mentioned JIDs
  const contextInfo = m.msg?.contextInfo || {}
  m.mentionedJid = (contextInfo.mentionedJid || []).map(jidNormalizedUser)
  m.expiration = contextInfo.expiration || 0

  // Check Bot ID for comparison
  const _numOnly = (jid) => (jid ? jid.split(':')[0].split('@')[0] : null)
  const _botNumber = _numOnly(sock.user?.id)
  const _botLid = _numOnly(sock.user?.lid)
  const _isBotJid = (jid) => {
    const n = _numOnly(jid)
    return !!n && (n === _botNumber || (_botLid && n === _botLid))
  }

  // Quoted Message serialization
  if (contextInfo.quotedMessage) {
    let qMsg = contextInfo.quotedMessage
    if (qMsg.ephemeralMessage) qMsg = qMsg.ephemeralMessage.message
    if (qMsg.viewOnceMessage) qMsg = qMsg.viewOnceMessage.message
    if (qMsg.viewOnceMessageV2) qMsg = qMsg.viewOnceMessageV2.message
    if (qMsg.viewOnceMessageV2Extension) qMsg = qMsg.viewOnceMessageV2Extension.message
    if (qMsg.documentWithCaptionMessage) qMsg = qMsg.documentWithCaptionMessage.message

    const qType = getContentType(qMsg) || Object.keys(qMsg)[0]
    const qSender = jidNormalizedUser(
      contextInfo.participant || (m.isGroup ? null : m.chat)
    )

    m.quoted = {
      message: qMsg,
      key: {
        remoteJid: m.chat,
        fromMe: qSender ? _isBotJid(qSender) : !m.isGroup,
        id: contextInfo.stanzaId,
        participant: contextInfo.participant ? jidNormalizedUser(contextInfo.participant) : undefined
      },
      id: contextInfo.stanzaId,
      chat: m.chat,
      sender: qSender,
      fromMe: qSender ? _isBotJid(qSender) : !m.isGroup,
      isBaileys: contextInfo.stanzaId
        ? contextInfo.stanzaId.startsWith('BAE5') ||
        contextInfo.stanzaId.length === 16 ||
        contextInfo.stanzaId.startsWith('3EB0')
        : false,
      mtype: qType,
      msg: qMsg[qType],
      body:
        qMsg.conversation ||
        qMsg[qType]?.text ||
        qMsg[qType]?.caption ||
        qMsg[qType]?.selectedId ||
        '',
      text:
        qMsg.conversation ||
        qMsg[qType]?.text ||
        qMsg[qType]?.caption ||
        '',
      mentionedJid: (qMsg[qType]?.contextInfo?.mentionedJid || []).map(jidNormalizedUser),
      download: async () => {
        return downloadMediaMessage(
          { message: qMsg, key: { remoteJid: m.chat, id: contextInfo.stanzaId, participant: contextInfo.participant } },
          'buffer',
          {},
          { logger: sock.logger, reuploadRequest: (msg) => sock.updateMediaMessage(msg) }
        )
      },
      delete: async () => {
        return sock.sendMessage(m.chat, {
          delete: {
            remoteJid: m.chat,
            fromMe: _isBotJid(qSender),
            id: contextInfo.stanzaId,
            participant: contextInfo.participant
          }
        })
      },
      react: async (emoji) => {
        const preset = { ok: '✅', error: '❌', loading: '⏳' }
        const symbol = preset[emoji] || emoji
        return sock.sendMessage(m.chat, {
          react: {
            text: symbol,
            key: {
              remoteJid: m.chat,
              fromMe: _isBotJid(qSender),
              id: contextInfo.stanzaId,
              participant: contextInfo.participant
            }
          }
        })
      },
      reply: async (text, opts = {}) => {
        return sock.sendMessage(
          m.chat,
          { text, ...opts },
          {
            quoted: {
              key: {
                remoteJid: m.chat,
                fromMe: _isBotJid(qSender),
                id: contextInfo.stanzaId,
                participant: contextInfo.participant
              },
              message: qMsg
            }
          }
        )
      },
      forward: async (jid, forceForward = false) => {
        return sock.sendMessage(jid, { forward: { key: { remoteJid: m.chat, id: contextInfo.stanzaId }, message: qMsg }, forceForward })
      }
    }
  } else {
    m.quoted = null
  }

  // Utility Methods on m
  m.reply = async (text, opts = {}) => {
    return sock.sendMessage(m.chat, { text, ...opts }, { quoted: msg })
  }

  m.sendText = async (text, opts = {}) => {
    return sock.sendMessage(m.chat, { text, ...opts })
  }

  m.react = async (emoji) => {
    const preset = { ok: '✅', error: '❌', loading: '⏳' }
    const symbol = preset[emoji] || emoji
    return sock.sendMessage(m.chat, { react: { text: symbol, key: msg.key } })
  }

  m.delete = async () => {
    return sock.sendMessage(m.chat, { delete: msg.key })
  }

  m.deleteMsg = async (targetKey) => {
    return sock.sendMessage(m.chat, { delete: targetKey })
  }

  m.forward = async (jid = m.chat, forceForward = false) => {
    return sock.sendMessage(jid, { forward: msg, forceForward })
  }

  m.forwardMsg = async (rawMsg, jid = m.chat) => {
    return sock.sendMessage(jid, { forward: rawMsg })
  }

  m.download = async (fromQuoted = false) => {
    if (fromQuoted) return m.quoted ? m.quoted.download() : null
    return downloadMediaMessage(
      msg,
      'buffer',
      {},
      { logger: sock.logger, reuploadRequest: (msg) => sock.updateMediaMessage(msg) }
    )
  }

  m.sendWithThumbnail = async (opts = {}) => {
    if (typeof sock.sendWithThumbnail === 'function') {
      return sock.sendWithThumbnail(m.chat, opts, msg)
    }
    return m.reply(opts.text || '')
  }

  m.sendImage = async (bufferOrUrl, caption = '', opts = {}) => {
    const image = Buffer.isBuffer(bufferOrUrl) ? bufferOrUrl : await fetchBuffer(bufferOrUrl)
    return sock.sendMessage(m.chat, { image, caption, ...opts }, { quoted: msg })
  }

  m.sendVideo = async (bufferOrUrl, caption = '', opts = {}) => {
    const video = Buffer.isBuffer(bufferOrUrl) ? bufferOrUrl : await fetchBuffer(bufferOrUrl)
    return sock.sendMessage(m.chat, { video, caption, ...opts }, { quoted: msg })
  }

  m.sendAudio = async (bufferOrUrl, ptt = false, opts = {}) => {
    let audio = bufferOrUrl
    let seconds = opts.seconds
    let waveform = opts.waveform

    if (bufferOrUrl && typeof bufferOrUrl === 'object' && Buffer.isBuffer(bufferOrUrl.buffer)) {
      audio = bufferOrUrl.buffer
      if (bufferOrUrl.seconds) seconds = bufferOrUrl.seconds
      if (bufferOrUrl.waveform) waveform = bufferOrUrl.waveform
    } else if (Buffer.isBuffer(bufferOrUrl)) {
      audio = bufferOrUrl
    } else {
      audio = await fetchBuffer(bufferOrUrl)
    }

    if (ptt && !waveform && Buffer.isBuffer(audio)) {
      const step = Math.floor(audio.length / 64) || 1
      const wf = new Uint8Array(64)
      for (let i = 0; i < 64; i++) {
        const sample = audio[i * step] || 0
        const peak = Math.floor((sample / 255) * 75) + 15
        wf[i] = Math.min(100, Math.max(5, peak))
      }
      waveform = wf
    }

    const defaultMime = ptt ? 'audio/ogg; codecs=opus' : 'audio/mp4'
    const sendOpts = {
      audio,
      mimetype: opts.mimetype || defaultMime,
      ptt,
      ...opts
    }
    if (seconds) sendOpts.seconds = seconds
    if (waveform) sendOpts.waveform = waveform

    return sock.sendMessage(m.chat, sendOpts, { quoted: msg })
  }

  m.sendSticker = async (buffer, opts = {}) => {
    const {
      type = 'image',
      crop = false,
      packname = config.spackname || 'ZellRayy-Bot',
      author = config.sauthor || '',
      ...rest
    } = { packname: config.spackname, author: config.sauthor, ...opts }

    const exifOpts = { packname, author }

    let stickerBuf
    if (type === 'sticker') {
      if (packname || author) {
        const { addExif } = await import('./exif.js')
        stickerBuf = await addExif(buffer, exifOpts)
      } else {
        stickerBuf = buffer
      }
    } else if (type === 'video') {
      stickerBuf = await videoToWebp(buffer, crop, exifOpts)
    } else {
      stickerBuf = await imageToWebp(buffer, crop, exifOpts)
    }

    return sock.sendMessage(m.chat, { sticker: stickerBuf, ...rest }, { quoted: msg })
  }

  m.sendDocument = async (buffer, fileName = 'file', opts = {}) => {
    return sock.sendMessage(m.chat, {
      document: buffer,
      fileName,
      mimetype: opts.mimetype || 'application/octet-stream',
      ...opts
    }, { quoted: msg })
  }

  m.sendLocation = async (lat, lng, name = '', opts = {}) => {
    return sock.sendMessage(m.chat, {
      location: { degreesLatitude: lat, degreesLongitude: lng, name },
      ...opts
    }, { quoted: msg })
  }

  m.sendContact = async (number, name = '', opts = {}) => {
    const waid = String(number).replace(/[^0-9]/g, '')
    const vcard =
      'BEGIN:VCARD\n' +
      'VERSION:3.0\n' +
      `FN:${name}\n` +
      `TEL;type=CELL;type=VOICE;waid=${waid}:+${waid}\n` +
      'END:VCARD'
    return sock.sendMessage(m.chat, {
      contacts: { displayName: name, contacts: [{ vcard }] },
      ...opts
    }, { quoted: msg })
  }

  m.sendButton = async (textOrData, buttons = [], footer = '', opts = {}) => {
    if (typeof textOrData === 'object' && textOrData !== null) {
      return sock.sendButtons(m.chat, textOrData, { quoted: msg, ...opts })
    }
    return sock.sendButtons(m.chat, {
      text: textOrData,
      buttons: buttons,
      footer: footer
    }, { quoted: msg, ...opts })
  }

  return m
}