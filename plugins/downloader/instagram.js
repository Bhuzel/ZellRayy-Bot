import fetch from 'node-fetch'
import fetchBuffer from '../../lib/fetchBuffer.js'

async function getInstagram(url, config) {
  const apiUrl = `${config.api.zellrayy}/download/instagram?url=${encodeURIComponent(url)}`
  const res = await fetch(apiUrl)
  const json = await res.json()

  if (!json.status || !json.result?.length) return null

  const items = []
  json.result.forEach((item, i) => {
    if (item.video_url) {
      items.push({
        isVideo: true,
        url: item.video_url,
        caption: item.caption ? item.caption.slice(0, 200) : `Video ${i + 1}`
      })
    } else if (item.image_url || item.url) {
      items.push({
        isVideo: item.type?.toLowerCase() === 'video',
        url: item.image_url || item.url,
        caption: item.caption ? item.caption.slice(0, 200) : `Photo ${i + 1}`
      })
    }
  })

  if (!items.length) return null

  return {
    label: items.some(x => x.isVideo) ? 'Instagram Video' : 'Instagram Photo',
    total: items.length,
    items
  }
}

export default {
  name: 'Instagram Downloader',
  command: ['igdl', 'ig', 'instagram'],
  category: 'downloader',
  description: 'Download foto, video, & reel dari Instagram',

  async run({ m, text, args, react, config }) {
    const input = text || args?.join(' ') || m.quoted?.text || ''
    const url = input.match(/https?:\/\/(www\.)?instagram\.com\/[^\s]+/i)?.[0]

    if (!url) {
      return m.reply('Kirim atau reply pesan yang berisi link Instagram valid.\nContoh: .ig https://www.instagram.com/p/xxx')
    }

    await react('loading')

    try {
      const data = await getInstagram(url, config)

      if (!data) {
        await react('error')
        return m.reply('[Instagram Error] Gagal mengambil data dari server. Pastikan link Instagram publik dan valid.')
      }

      const { label, total, items } = data

      if (total > 1) {
        await m.reply(`[Instagram Downloader]\nMendownload ${total} file...`)
      }

      let sent = 0
      for (const item of items) {
        try {
          const buffer = await fetchBuffer(item.url)

          if (item.isVideo) {
            await m.sendVideo(buffer, sent === 0 ? `[ ${label} ]` : '')
          } else {
            await m.sendImage(buffer, sent === 0 ? `[ ${label} ]\n\n${item.caption}` : '')
          }

          sent++
        } catch (e) {
          console.error(`[IGDL] Gagal kirim item ${sent + 1}:`, e.message)
        }
      }

      if (sent === 0) {
        await react('error')
        return m.reply('[Instagram Error] Semua media gagal didownload.')
      }

      await react('ok')

    } catch (e) {
      await react('error')
      m.reply(`[Instagram Error] ${e.message}`)
    }
  }
}
