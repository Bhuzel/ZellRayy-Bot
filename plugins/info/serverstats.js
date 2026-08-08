import os from 'os'

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const parts = []
  if (d) parts.push(`${d} hari`)
  if (h) parts.push(`${h} jam`)
  if (m) parts.push(`${m} menit`)
  parts.push(`${s} detik`)
  return parts.join(', ')
}

function formatBytes(bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

export default {
  name: 'ServerStats',
  command: ['serverstats', 'serverinfo'],
  category: 'info',
  description: 'Menampilkan rincian statistik CPU & RAM server host bot',
  async run({ m, config }) {
    const mem = process.memoryUsage()
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem

    const text = `*📊 Stats — ${config.botName}*

*🤖 Bot*
• Uptime    : ${formatUptime(Math.floor(process.uptime()))}
• RAM Used  : ${formatBytes(mem.rss)} (heap: ${formatBytes(mem.heapUsed)})
• Node.js   : ${process.version}

*🖥️ Server*
• Platform  : ${os.platform()} (${os.arch()})
• CPU       : ${os.cpus()[0]?.model || '-'}
• CPU Core  : ${os.cpus().length} core
• RAM Server: ${formatBytes(usedMem)} / ${formatBytes(totalMem)}
• Up Server : ${formatUptime(os.uptime())}`

    await m.reply(text.trim())
  }
}
