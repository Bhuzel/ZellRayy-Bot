import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { plugins } from '../../lib/pluginLoader.js'
import config from '../../config.js'

const __dir = dirname(fileURLToPath(import.meta.url))
const IMG_PATH = resolve(__dir, '../../database/image.png')

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

async function getImageBuffer() {
  const url = config.menuThumbnail
  if (url) {
    try {
      const res = await fetch(url)
      if (res.ok) return Buffer.from(await res.arrayBuffer())
    } catch { }
  }
  if (existsSync(IMG_PATH)) {
    try { return readFileSync(IMG_PATH) } catch { }
  }
  return null
}

export default {
  name: 'Button AllMenu',
  command: ['ballmenu', 'buttonallmenu'],
  description: 'Tampilkan seluruh fitur bot dalam daftar dropdown interaktif',

  async run({ m, sock, usedPrefix }) {
    const byCategory = groupByCategory()
    const totalCmd = Object.values(byCategory).reduce((sum, list) => sum + list.length, 0)
    const prefixes = Array.isArray(config.prefix) ? config.prefix : [config.prefix]
    const p = config.usePrefix === false ? '' : (usedPrefix || prefixes[0])

    const text = `╭──[ ${config.botName}\n` +
      `├ Creator : ZellRayy\n` +
      `├ Plugin  : ${totalCmd} Fitur\n` +
      `├ Prefix  : ${config.usePrefix === false ? '(tanpa prefix)' : prefixes.join(' ')}\n` +
      `╰────────────\n\n` +
      `klik tombol Daftar Semua Fitur dibawah untuk melihat semua fitur yang tersedia.`
    // Bangun sections berdasarkan kategori, dimana setiap row adalah perintah individual!
    const sections = Object.entries(byCategory).map(([cat, list]) => {
      const rows = list.map(plugin => {
        const cmdName = plugin.command[0]
        const titleName = plugin.name || `Fitur ${capitalize(cmdName)}`
        return {
          title: titleName,
          description: `${p}${cmdName}`,
          id: `${p}${cmdName}`
        }
      })

      return {
        title: `Kategori ${capitalize(cat)}`,
        rows
      }
    })

    const buttons = [
      {
        type: 'url',
        text: 'ZellRayy API',
        url: config.menuLink || 'https://api.zellrayy.com'
      },
      {
        type: 'list',
        text: 'Daftar Semua Fitur',
        list: {
          title: 'Daftar Fitur Bot',
          sections
        }
      }
    ]

    const imgBuf = await getImageBuffer()
    const payload = {
      caption: text,
      footer: `${config.botName} • api.zellrayy.com`,
      buttons
    }

    if (imgBuf) {
      payload.image = imgBuf
    }

    try {
      await sock.sendButtons(m.chat, payload, { quoted: m })
    } catch (e) {
      await m.reply(text)
    }
  }
}
