import fetch from 'node-fetch'
import { extractText } from '../../lib/helper.js'

export default {
  name: 'Translate',
  command: ['translate', 'tr'],
  category: 'tools',
  description: 'Menerjemahkan teks antar bahasa',

  async run({ m, args, react }) {
    let lang = args[0] || 'id'
    let text = extractText(args.slice(1), m)

    if (!text) {
      text = extractText(args, m)
      lang = 'id'
    }

    if (!text) {
      return m.reply('Masukkan teks atau reply pesan yang ingin diterjemahkan.\nContoh: .tr id Hello world')
    }

    await react('loading')

    try {
      const apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`
      const res = await fetch(apiUrl)
      const data = await res.json()

      if (!data || !data[0]) throw new Error('Gagal memproses terjemahan.')

      const translated = data[0].map(item => item[0]).filter(Boolean).join('')
      const detectedLang = data[2] || 'auto'

      await m.reply(
        `[ Terjemahan ]\n\n` +
        `Dari  : ${detectedLang.toUpperCase()}\n` +
        `Ke    : ${lang.toUpperCase()}\n` +
        `───────────────────────────────\n` +
        `${translated}`
      )
      await react('ok')
    } catch (e) {
      await react('error')
      m.reply(`[Translate Error] ${e.message}`)
    }
  }
}
