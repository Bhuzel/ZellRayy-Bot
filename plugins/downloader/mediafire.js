import fetch from 'node-fetch'
import { extractUrl } from '../../lib/helper.js'

export default {
  name: 'MediaFire Downloader',
  command: ['mediafire', 'mfdl', 'mfire'],
  category: 'downloader',
  description: 'Download file dari MediaFire',

  async run({ m, args, react, config }) {
    const url = extractUrl(args, m)
    if (!url || !url.includes('mediafire.com')) {
      return m.reply('Kirim atau reply pesan yang berisi link MediaFire valid.\nContoh: .mediafire https://www.mediafire.com/file/xxx')
    }

    await react('loading')

    try {
      const apiUrl = `${config.api.zellrayy}/download/mediafire?url=${encodeURIComponent(url)}`
      const res = await fetch(apiUrl)
      const json = await res.json()

      if (!json.status || !json.download) {
        await react('error')
        return m.reply('[MediaFire Error] Gagal mengambil data file.')
      }

      const { filename, ext } = json.metadata || {}

      const fileRes = await fetch(json.download)
      if (!fileRes.ok) throw new Error(`Gagal fetch file: ${fileRes.status}`)

      const buffer = Buffer.from(await fileRes.arrayBuffer())

      const mimeMap = {
        zip: 'application/zip',
        rar: 'application/x-rar-compressed',
        '7z': 'application/x-7z-compressed',
        pdf: 'application/pdf',
        apk: 'application/vnd.android.package-archive',
        mp3: 'audio/mpeg',
        mp4: 'video/mp4',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
      }
      const mimetype = mimeMap[ext?.toLowerCase()] || 'application/octet-stream'

      await m.sendDocument(buffer, filename || `file.${ext || 'bin'}`, { mimetype })
      await react('ok')
    } catch (e) {
      await react('error')
      m.reply(`[MediaFire Error] ${e.message}`)
    }
  }
}
