const MIME_MAP = {
  txt:  'text/plain',
  md:   'text/markdown',
  csv:  'text/csv',
  html: 'text/html',
  htm:  'text/html',
  xml:  'text/xml',
  css:  'text/css',
  js:   'text/javascript',
  mjs:  'text/javascript',
  ts:   'text/typescript',
  py:   'text/x-python',
  java: 'text/x-java-source',
  c:    'text/x-csrc',
  cpp:  'text/x-c++src',
  sh:   'text/x-shellscript',
  bat:  'text/plain',
  json: 'application/json',
  yaml: 'text/yaml',
  yml:  'text/yaml',
  toml: 'text/plain',
  ini:  'text/plain',
  env:  'text/plain',
  sql:  'text/plain',
  log:  'text/plain',
}

function getMime(ext) {
  return MIME_MAP[ext.toLowerCase()] || 'application/octet-stream'
}

export default {
  name: 'ToFile',
  command: ['tofile'],
  category: 'tools',
  description: 'Konversi pesan teks menjadi berkas / file dokumen',

  async run({ m, args, react }) {
    const fileName = args[0]

    if (!fileName) {
      return m.reply(
        '❌ Format salah!\n\n' +
        'Cara pakai:\n' +
        '• Reply teks → `.tofile namafile.txt`\n' +
        '• Inline teks → `.tofile namafile.txt isi teks di sini`'
      )
    }

    const extMatch = fileName.match(/\.([a-zA-Z0-9]+)$/)
    const ext = extMatch ? extMatch[1] : 'txt'
    const mime = getMime(ext)

    let content = ''
    const inlineText = args.slice(1).join(' ').trim()

    if (inlineText) {
      content = inlineText
    } else if (m.quoted) {
      content = m.quoted.text || m.quoted.body || ''
      if (!content) {
        return m.reply('❌ Pesan yang direply tidak punya teks. Hanya bisa convert pesan teks.')
      }
    } else {
      return m.reply(
        '❌ Tidak ada teks yang bisa diconvert!\n\n' +
        'Cara pakai:\n' +
        '• Reply pesan teks → `.tofile namafile.txt`\n' +
        '• Teks langsung → `.tofile namafile.txt isi teksnya`'
      )
    }

    await react('loading')
    const buf = Buffer.from(content, 'utf-8')

    await m.sendDocument(buf, fileName, {
      mimetype: mime,
      caption: `*📄 ToFile*\n\nFile: \`${fileName}\`\nSize: ${(buf.length / 1024).toFixed(2)} KB`
    })

    await react('ok')
  }
}
