import fetch from 'node-fetch'
import { extractText } from '../../lib/helper.js'

export default {
  name: 'YouTube Search',
  command: ['ytsearch', 'searchyt', 'cariyoutube'],
  category: 'search',
  description: 'Cari video di YouTube berdasarkan kata kunci',

  async run({ m, args, react, config }) {
    const query = extractText(args, m)
    if (!query) {
      return m.reply('Ketik kata kunci atau reply pesan teks.\nContoh: .ytsearch tutorial bot WhatsApp')
    }

    await react('loading')

    try {
      const apiUrl = `${config.api.zellrayy}/search/youtube?q=${encodeURIComponent(query)}`
      const res = await fetch(apiUrl)
      const json = await res.json()

      if (!json.status || !json.result?.length) {
        await react('error')
        return m.reply('[YouTube Search] Tidak ada hasil ditemukan.')
      }

      const results = json.result.slice(0, 5)

      const list = results.map((v, i) =>
        `[${i + 1}] ${v.title}\n` +
        `    Channel: ${v.channel?.name || '-'}\n` +
        `    Durasi : ${v.duration} | Views: ${v.shortViews}\n` +
        `    URL    : ${v.url}`
      ).join('\n\n')

      await m.reply(
        `[ Hasil Pencarian YouTube ]\n` +
        `Query: "${query}"\n` +
        `───────────────────────────────\n\n` +
        list
      )
      await react('ok')

    } catch (e) {
      await react('error')
      m.reply(`[YouTube Search Error] ${e.message}`)
    }
  }
}
