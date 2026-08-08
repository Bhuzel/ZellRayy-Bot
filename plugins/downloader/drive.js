import fetch from 'node-fetch'
import { extractUrl } from '../../lib/helper.js'

export default {
  name: 'Google Drive Downloader',
  command: ['drivedl', 'gdrive', 'drive'],
  category: 'downloader',
  description: 'Download file publik dari Google Drive',

  async run({ m, args, react, config }) {
    const url = extractUrl(args, m)
    if (!url || !url.includes('drive.google.com')) {
      return m.reply('Kirim atau reply pesan yang berisi link Google Drive valid.\nContoh: .drivedl https://drive.google.com/file/d/xxx/view')
    }

    await react('loading')

    try {
      const apiUrl = `${config.api.zellrayy}/download/drive?url=${encodeURIComponent(url)}`
      const res = await fetch(apiUrl)
      const json = await res.json()

      if (!json.status || !json.result?.downloadUrl) {
        await react('error')
        return m.reply('[Drive Error] Gagal mengambil data file.')
      }

      const { filename, mimeType, sizeMB, downloadUrl } = json.result

      const fileRes = await fetch(downloadUrl)
      if (!fileRes.ok) throw new Error(`Gagal fetch file: ${fileRes.status}`)

      const buffer = Buffer.from(await fileRes.arrayBuffer())

      await m.sendDocument(buffer, filename || 'file', { mimetype: mimeType || 'application/octet-stream' })
      await react('ok')

    } catch (e) {
      await react('error')
      m.reply(`[Drive Error] ${e.message}`)
    }
  }
}
