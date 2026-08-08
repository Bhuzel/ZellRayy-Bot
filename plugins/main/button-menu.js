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
  name: 'Button Menu',
  command: ['bmenu', 'buttonmenu'],
  description: 'Tampilan menu interaktif dengan Image Header, Link CTA, dan List Selection',

  async run({ m, sock, usedPrefix }) {
    const byCategory = groupByCategory()
    const totalCmd = Object.values(byCategory).reduce((sum, list) => sum + list.length, 0)
    const prefixes = Array.isArray(config.prefix) ? config.prefix : [config.prefix]
    const p = config.usePrefix === false ? '' : (usedPrefix || prefixes[0])

    const text = `╭──[ ${config.botName}\n` +
      `├ Creator : ZellRayy\n` +
      `├ Plugin  : ${totalCmd} Plugins\n` +
      `├ Prefix  : [ ${config.usePrefix === false ? '(tanpa prefix)' : prefixes.join(' ')} ]\n` +
      `├ Status  : Online\n` +
      `╰────────────\n` +
      `klik tombol List Menu dibawah untuk melihat semua menu yang tersedia.`

    const categoryRows = Object.keys(byCategory).map(cat => ({
      title: `Menu ${capitalize(cat)}`,
      description: `${byCategory[cat].length} fitur tersedia`,
      id: `${p}menu ${cat}`
    }))

    const rows = [
      {
        title: 'Lihat Semua Fitur',
        description: 'Tampilkan seluruh daftar fitur yang tersedia',
        id: `${p}ballmenu`
      },
      ...categoryRows
    ]

    const buttons = [
      {
        type: 'url',
        text: 'ZellRayy API',
        url: config.menuLink || 'https://api.zellrayy.com'
      },
      {
        type: 'list',
        text: 'List Menu',
        list: {
          title: 'Menu',
          sections: [
            {
              title: 'List Menu',
              rows
            }
          ]
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
