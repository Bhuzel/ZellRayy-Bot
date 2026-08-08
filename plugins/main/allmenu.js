/**
 * .allmenu
 *
 * Tampilan dikontrol oleh config.menuStyle:
 *   'text'        → teks biasa
 *   'image'       → teks + gambar (database/image.png)
 *   'interactive' → thumbnail full quality seperti link preview WA
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { prepareWAMessageMedia } from '@whiskeysockets/baileys'
import { plugins } from '../../lib/pluginLoader.js'
import config from '../../config.js'

const __dir = dirname(fileURLToPath(import.meta.url))
const IMG_PATH = resolve(__dir, '../../database/image.png')

let _cachedThumb = null

function capitalize(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase())
}

function buildAllMenuText() {
  const byCategory = {}
  const seen = new Set()

  for (const plugin of plugins.values()) {
    if (seen.has(plugin)) continue
    seen.add(plugin)
    if (!plugin.category) continue

    const cats = Array.isArray(plugin.category) ? plugin.category : [plugin.category]
    for (const cat of cats) {
      if (!cat) continue
      const catLower = String(cat).toLowerCase()
      byCategory[catLower] = byCategory[catLower] || []
      byCategory[catLower].push(plugin.command[0])
    }
  }

  const prefixes   = Array.isArray(config.prefix) ? config.prefix : [config.prefix]
  const prefixShow = config.usePrefix === false ? '(tanpa prefix)' : prefixes.join(' ')
  const p          = config.usePrefix === false ? '' : prefixes[0]
  const total      = Object.values(byCategory).reduce((sum, cmds) => sum + cmds.length, 0)

  let text = `╭──[ ${config.botName}\n`
  text    += `├ Creator : ZellRayy\n`
  text    += `├ Plugin  : ${total}\n`
  text    += `├ Prefix  : ${prefixShow}\n`
  text    += `╰────────────\n\n`

  for (const [cat, cmds] of Object.entries(byCategory)) {
    text += `╭─「 ${capitalize(cat)} 」\n`
    text += cmds.map(c => `├ ${p}${c}`).join('\n')
    text += `\n╰────────────\n\n`
  }

  return text.trim()
}

async function sendWithImage(m, sock, text) {
  try {
    const image = readFileSync(IMG_PATH)
    return await sock.sendMessage(m.chat, { image, caption: text }, { quoted: m.raw || m })
  } catch {
    return await m.reply(text)
  }
}

async function uploadThumb(sock) {
  if (_cachedThumb) return _cachedThumb

  const url = config.menuThumbnail || ''
  let buffer

  try {
    if (url) {
      const res = await fetch(url)
      if (res.ok) buffer = Buffer.from(await res.arrayBuffer())
    }
    if (!buffer) buffer = readFileSync(IMG_PATH)
  } catch {
    try { buffer = readFileSync(IMG_PATH) } catch { return null }
  }

  try {
    const { imageMessage } = await prepareWAMessageMedia(
      { image: buffer },
      { upload: sock.waUploadToServer, mediaTypeOverride: 'thumbnail-link' }
    )
    _cachedThumb = imageMessage
    return imageMessage
  } catch {
    return null
  }
}

async function sendInteractive(m, sock, text) {
  const thumb = await uploadThumb(sock)
  const link  = config.menuLink || config.api?.zellrayy || 'https://api.zellrayy.com'

  if (!thumb) return m.reply(text)

  const fullText = `${text}\n\n_ZellRayy • ${link}_`

  await sock.relayMessage(m.chat, {
    extendedTextMessage: {
      text:        fullText,
      matchedText: link,
      title:               config.botName,
      description:         `Powered by ZellRayy | api.zellrayy.com`,
      previewType:         0,
      jpegThumbnail:       thumb.jpegThumbnail,
      thumbnailDirectPath: thumb.directPath,
      thumbnailSha256:     Buffer.from(thumb.fileSha256).toString('base64'),
      thumbnailEncSha256:  Buffer.from(thumb.fileEncSha256).toString('base64'),
      mediaKey:            Buffer.from(thumb.mediaKey).toString('base64'),
      mediaKeyTimestamp:   thumb.mediaKeyTimestamp,
      thumbnailHeight:     thumb.height,
      thumbnailWidth:      thumb.width
    }
  }, { messageId: sock.generateMessageTag() })
}

export default {
  name: 'AllMenu',
  command: ['allmenu'],
  async run({ m, sock }) {
    const text  = buildAllMenuText()
    const style = config.menuStyle || 'text'

    if (style === 'interactive') return sendInteractive(m, sock, text)
    if (style === 'image') return sendWithImage(m, sock, text)
    m.reply(text)
  }
}
