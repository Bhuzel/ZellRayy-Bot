export default {
  name: 'Whatsapp Owner',
  command: ['owner', 'creator', 'developer'],
  category: 'info',
  description: 'Menampilkan info kontak owner bot',
  async run({ m, config }) {
    const ownerNum = config.ownerNumber[0] || '6282352052566'
    await m.sendContact(ownerNum, `Owner ${config.botName}`)
  }
}
