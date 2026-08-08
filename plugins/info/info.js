import os from 'os'
import { getExtraOwners } from '../../lib/ownerDB.js'

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
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

function buildInfoText(config, sock, latency) {
  const mem = process.memoryUsage()
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = totalMem - freeMem
  const allOwners = [...config.ownerNumber, ...getExtraOwners()]
  const ownerList = allOwners.map((n) => `+${n}`).join(', ')

  return `[ Info — ${config.botName} ]

Ping       : ${latency} ms
Runtime    : ${formatUptime(Math.floor(process.uptime()))}
Node.js    : ${process.version}

[ Statistik Server ]
Platform   : ${os.platform()} (${os.arch()})
RAM Bot    : ${formatBytes(mem.rss)}
RAM Server : ${formatBytes(usedMem)} / ${formatBytes(totalMem)}
CPU        : ${os.cpus()[0]?.model || '-'} (${os.cpus().length} core)
Up Server  : ${formatUptime(os.uptime())}

[ Owner ]
${ownerList || '-'}

[ Config ]
Prefix    : ${Array.isArray(config.prefix) ? config.prefix.join(', ') : config.prefix}
Use Prefix: ${config.usePrefix ? 'Ya' : 'Tidak'}`.trim()
}

export default {
  name: 'Info Bot',
  command: ['info', 'botinfo', 'stats'],
  category: 'info',
  description: 'Menampilkan informasi statistik dan sistem bot',

  async run({ m, config, sock }) {
    const start = Date.now()
    const latency = Date.now() - start
    const text = buildInfoText(config, sock, latency)

    try {
      await m.sendWithThumbnail({
        text,
        title: `${config.botName} Info`,
        body: `System & Server Monitor`,
        thumbUrl: config.menuThumbnail
      })
    } catch {
      await m.reply(text)
    }
  }
}
