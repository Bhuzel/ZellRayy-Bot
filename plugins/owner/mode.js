import { setSelfMode, getSelfMode } from '../../lib/selfMode.js'

export default {
  name: 'Bot Mode',
  command: ['mode', 'public', 'self'],
  category: 'owner',
  description: 'Ubah mode bot (Self / Public)',
  settings: { owner: true },
  async run({ m, command }) {
    if (command === 'self') {
      setSelfMode(true)
      return m.reply('[Mode Bot] Berhasil diubah ke SELF MODE.')
    }

    if (command === 'public') {
      setSelfMode(false)
      return m.reply('[Mode Bot] Berhasil diubah ke PUBLIC MODE.')
    }

    const isSelf = getSelfMode()
    return m.reply(`[Status Bot Mode] ${isSelf ? 'SELF MODE' : 'PUBLIC MODE'}\n\nKetik .self atau .public untuk mengubah.`)
  }
}
