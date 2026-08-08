import util from 'util'

export default {
  name: 'Evaluasi Kode',
  command: ['=>', '='],
  category: 'owner',
  description: 'Evaluasi kode JavaScript secara real-time',
  settings: { owner: true },
  async run({ m, args, command, sock, chat, sender, config }) {
    const text = args.join(' ')
    if (!text) return m.reply('Masukkan kode JavaScript.')

    try {
      let result
      if (command === '=>') {
        result = await eval(`(async (sock, m, chat, sender, config) => { return ${text} })(sock, m, chat, sender, config)`)
      } else {
        result = await eval(`(async (sock, m, chat, sender, config) => { ${text} })(sock, m, chat, sender, config)`)
      }

      if (typeof result !== 'string') {
        result = util.inspect(result, { depth: 2 })
      }
      await m.reply(`💻 *Eval Output*:\n\`\`\`js\n${result}\n\`\`\``)
    } catch (e) {
      await m.reply(`❌ *Eval Error*:\n\`\`\`js\n${e.stack || e.message || e}\n\`\`\``)
    }
  }
}
