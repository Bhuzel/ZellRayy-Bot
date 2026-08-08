export default {
  name: 'Get ID Sender',
  command: ['cekid', 'getid', 'myid'],
  category: 'tools',
  description: 'Tampilkan JID/ID unik chat dan sender',
  async run({ m, chat, sender }) {
    let text = `*🔍 Get ID*\n\n`
    text += `Chat ID   : \`${chat}\`\n`
    text += `Sender ID : \`${sender}\``

    if (m.quoted?.sender || m.quoted?.key?.participant) {
      text += `\nQuoted ID : \`${m.quoted.sender || m.quoted.key.participant}\``
    }

    await m.reply(text)
  }
}
