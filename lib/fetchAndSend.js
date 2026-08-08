import fetch from 'node-fetch'

/**
 * Mapping content-type prefix → tipe media
 */
const CONTENT_TYPE_MAP = [
  // image
  { prefix: 'image/webp',  type: 'sticker' },
  { prefix: 'image/',      type: 'image'   },
  // video
  { prefix: 'video/',      type: 'video'   },
  // audio
  { prefix: 'audio/',      type: 'audio'   },
  // json
  { prefix: 'application/json', type: 'json' },
  { prefix: 'text/json',        type: 'json' },
  // teks biasa (html, plain, xml, dll)
  { prefix: 'text/',       type: 'text'    },
  // pdf / office / dsb → document
  { prefix: 'application/', type: 'document' },
]

/**
 * Tentuin tipe berdasarkan content-type header.
 * @param {string} contentType  - nilai header Content-Type dari response
 * @returns {'image'|'video'|'audio'|'sticker'|'json'|'text'|'document'|'unknown'}
 */
function resolveType(contentType) {
  if (!contentType) return 'unknown'
  const ct = contentType.toLowerCase().split(';')[0].trim()
  for (const { prefix, type } of CONTENT_TYPE_MAP) {
    if (ct === prefix || ct.startsWith(prefix)) return type
  }
  return 'unknown'
}

/**
 * Fetch URL lalu kirim ke chat sesuai content-type response-nya.
 *
 * @param {string} url          - URL yang akan di-fetch
 * @param {object} m            - object m hasil serialize (harus punya sendImage, sendVideo, dll)
 * @param {object} [options]
 * @param {string} [options.caption]    - caption untuk image/video/audio/document
 * @param {string} [options.fileName]   - nama file buat document (default: 'file')
 * @param {object} [options.fetchOpts]  - opsi tambahan diteruskan ke node-fetch (misal headers)
 * @param {boolean} [options.quoteReply] - kalau true, reply ke pesan pengirim (default: false)
 * @returns {Promise<void>}
 */
export async function fetchAndSend(url, m, options = {}) {
  const { caption = '', fileName = 'file', fetchOpts = {}, quoteReply = false } = options

  const res = await fetch(url, fetchOpts)
  if (!res.ok) throw new Error(`Fetch gagal, status: ${res.status} ${res.statusText}`)

  const contentType = res.headers.get('content-type') || ''
  const type = resolveType(contentType)

  const sendOpts = quoteReply ? { quoted: m } : {}

  switch (type) {
    case 'sticker': {
      const buf = Buffer.from(await res.arrayBuffer())
      await m.sendSticker(buf, { type: 'sticker', ...sendOpts })
      break
    }

    case 'image': {
      const buf = Buffer.from(await res.arrayBuffer())
      await m.sendImage(buf, caption, sendOpts)
      break
    }

    case 'video': {
      const buf = Buffer.from(await res.arrayBuffer())
      await m.sendVideo(buf, caption, sendOpts)
      break
    }

    case 'audio': {
      const buf = Buffer.from(await res.arrayBuffer())
      // ptt: false → audio biasa; kalau mau voice note set ptt: true di fetchOpts
      await m.sock.sendMessage(m.chat, { audio: buf, mimetype: contentType.split(';')[0].trim(), ptt: false, ...sendOpts })
      break
    }

    case 'json': {
      const data = await res.json()
      const pretty = JSON.stringify(data, null, 2)
      const text = caption ? `${caption}\n\`\`\`json\n${pretty}\n\`\`\`` : `\`\`\`json\n${pretty}\n\`\`\``
      if (quoteReply) {
        await m.reply(text)
      } else {
        await m.sendText(text)
      }
      break
    }

    case 'text': {
      const text = await res.text()
      const out = caption ? `${caption}\n${text}` : text
      if (quoteReply) {
        await m.reply(out)
      } else {
        await m.sendText(out)
      }
      break
    }

    case 'document':
    default: {
      const buf = Buffer.from(await res.arrayBuffer())
      const mime = contentType.split(';')[0].trim() || 'application/octet-stream'
      await m.sendDocument(buf, fileName, { mimetype: mime, caption, ...sendOpts })
      break
    }
  }
}
