import fetch from 'node-fetch'
import { extractText } from '../../lib/helper.js'

export default {
  name: 'Unlimited AI',
  command: ['unlimited', 'unlimitedai', 'aiunlimited'],
  category: 'ai',
  description: 'Tanya jawab dengan Unlimited AI dari ZellRayy API',

  async run({ m, args, react, sock, config }) {
    const prompt = extractText(args, m)
    if (!prompt) {
      return m.reply('Ketik pertanyaannya atau reply pesan teks.\nContoh: .unlimited Apa yang dimaksud dengan MLM?')
    }

    await react('loading')

    try {
      const baseUrl = config.api?.zellrayy || 'https://api.zellrayy.com'
      const apiUrl = `${baseUrl}/ai/unlimited?q=${encodeURIComponent(prompt)}`
      const res = await fetch(apiUrl)
      const json = await res.json()

      if (!json.status || !json.result) {
        await react('error')
        return m.reply('[Unlimited AI Error] Gagal mendapatkan respon dari AI.')
      }

      const resultText = json.result

      await sock.sendMessage(m.chat, { text: resultText, ai: true }, { quoted: m })
      await react('ok')

    } catch (e) {
      await react('error')
      await m.reply(`[Unlimited AI Error] ${e.message}`)
    }
  }
}
