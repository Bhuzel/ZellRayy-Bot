import { extractUrl, extractText } from '../../lib/helper.js'

const CHANNEL_LINK_REGEX = /(?:whatsapp\.com\/channel\/)([0-9A-Za-z]{20,30})/i

/**
 * Ekstrak Nama, ID, Jumlah Pengikut, dan Deskripsi Channel dari response metadata Baileys / Mex GraphQL
 * @param {object} meta
 * @returns {{ name: string, id: string, subscribers: string, desc: string }}
 */
function extractChannelMetadata(meta) {
  if (!meta || typeof meta !== 'object') return { name: '-', id: '-', subscribers: '-', desc: '-' }

  const thread = meta.thread_metadata || meta.thread || {}

  // Extract Name
  let name = '-'
  if (typeof thread.name === 'object' && thread.name?.text) {
    name = thread.name.text
  } else if (typeof thread.name === 'string' && thread.name.trim()) {
    name = thread.name
  } else if (typeof meta.name === 'object' && meta.name?.text) {
    name = meta.name.text
  } else if (typeof meta.name === 'string' && meta.name.trim()) {
    name = meta.name
  } else if (meta.subject) {
    name = meta.subject
  }

  // Extract ID
  const id = meta.id || thread.id || '-'

  // Extract Subscribers
  const rawSubs =
    thread.subscribers_count ??
    thread.subscribersCount ??
    thread.subscribers ??
    meta.subscribers_count ??
    meta.subscribersCount ??
    meta.subscribers

  let subscribers = '-'
  if (typeof rawSubs === 'number') {
    subscribers = rawSubs.toLocaleString('id-ID')
  } else if (typeof rawSubs === 'string') {
    const num = parseInt(rawSubs.replace(/[^0-9]/g, ''), 10)
    if (!isNaN(num)) subscribers = num.toLocaleString('id-ID')
  }

  // Extract Description
  let desc = '-'
  if (typeof thread.description === 'object' && thread.description?.text) {
    desc = thread.description.text
  } else if (typeof thread.description === 'string' && thread.description.trim()) {
    desc = thread.description
  } else if (typeof meta.description === 'object' && meta.description?.text) {
    desc = meta.description.text
  } else if (typeof meta.description === 'string' && meta.description.trim()) {
    desc = meta.description
  }

  return { name, id, subscribers, desc }
}

export default {
  name: 'Get ID Channel',
  command: ['getidch', 'cekidch', 'idch', 'idchannel', 'getchid', 'infoch', 'channelinfo'],
  category: 'tools',
  description: 'Ambil Nama, ID/JID, dan info lengkap Saluran WhatsApp (Channel)',

  async run({ m, args, react, sock }) {
    const textInput = extractText(args, m)
    const urlInput = extractUrl(args, m)
    const rawTarget = urlInput || textInput || ''
    const match = rawTarget.match(CHANNEL_LINK_REGEX)
    const inviteCode = match ? match[1] : null

    const fInfo =
      m.message?.[m.mtype]?.contextInfo?.forwardedNewsletterMessageInfo ||
      m.quoted?.message?.[m.quoted?.mtype]?.contextInfo?.forwardedNewsletterMessageInfo ||
      m.quoted?.contextInfo?.forwardedNewsletterMessageInfo ||
      null

    const rawJid = rawTarget.includes('@newsletter') ? rawTarget.trim() : null

    await react('loading')

    try {
      // 1. Via link channel
      if (inviteCode) {
        try {
          const meta = await sock.newsletterMetadata('invite', inviteCode)
          const info = extractChannelMetadata(meta)

          let text = `*📢 Info Channel (Via Link)*\n\n`
          text += `• Nama Channel : *${info.name}*\n`
          text += `• Channel ID   : ${info.id}\n`
          if (info.subscribers !== '-') text += `• Pengikut     : ${info.subscribers} pengikut\n`
          if (info.desc !== '-') text += `• Deskripsi    : ${info.desc.slice(0, 150)}${info.desc.length > 150 ? '...' : ''}\n`

          await m.reply(text)
          await react('ok')
          return
        } catch (e) {
          await react('error')
          return m.reply(`[Cek ID Channel Error] Gagal mengambil data dari link: ${e.message}`)
        }
      }

      // 2. Via pesan forwarded dari channel
      if (fInfo?.newsletterJid) {
        const jid = fInfo.newsletterJid
        let name = fInfo.newsletterName || ''
        let subscribers = '-'
        let desc = '-'

        try {
          const meta = await sock.newsletterMetadata('jid', jid)
          const info = extractChannelMetadata(meta)
          if (info.name !== '-') name = info.name
          subscribers = info.subscribers
          desc = info.desc
        } catch {
          // fallback jika fetch by JID dibatasi
        }

        let text = `*📢 Info Channel (Via Forwarded Message)*\n\n`
        text += `• Nama Channel : *${name || 'Saluran WhatsApp'}*\n`
        text += `• Channel ID   : \`${jid}\`\n`
        if (subscribers !== '-') text += `• Pengikut     : ${subscribers} pengikut\n`
        if (fInfo.serverMessageId) text += `• Message ID   : ${fInfo.serverMessageId}\n`
        if (desc !== '-') text += `• Deskripsi    : ${desc.slice(0, 150)}${desc.length > 150 ? '...' : ''}\n`

        await m.reply(text)
        await react('ok')
        return
      }

      // 3. Via JID langsung (@newsletter)
      if (rawJid) {
        try {
          const meta = await sock.newsletterMetadata('jid', rawJid)
          const info = extractChannelMetadata(meta)

          let text = `*📢 Info Channel (Via JID)*\n\n`
          text += `• Nama Channel : *${info.name}*\n`
          text += `• Channel ID   : \`${rawJid}\`\n`
          if (info.subscribers !== '-') text += `• Pengikut     : ${info.subscribers} pengikut\n`
          if (info.desc !== '-') text += `• Deskripsi    : ${info.desc.slice(0, 150)}${info.desc.length > 150 ? '...' : ''}\n`

          await m.reply(text)
          await react('ok')
          return
        } catch (e) {
          let text = `*📢 Info Channel*\n\n`
          text += `• Channel ID : \`${rawJid}\``
          await m.reply(text)
          await react('ok')
          return
        }
      }

      await react('error')
      return m.reply(
        '*[ Cek ID Channel / Saluran ]*\n\n' +
        'Perintah ini digunakan untuk mengambil ID & Nama Channel WhatsApp.\n\n' +
        '📌 *Cara Penggunaan*:\n' +
        '1. Ketik `.cekidch <link_channel_wa>`\n' +
        '2. Forward pesan dari Channel ke bot, lalu reply pesan itu dengan `.cekidch`\n' +
        '3. Ketik `.cekidch 120363xxx@newsletter`\n\n' +
        'Contoh:\n' +
        '`.cekidch https://whatsapp.com/channel/0029VaXXXXX`'
      )
    } catch (e) {
      await react('error')
      await m.reply(`[Cek ID Channel Error] ${e.message}`)
    }
  }
}
