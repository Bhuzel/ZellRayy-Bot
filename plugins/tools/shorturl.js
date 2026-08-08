import fetch from 'node-fetch'
import { extractUrl } from '../../lib/helper.js'

export default {
  name: 'Short URL',
  command: ['shorturl', 'shortlink', 'shorten'],
  category: 'tools',
  description: 'Memendekkan URL / link panjang',

  async run({ m, args, react }) {
    const url = extractUrl(args, m)
    if (!url) {
      return m.reply('Masukkan URL atau reply pesan yang berisi link.\nContoh: .shorturl https://example.com/long-path')
    }

    await react('loading')

    try {
      const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`)
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`)
      const short = await res.text()

      await m.reply(`[ Short URL ]\n\nOriginal: ${url}\nHasil   : ${short}`)
      await react('ok')
    } catch (e) {
      await react('error')
      m.reply(`[ShortURL Error] ${e.message}`)
    }
  }
}
