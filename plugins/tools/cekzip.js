import AdmZip from 'adm-zip'
import fetchBuffer from '../../lib/fetchBuffer.js'
import { extractUrl } from '../../lib/helper.js'

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Membangun struktur tree hirarki dari daftar entri AdmZip
 */
function buildZipTree(entries) {
  const root = { name: '', isDir: true, children: {} }

  for (const entry of entries) {
    let pathStr = entry.entryName.replace(/\\/g, '/')
    if (pathStr.endsWith('/')) {
      pathStr = pathStr.slice(0, -1)
    }
    if (!pathStr) continue

    const parts = pathStr.split('/')
    let current = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isLast = i === parts.length - 1

      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          isDir: !isLast || entry.isDirectory,
          children: {}
        }
      }

      const node = current.children[part]
      if (isLast && !entry.isDirectory) {
        node.isDir = false
      } else {
        node.isDir = true
      }

      current = node
    }
  }

  return root
}

/**
 * Merender hirarki tree menjadi teks visual polos tanpa emoji dan tanpa ukuran file
 */
function renderZipTree(node, prefix = '', isLast = true, isRoot = true) {
  let lines = []

  if (!isRoot) {
    const connector = isLast ? '└── ' : '├── '
    const displayName = node.isDir ? `${node.name}/` : node.name

    lines.push(`${prefix}${connector}${displayName}`)
  }

  if (node.isDir && node.children) {
    const keys = Object.keys(node.children).sort((a, b) => {
      const aIsDir = node.children[a].isDir
      const bIsDir = node.children[b].isDir
      if (aIsDir && !bIsDir) return -1
      if (!aIsDir && bIsDir) return 1
      return a.localeCompare(b)
    })

    const childPrefix = isRoot ? '' : prefix + (isLast ? '    ' : '│   ')

    keys.forEach((key, index) => {
      const childLast = index === keys.length - 1
      lines.push(...renderZipTree(node.children[key], childPrefix, childLast, false))
    })
  }

  return lines
}

export default {
  name: 'Cek Isi Zip',
  command: ['cekzip', 'inspectzip', 'unziplist'],
  category: 'tools',
  description: 'Inspeksi & tampilkan struktur berkas pohon (tree) bersarang penuh dari file .zip',

  async run({ m, args, react }) {
    let zipBuf = null
    const url = extractUrl(args, m)

    if (m.quoted && m.quoted.mtype === 'documentMessage') {
      await react('loading')
      zipBuf = await m.quoted.download()
    } else if (url) {
      await react('loading')
      try {
        zipBuf = await fetchBuffer(url)
      } catch (e) {
        return m.reply(`[CekZip Error] Gagal mengunduh file ZIP dari URL: ${e.message}`)
      }
    } else if (m.mtype === 'documentMessage') {
      await react('loading')
      zipBuf = await m.download()
    } else {
      return m.reply('Reply file .zip dokumen atau kirim link URL zip dengan command .cekzip')
    }

    if (!zipBuf || zipBuf.length === 0) {
      return m.reply('[CekZip Error] Buffer file ZIP kosong atau gagal diunduh.')
    }

    try {
      const zip = new AdmZip(zipBuf)
      const entries = zip.getEntries()

      if (!entries || entries.length === 0) {
        return m.reply('[CekZip] Archive ZIP ini kosong.')
      }

      let totalSize = 0
      let totalCompressedSize = 0
      let fileCount = 0
      let dirCount = 0

      entries.forEach((entry) => {
        if (entry.isDirectory) {
          dirCount++
        } else {
          fileCount++
          totalSize += entry.header.size
          totalCompressedSize += entry.header.compressedSize
        }
      })

      const tree = buildZipTree(entries)
      const rawLines = renderZipTree(tree)

      const ratio = totalSize > 0 ? (((totalSize - totalCompressedSize) / totalSize) * 100).toFixed(1) : '0'

      let treeOutput = `📦 *[ ZIP Archive Inspector ]*\n\n`
      treeOutput += rawLines.join('\n')

      treeOutput += `\n\n📊 *[ Ringkasan Archive ]*\n`
      treeOutput += `Total Berkas   : ${fileCount} file\n`
      treeOutput += `Total Folder   : ${dirCount} folder\n`
      treeOutput += `Ukuran Asli    : ${formatBytes(totalSize)}\n`
      treeOutput += `Ukuran Kompresi: ${formatBytes(totalCompressedSize)}\n`
      treeOutput += `Rasio Hemat    : ${ratio}%`

      await m.reply(treeOutput)
      await react('ok')
    } catch (e) {
      await react('error')
      await m.reply(`[CekZip Error] ${e.message}`)
    }
  }
}
