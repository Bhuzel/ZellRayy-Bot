export default {
  name: 'Join Group',
  command: ['join'],
  category: 'owner',
  description: 'Join bot ke grup WhatsApp via link invite',
  settings: { owner: true },

  async run({ m, args, react, sock }) {
    const link = args[0]?.trim()

    if (!link || !link.includes('chat.whatsapp.com/')) {
      return m.reply(
        '❌ Berikan link grup yang valid.\n\n' +
        'Contoh: *.join https://chat.whatsapp.com/AbCdEfGhIjK*'
      )
    }

    const code = link.split('chat.whatsapp.com/')[1]?.split(/[/?]/)[0]
    if (!code) {
      return m.reply('❌ Link grup tidak valid atau tidak dapat diproses.')
    }

    await react('loading')
    try {
      const result = await sock.groupAcceptInvite(code)
      await react('ok')
      await m.reply(`✅ Bot berhasil join grup!\nGrup ID: \`${result}\``)
    } catch (e) {
      await react('error')
      const errMsg = e.message?.includes('not-authorized')
        ? 'Link tidak valid atau sudah kadaluarsa.'
        : e.message?.includes('already-exists')
        ? 'Bot sudah ada di dalam grup ini.'
        : e.message
      await m.reply(`❌ Gagal join grup: ${errMsg}`)
    }
  }
}
