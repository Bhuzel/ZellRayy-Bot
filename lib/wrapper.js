/**
 * wrapper.js — ZellRayy-Bot sock method extensions
 *
 * Method yang ditambahkan bisa dipakai di plugin via sock.namaMethod(...)
 * atau via m.namaMethod(...) dari serialize.js
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { prepareWAMessageMedia, generateWAMessageFromContent } from '@whiskeysockets/baileys'
import sharp from 'sharp'
import config from './../config.js'

const __dir = dirname(fileURLToPath(import.meta.url))
const IMG_PATH = resolve(__dir, '../database/image.png')

// Cache hasil upload ke WA server per cacheKey
const _uploadCache = new Map()

// Tambah watermark teks di pojok kanan bawah gambar
async function addWatermark(buf, watermark) {
  if (!watermark) return buf
  try {
    const meta = await sharp(buf).metadata()
    const w = meta.width || 300
    const h = meta.height || 300
    const fs = Math.max(14, Math.round(w * 0.05))

    const svg = Buffer.from(
      `<svg width="${w}" height="${h}">
        <style>
          .wm { font-size: ${fs}px; font-family: Arial, sans-serif; font-weight: bold;
                fill: white; paint-order: stroke; stroke: rgba(0,0,0,0.65);
                stroke-width: 3px; stroke-linejoin: round; }
        </style>
        <text x="${w - 8}" y="${h - 8}" text-anchor="end" class="wm">${watermark}</text>
      </svg>`
    )

    return await sharp(buf)
      .composite([{ input: svg, blend: 'over' }])
      .jpeg({ quality: 85 })
      .toBuffer()
  } catch {
    return buf
  }
}

// Download URL jadi buffer
async function fetchBuf(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`fetch gagal: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

// Upload buffer ke WA server, return imageMessage metadata
async function uploadToWA(buf, sock) {
  const { imageMessage } = await prepareWAMessageMedia(
    { image: buf },
    { upload: sock.waUploadToServer, mediaTypeOverride: 'thumbnail-link' }
  )
  return imageMessage
}

// Ambil + proses thumbnail (dengan watermark), upload ke WA, cache hasilnya
async function getThumb(thumbUrl, watermark, sock) {
  const cacheKey = `${thumbUrl}__${watermark}`
  if (_uploadCache.has(cacheKey)) return _uploadCache.get(cacheKey)

  try {
    let buf = thumbUrl ? await fetchBuf(thumbUrl) : (existsSync(IMG_PATH) ? readFileSync(IMG_PATH) : null)
    if (!buf) return null

    buf = await addWatermark(buf, watermark)

    const img = await uploadToWA(buf, sock)
    _uploadCache.set(cacheKey, img)
    return img
  } catch {
    try {
      if (existsSync(IMG_PATH)) {
        const buf = readFileSync(IMG_PATH)
        const img = await uploadToWA(buf, sock)
        _uploadCache.set(cacheKey, img)
        return img
      }
      return null
    } catch {
      return null
    }
  }
}

// ── Node bawaan buat badge "AI" di pesan ────────────────────────────────────
// Ini dipakai default kalau content.ai === true (tanpa custom nodes).
// Bisa ditambah/dikurangi sesuai kebutuhan, atau di-override lewat content.aiNodes.
export const AI_NODES = [
  {
    tag: 'biz_bot',
    attrs: { ai_type: '1' }
  }
]

export const NATIVE_FLOW_NODES = [
  {
    tag: 'biz',
    attrs: {},
    content: [
      {
        tag: 'interactive',
        attrs: { type: 'native_flow', v: '1' },
        content: [
          {
            tag: 'native_flow',
            attrs: { v: '9', name: 'mixed' }
          }
        ]
      }
    ]
  }
]

import { sendInteractiveMessage, sendButtons, sendInteractiveButtonsBasic, sendCarousel } from './button.js'

/**
 * Pasang semua method wrapper ke object sock.
 */
export function attachWrapper(sock) {
  sock.sendInteractiveMessage = (jid, content, options = {}) => sendInteractiveMessage(sock, jid, content, options)
  sock.sendButtons = (jid, data, options = {}) => sendInteractiveButtonsBasic(sock, jid, data, options)
  sock.sendInteractive = (jid, data, options = {}) => sendInteractiveButtonsBasic(sock, jid, data, options)
  // sock.sendCarousel(jid, { text, footer, cards: [{ image, text, buttons }] })
  // — kartu geser (image slider) yang bener2 kebaca WA. Lihat lib/button.js
  // untuk detail format tiap card.
  sock.sendCarousel = (jid, data, options = {}) => sendCarousel(sock, jid, data, options)

  // ── Support ai: true / ai: {...} di sock.sendMessage ─────────────────────
  const _originalSendMessage = sock.sendMessage.bind(sock)
  sock.sendMessage = async (jid, content, options = {}) => {
    if (content && typeof content === 'object' && content.ai) {
      // content.ai bisa: true (pakai AI_NODES default)
      // atau array custom node, mis: ai: [{ tag: 'bot', attrs: { bot_bot: '1' } }]
      const customNodes = Array.isArray(content.ai) ? content.ai : null
      const extraNodes = Array.isArray(content.aiNodes) ? content.aiNodes : []
      delete content.ai
      delete content.aiNodes

      const nodesToSend = [
        ...(customNodes || AI_NODES),
        ...extraNodes
      ]

      // Tambahkan contextInfo pendukung AI jika memungkinkan
      content.contextInfo = {
        ...(content.contextInfo || {}),
        isSupportAiMessage: true
      }

      const _originalRelayMessage = sock.relayMessage.bind(sock)
      sock.relayMessage = async (rJid, rMessage, rOptions = {}) => {
        rOptions.additionalAttributes = {
          ...(rOptions.additionalAttributes || {}),
          bot_message: '1',
          ai: '1',
          biz_bot: '1',
          is_ai: '1'
        }
        rOptions.additionalNodes = [
          ...(rOptions.additionalNodes || []),
          ...nodesToSend
        ]
        return _originalRelayMessage(rJid, rMessage, rOptions)
      }
      try {
        const res = await _originalSendMessage(jid, content, options)
        if (res) {
          res.isSupportAiMessage = true
        }
        return res
      } finally {
        sock.relayMessage = _originalRelayMessage
      }
    }
    return _originalSendMessage(jid, content, options)
  }

  // ── sendInteractive ─────────────────────────────────────────────────────
  // Native-flow interactive buttons (quick_reply, cta_url, cta_copy, cta_call,
  // single_select list). Ini format button yang MASIH kebaca sama WA versi
  // sekarang — format lama `buttons: [{ buttonId, buttonText, type: 1 }]`
  // itu udah lama di-deprecate WA dan seringnya cuma nongol di beberapa
  // client aja / kadang gak render sama sekali, makanya diganti ke sini.
  //
  // Contoh pakai (simplified):
  //   await sock.sendInteractive(m.chat, {
  //     text: 'Pilih salah satu:',
  //     footer: config.botName,
  //     buttons: [
  //       { type: 'reply', text: 'Cek Ping', id: '.ping' },
  //       { type: 'url',   text: 'Website',  url: 'https://example.com' },
  //       { type: 'copy',  text: 'Copy Kode', copyCode: 'PROMO123' },
  //       { type: 'call',  text: 'Telepon',  phoneNumber: '628123456789' },
  //       {
  //         type: 'list',
  //         text: 'Buka Menu',
  //         list: {
  //           title: 'Menu Utama',
  //           sections: [
  //             { title: 'Umum', rows: [
  //               { title: 'Ping', description: 'Cek speed bot', id: '.ping' },
  //               { title: 'Owner', description: 'Kontak owner', id: '.owner' }
  //             ] }
  //           ]
  //         }
  //       }
  //     ],
  //     ai: true // opsional, badge AI
  //   }, m)
  //
  // CATATAN: ini implementasi LAMA. Sebelumnya baris ini nimpa
  // `sock.sendInteractive` yang udah di-set di atas (line ~132, arah ke
  // sendInteractiveButtonsBasic dari lib/button.js) SECARA DIAM-DIAM —
  // akibatnya sock.sendInteractive versi baru (yang punya validasi payload
  // & fitur title/subtitle/image header lebih lengkap) gak pernah ke-pake
  // sama sekali. Sekarang dipisah jadi sock.sendInteractiveLegacy biar dua2
  // nya tetep bisa dipanggil kalau ada plugin lama yang masih butuh bentuk
  // native ini, tapi sock.sendInteractive default-nya balik ke implementasi
  // baru dari lib/button.js.
  sock.sendInteractiveLegacy = async (jid, opts = {}, quoted = null) => {
    const {
      text = '',
      footer = config.botName,
      title = '',
      buttons = [],
      image = null, // { url } atau Buffer, opsional header image
      ai = false,
      aiNodes = null
    } = opts

    const interactiveButtons = buttons.map(btn => {
      switch (btn.type) {
        case 'url':
          return {
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({
              display_text: btn.text,
              url: btn.url,
              merchant_url: btn.url
            })
          }
        case 'copy':
          return {
            name: 'cta_copy',
            buttonParamsJson: JSON.stringify({
              display_text: btn.text,
              id: btn.id || btn.copyCode,
              copy_code: btn.copyCode
            })
          }
        case 'call':
          return {
            name: 'cta_call',
            buttonParamsJson: JSON.stringify({
              display_text: btn.text,
              id: btn.id || btn.phoneNumber,
              phone_number: btn.phoneNumber
            })
          }
        case 'list':
          return {
            name: 'single_select',
            buttonParamsJson: JSON.stringify({
              title: btn.list?.title || btn.text,
              sections: btn.list?.sections || []
            })
          }
        case 'reply':
        default:
          return {
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
              display_text: btn.text,
              id: btn.id || btn.text
            })
          }
      }
    })

    const msgObj = generateWAMessageFromContent(jid, {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: { text },
            footer: { text: footer },
            ...(title ? { header: { title, hasMediaAttachment: false } } : {}),
            nativeFlowMessage: {
              messageVersion: 1,
              buttons: interactiveButtons
            }
          }
        }
      }
    }, { userJid: sock.user?.id || jid, quoted: quoted?.raw || quoted })

    const extraNodes = Array.isArray(aiNodes) ? aiNodes : (ai ? (Array.isArray(ai) ? ai : AI_NODES) : [])
    const relayOpts = {
      messageId: msgObj.key.id,
      additionalNodes: [
        ...NATIVE_FLOW_NODES,
        ...extraNodes
      ]
    }
    if (ai) {
      relayOpts.additionalAttributes = { bot_message: '1', ai: '1', biz_bot: '1', is_ai: '1' }
    }

    await sock.relayMessage(jid, msgObj.message, relayOpts)

    // Sama kayak di lib/button.js: simpan langsung ke store pas kirim, biar
    // gak gantungan sama echo event yang kadang telat/gak konsisten.
    if (global.store && typeof global.store.set === 'function') {
      global.store.set(msgObj.key.id, msgObj)
    }

    return msgObj
  }

  // ── sendWithThumbnail ──────────────────────────────────────────────────────
  sock.sendWithThumbnail = async (jid, opts = {}, quoted = null) => {
    const {
      text = '',
      title = config.botName,
      body = `Powered by ${config.botName}`,
      watermark = config.api?.zellrayy ? 'api.zellrayy.com' : config.botName,
      thumbUrl = config.menuThumbnail || '',
      matchedText = config.menuLink || config.api?.zellrayy || ''
    } = opts

    const quotedCtx = quoted ? {
      stanzaId: quoted.key?.id || quoted.id,
      participant: quoted.key?.participant || quoted.key?.remoteJid || quoted.sender,
      quotedMessage: quoted.message
    } : null

    try {
      const img = await getThumb(thumbUrl, watermark, sock)

      if (img) {
        await sock.relayMessage(jid, {
          extendedTextMessage: {
            text,
            matchedText,
            title,
            description: body,
            previewType: 0,
            jpegThumbnail: img.jpegThumbnail,
            thumbnailDirectPath: img.directPath,
            thumbnailSha256: Buffer.from(img.fileSha256).toString('base64'),
            thumbnailEncSha256: Buffer.from(img.fileEncSha256).toString('base64'),
            mediaKey: Buffer.from(img.mediaKey).toString('base64'),
            mediaKeyTimestamp: img.mediaKeyTimestamp,
            thumbnailHeight: img.height,
            thumbnailWidth: img.width,
            contextInfo: quotedCtx || undefined
          }
        }, { messageId: sock.generateMessageTag() })
        return
      } else {
        throw new Error('no img')
      }
    } catch {
      // Fallback 1: externalAdReply dengan buffer JPEG biasa
      try {
        let fallbackThumb = null
        try {
          let buf = thumbUrl ? await fetchBuf(thumbUrl) : (existsSync(IMG_PATH) ? readFileSync(IMG_PATH) : null)
          if (buf) {
            fallbackThumb = await sharp(buf).resize(300, 300, { fit: 'cover' }).jpeg({ quality: 80 }).toBuffer()
          }
        } catch { /* tidak ada thumbnail */ }

        await sock.sendMessage(jid, {
          text,
          contextInfo: {
            externalAdReply: {
              title,
              body,
              mediaType: 1,
              thumbnail: fallbackThumb,
              sourceUrl: matchedText,
              renderLargerThumbnail: true,
              showAdAttribution: false
            }
          }
        }, quoted ? { quoted } : {})
      } catch {
        // Fallback terakhir: teks biasa
        await sock.sendMessage(jid, {
          text: `*${title}*\n${body}\n\n${text}`
        }, quoted ? { quoted } : {})
      }
    }
  }
}