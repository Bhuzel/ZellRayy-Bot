export default {
  name: 'Copy Raw Message',
  command: ['crm'],
  category: 'owner',
  description: 'Copy & kirim file JSON struktur mentah pesan (Raw Message)',
  settings: {
    owner: true
  },

  async run({ m, react }) {
    if (!m.quoted) {
      return m.reply('Reply pesan yang ingin dilihat strukturnya, lalu ketik .crm')
    }

    await react('loading')

    const raw = {
      key: m.quoted.key,
      message: m.quoted.message
    }

    const jsonStr = JSON.stringify(raw, (_, val) => {
      if (val instanceof Uint8Array || Buffer.isBuffer(val)) {
        return '<Buffer ' + Buffer.from(val).toString('hex') + '>'
      }
      return val
    }, 2)

    const buf = Buffer.from(jsonStr, 'utf-8')
    const fileName = `crm_${Date.now()}.json`

    await m.sendDocument(buf, fileName, {
      mimetype: 'application/json',
      caption: `[ Copy Raw Message ]\nFile: ${fileName}\nUkuran: ${(buf.length / 1024).toFixed(1)} KB`
    })

    await react('ok')
  }
}
