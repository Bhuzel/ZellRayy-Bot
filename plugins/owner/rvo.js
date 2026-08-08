export default {
  name: 'Read View Once',
  command: ['rvo', 'readviewonce'],
  category: 'owner',
  settings: { owner: true },
  description: 'Membuka dan menampilkan media View Once (Lihat Sekali)',

  async run({ m, react }) {
    if (!m.quoted) return m.reply('Reply pesan View Once (Lihat Sekali) yang ingin dibuka.')

    const qMsg = m.quoted
    const viewOnceContent =
      qMsg.message?.viewOnceMessage?.message ||
      qMsg.message?.viewOnceMessageV2?.message ||
      qMsg.message?.viewOnceMessageV2Extension?.message ||
      qMsg.message

    if (!viewOnceContent) return m.reply('Pesan yang di-reply bukan pesan View Once.')

    await react('loading')
    const buf = await qMsg.download()
    if (!buf) return m.reply('[RVO Error] Gagal mengunduh media View Once.')

    const qType = Object.keys(viewOnceContent)[0] || qMsg.mtype
    if (qType.includes('image')) {
      await m.sendImage(buf, '[ Read View Once ]')
    } else if (qType.includes('video')) {
      await m.sendVideo(buf, '[ Read View Once ]')
    } else if (qType.includes('audio')) {
      await m.sendAudio(buf, false)
    } else {
      await m.reply('[RVO Error] Tipe media View Once tidak didukung.')
    }
    await react('ok')
  }
}
