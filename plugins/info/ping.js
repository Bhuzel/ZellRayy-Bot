export default {
  name: 'Cek Speed & Uptime Bot',
  command: ['ping', 'speed', 'runtime'],
  category: 'info',
  description: 'Cek kecepatan respon dan uptime bot',

  async run({ m, sock, config }) {
    const start = Date.now()
    const msg = await m.reply('Testing response speed...')
    const speed = Date.now() - start

    const uptime = process.uptime()
    const d = Math.floor(uptime / (3600 * 24))
    const h = Math.floor((uptime % (3600 * 24)) / 3600)
    const min = Math.floor((uptime % 3600) / 60)
    const sec = Math.floor(uptime % 60)
    const uptimeStr = `${d}d ${h}h ${min}m ${sec}s`

    const responseText = `[Response Test]\n\n` +
      `Response Time: ${speed} ms\n` +
      `Uptime: ${uptimeStr}\n` +
      `Bot Name: ${config.botName}`

    if (msg && msg.key) {
      try {
        await sock.sendMessage(m.chat, { text: responseText, edit: msg.key })
      } catch {
        await m.reply(responseText)
      }
    } else {
      await m.reply(responseText)
    }
  }
}
