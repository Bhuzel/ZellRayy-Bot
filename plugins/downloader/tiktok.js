import fetch from 'node-fetch'
import fetchBuffer from '../../lib/fetchBuffer.js'
import { extractUrl } from '../../lib/helper.js'

const UA_HEADERS = { headers: { 'User-Agent': 'Mozilla/5.0' } }

async function fetchTiktokData(baseUrl, encodedUrl) {
  try {
    const res = await fetch(`${baseUrl}/download/tiktok?url=${encodedUrl}`)
    if (res.ok) {
      const json = await res.json()
      if (json?.status === true && json?.result) {
        return { data: json.result, isV1: true }
      }
    }
  } catch (_) { }

  const res2 = await fetch(`${baseUrl}/download/tiktok/v2?url=${encodedUrl}`)
  if (!res2.ok) throw new Error(`API v2 status ${res2.status}`)
  const json2 = await res2.json()
  if (json2?.status !== true || !json2?.result) throw new Error('Response API v2 tidak valid')
  return { data: json2.result, isV1: false }
}

export default {
  name: 'TikTok Downloader',
  command: ['tiktok', 'tt'],
  category: 'downloader',
  description: 'Download video & foto TikTok tanpa watermark',

  async run({ m, args, react, config }) {
    const url = extractUrl(args, m)
    if (!url || !url.includes('tiktok.com')) {
      return m.reply('Kirim atau reply pesan yang berisi link TikTok valid.\nContoh: .tiktok https://vt.tiktok.com/xxxxxxxx/')
    }

    await react('loading')

    const baseUrl = config.api.zellrayy
    const encodedUrl = encodeURIComponent(url)

    let data, isV1
    try {
      ; ({ data, isV1 } = await fetchTiktokData(baseUrl, encodedUrl))
    } catch (e) {
      await react('error')
      return m.reply(`[TikTok Error] ${e.message}`)
    }

    let caption
    if (isV1) {
      const parts = ['[ TikTok Downloader ]', '']
      if (data.author?.nickname) parts.push(`Uploader: ${data.author.nickname} (@${data.author.unique_id})`)
      if (data.title) parts.push(`Deskripsi: ${data.title}`)
      parts.push(
        `Likes: ${data.digg_count || 0} | Komentar: ${data.comment_count || 0} | Share: ${data.share_count || 0}`
      )
      caption = parts.join('\n').trim()
    } else {
      caption = `[ TikTok Downloader ]\n\nDeskripsi: ${data.title || '-'}`
    }

    try {
      const images = Array.isArray(data.images) ? data.images.filter(Boolean) : []

      if (images.length) {
        for (let i = 0; i < images.length; i++) {
          const buffer = await fetchBuffer(images[i], UA_HEADERS)
          await m.sendImage(buffer, i === 0 ? caption : '')
        }
        return react('ok')
      }

      const videoUrl = data.play
      if (!videoUrl) {
        await react('error')
        return m.reply('[TikTok Error] Link video tidak ditemukan.')
      }

      const buffer = await fetchBuffer(videoUrl, UA_HEADERS)
      await m.sendVideo(buffer, caption)
      await react('ok')
    } catch (e) {
      await react('error')
      m.reply(`[TikTok Error] ${e.message}`)
    }
  }
}
