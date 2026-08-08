/**
 * .menu [kategori]  /  .help [kategori]
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

function groupByCategory() {
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
      byCategory[catLower].push(plugin)
    }
  }
  return byCategory
}

function buildMenuText(byCategory, usedPrefix) {
  const prefixes = Array.isArray(config.prefix) ? config.prefix : [config.prefix]
  const p = config.usePrefix === false ? '' : (usedPrefix || prefixes[0])
  const totalCmd = Object.values(byCategory).reduce((sum, list) => sum + list.length, 0)

  let text = `╭──[ ${config.botName}\n`
  text += `├ Creator : ZellRayy\n`
  text += `├ Plugin  : ${totalCmd}\n`
  text += `├ Prefix  : [ ${config.usePrefix === false ? '(tanpa prefix)' : prefixes.join(' ')} ]\n`
  text += `├ Status  : Online\n`
  text += `╰────────────\n`
  text += `Ketik *${p}menu <kategori>* untuk detail.\n`
  text += `Ketik *${p}allmenu* untuk lihat semuanya.\n\n`
  text += `╭─「 List Menu 」\n`
  for (const [cat] of Object.entries(byCategory)) {
    text += `├ Menu ${capitalize(cat)}\n`
  }
  text += `╰────────────\n`
  return text.trim()
}

function buildCategoryText(cat, list, usedPrefix) {
  const prefixes = Array.isArray(config.prefix) ? config.prefix : [config.prefix]
  const p = config.usePrefix === false ? '' : (usedPrefix || prefixes[0])

  let text = `╭──[ Menu ${capitalize(cat)}\n`
  for (const plugin of list) {
    text += `├ ${p}${plugin.command[0]}\n`
  }
  text += `╰──────────`
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
  const link = config.menuLink || config.api?.zellrayy || 'https://api.zellrayy.com'

  if (!thumb) return m.reply(text)

  const fullText = `${text}\n\n_Powered by ZellRayy • ${link}_`

  try {
    await sock.relayMessage(m.chat, {
      extendedTextMessage: {
        text: fullText,
        matchedText: link,
        title: config.botName,
        description: `Powered by ZellRayy | api.zellrayy.com`,
        previewType: 0,
        jpegThumbnail: thumb.jpegThumbnail,
        thumbnailDirectPath: thumb.directPath,
        thumbnailSha256: Buffer.from(thumb.fileSha256).toString('base64'),
        thumbnailEncSha256: Buffer.from(thumb.fileEncSha256).toString('base64'),
        mediaKey: Buffer.from(thumb.mediaKey).toString('base64'),
        mediaKeyTimestamp: thumb.mediaKeyTimestamp,
        thumbnailHeight: thumb.height,
        thumbnailWidth: thumb.width
      }
    }, { messageId: sock.generateMessageTag() })
  } catch (e) {
    console.error('[MENU DBG] relayMessage ERROR:', e.message)
    m.reply(text)
  }
}

export default {
  name: 'Menu',
  command: ['menu', 'help'],
  async run({ m, args, sock }) {
    const byCategory = groupByCategory()
    const prefixes = Array.isArray(config.prefix) ? config.prefix : [config.prefix]
    const usedPrefix = m.body ? (prefixes.find(p => m.body.startsWith(p)) || '') : ''
    const style = config.menuStyle || 'text'

    if (args[0]) {
      const cat = args[0].toLowerCase()
      const list = byCategory[cat]
      if (!list) {
        const availableCats = Object.keys(byCategory).map(capitalize).join(', ')
        return m.reply(`Kategori *${capitalize(cat)}* tidak ditemukan.\nKategori yang ada: ${availableCats}`)
      }
      const text = buildCategoryText(cat, list, usedPrefix)
      if (style === 'interactive') return sendInteractive(m, sock, text)
      if (style === 'image') return sendWithImage(m, sock, text)
      return m.reply(text)
    }

    const text = buildMenuText(byCategory, usedPrefix)
    if (style === 'interactive') return sendInteractive(m, sock, text)
    if (style === 'image') return sendWithImage(m, sock, text)
    m.reply(text)
  }
}
