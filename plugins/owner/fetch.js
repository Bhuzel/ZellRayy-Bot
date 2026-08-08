import { fetchAndSend } from '../../lib/fetchAndSend.js'
import { extractUrl } from '../../lib/helper.js'

export default {
  name: 'Get URL',
  command: ['get', 'fetch'],
  category: 'owner',
  description: 'Ambil dan kirim konten dari URL publik',
  settings: { owner: true },

  async run({ m, args, react }) {
    const rawText = args.join(' ').trim()
    const url = extractUrl(args, m)

    if (!url) {
      return m.reply(
        '[Fetch]\n\n' +
        'Kirim link atau reply pesan yang berisi link:\n' +
        '• .fetch https://api.github.com/users/octocat\n' +
        '• .get https://example.com/img.jpg\n' +
        '• Reply pesan berlink -> .fetch'
      )
    }

    const captionBase = rawText ? rawText.replace(url, '').trim() : ''

    await react('loading')
    try {
      await fetchAndSend(url, m, { caption: captionBase, quoteReply: true })
      await react('ok')
    } catch (e) {
      await react('error')
      await m.reply(`[Fetch Error] ${e.message || String(e)}`)
    }
  }
}
