import { downloadMediaMessage } from '@whiskeysockets/baileys'

export default {
  name: 'Set Foto Profile Bot',
  command: ['setppbot', 'setpp'],
  category: 'owner',
  description: 'Ganti foto profil akun WhatsApp bot',
  settings: { owner: true },

  async run({ m, react, sock }) {
    const isImgHere = m.mtype === 'imageMessage'
    const isImgQuoted = m.quoted && Object.keys(m.quoted.message)[0] === 'imageMessage'

    if (!isImgHere && !isImgQuoted) {
      return m.reply(
        '❌ Kirim atau reply *foto* dengan caption *.setppbot*\n\n' +
        'Contoh:\n' +
        '• Kirim foto → caption: .setppbot\n' +
        '• Reply foto → .setppbot'
      )
    }

    await react('loading')
    try {
      let buffer
      if (isImgQuoted) {
        buffer = await downloadMediaMessage(
          { key: m.quoted.key, message: m.quoted.message },
          'buffer', {}
        )
      } else {
        buffer = await m.download(false)
      }

      if (!buffer || buffer.length === 0) throw new Error('Gagal download foto')

      const botJid = sock.user?.id || sock.user?.lid
      await sock.updateProfilePicture(botJid, buffer)
      await react('ok')
      await m.reply('✅ Foto profil bot berhasil diperbarui!')
    } catch (e) {
      await react('error')
      await m.reply(`❌ Gagal ganti foto profil: ${e.message}`)
    }
  }
}
