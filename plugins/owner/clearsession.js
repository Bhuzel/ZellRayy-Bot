import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default {
  name: 'Clear Session Bot',
  command: ['clearsession'],
  category: 'owner',
  description: 'Bersihkan file sampah pre-key session tanpa lag',
  settings: { owner: true },

  async run({ m, react, config }) {
    await react('loading')

    const sessionDir = path.resolve(__dirname, '../../', config.sessionName || 'session')

    if (!fs.existsSync(sessionDir)) {
      await react('error')
      return m.reply('[Clear Session] Folder session tidak ditemukan.')
    }

    let files
    try {
      files = fs.readdirSync(sessionDir)
    } catch (e) {
      await react('error')
      return m.reply(`[Clear Session Error] ${e.message}`)
    }

    const toDelete = files.filter(f => /^pre-key-\d+\.json$/.test(f))

    if (toDelete.length === 0) {
      await react('ok')
      return m.reply('[Clear Session] Session sudah bersih. Tidak ada pre-key yang perlu dihapus.')
    }

    let deleted = 0
    const errors = []

    for (const file of toDelete) {
      try {
        fs.unlinkSync(path.join(sessionDir, file))
        deleted++
      } catch (e) {
        errors.push(`${file}: ${e.message}`)
      }
    }

    await react(errors.length === 0 ? 'ok' : 'error')
    return m.reply(`[Clear Session] Berhasil menghapus ${deleted} file pre-key session.`)
  }
}
