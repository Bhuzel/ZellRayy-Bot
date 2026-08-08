import fetch from 'node-fetch'
import { extractUrl } from '../../lib/helper.js'

export default {
  name: 'GitHub Downloader',
  command: ['gitdl', 'githubdl', 'github'],
  category: 'downloader',
  description: 'Download repository GitHub sebagai ZIP archive',

  async run({ m, args, react, config }) {
    const url = extractUrl(args, m)
    if (!url || !url.includes('github.com')) {
      return m.reply('Kirim atau reply pesan yang berisi link repository GitHub valid.\nContoh: .gitdl https://github.com/user/repo')
    }

    await react('loading')

    try {
      const apiUrl = `${config.api.zellrayy}/download/github?url=${encodeURIComponent(url)}`
      const res = await fetch(apiUrl)
      const json = await res.json()

      if (!json.status || !json.result?.download?.zip) {
        await react('error')
        return m.reply('[GitHub Error] Gagal mengambil data repository.')
      }

      const { owner, repo, default_branch, download } = json.result

      const zipRes = await fetch(download.zip)
      if (!zipRes.ok) throw new Error(`Gagal fetch ZIP: ${zipRes.status}`)

      const buffer = Buffer.from(await zipRes.arrayBuffer())

      await m.sendDocument(buffer, `${owner}-${repo}-${default_branch}.zip`, { mimetype: 'application/zip' })
      await react('ok')

    } catch (e) {
      await react('error')
      m.reply(`[GitHub Error] ${e.message}`)
    }
  }
}
