import { exec } from 'child_process'

export default {
  name: 'Execute Terminal',
  command: ['$', 'exec', 'execute'],
  category: 'owner',
  description: 'Eksekusi perintah terminal / system shell',
  settings: { owner: true },
  async run({ m, args }) {
    const text = args.join(' ')
    if (!text) return m.reply('Masukkan perintah terminal.')

    await m.react('⏳')
    exec(text, (err, stdout, stderr) => {
      if (err) return m.reply(`❌ *Exec Error*:\n\`\`\`${err.message}\`\`\``)
      if (stderr) return m.reply(`⚠️ *Exec Stderr*:\n\`\`\`${stderr}\`\`\``)
      return m.reply(`🖥️ *Exec Result*:\n\`\`\`${stdout || 'Done (No Output)'}\`\`\``)
    })
  }
}
