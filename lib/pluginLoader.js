import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
import chokidar from 'chokidar'

const pluginsDir = path.join(process.cwd(), 'plugins')

// command (string) -> plugin object
export const plugins = new Map()
// path file relatif (misal "owner/eval.js") -> daftar command yang didaftarkan file itu (buat cleanup saat reload)
const fileCommandMap = new Map()

/**
 * Baca semua file .js di dalam plugins/ secara rekursif (termasuk sub-folder
 * seperti plugins/owner/, plugins/tools/, dll). Return path relatif terhadap pluginsDir.
 */
function listPluginFiles(dir = pluginsDir) {
  let result = []
  if (!fs.existsSync(dir)) return result
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      result = result.concat(listPluginFiles(full))
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      result.push(path.relative(pluginsDir, full))
    }
  }
  return result
}

function unregisterFile(relFile) {
  const oldCommands = fileCommandMap.get(relFile) || []
  for (const cmd of oldCommands) plugins.delete(cmd)
  fileCommandMap.delete(relFile)
}

async function loadPlugin(relFile) {
  try {
    unregisterFile(relFile)
    const filePath = path.join(pluginsDir, relFile)
    const url = pathToFileURL(filePath).href + '?update=' + Date.now()
    const mod = await import(url)
    const plugin = mod.default
    if (!plugin || !plugin.command || !plugin.command.length) return

    // default settings biar plugin lama (tanpa settings) tetap jalan seperti biasa
    plugin.settings = {
      owner: false,
      private: true,
      group: true,
      admin: false,
      botAdmin: false,
      premium: false,
      ...(plugin.settings || {})
    }

    const registered = []
    for (const cmd of plugin.command) {
      const key = cmd.toLowerCase()
      plugins.set(key, plugin)
      registered.push(key)
    }
    fileCommandMap.set(relFile, registered)
    // Invalidasi cache symbol command di index.js
    if (typeof plugins._onUpdate === 'function') plugins._onUpdate()
  } catch (e) {
    console.error(`[PLUGIN] gagal load ${relFile}:`, e.message)
  }
}

export async function loadAllPlugins() {
  if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir, { recursive: true })
  const files = listPluginFiles()
  await Promise.all(files.map(file => loadPlugin(file)))
}

export function watchPlugins() {
  // chokidar otomatis rekursif ke sub-folder secara default
  chokidar.watch(pluginsDir, { ignoreInitial: true }).on('all', async (event, filePath) => {
    if (!filePath.endsWith('.js')) return
    const relFile = path.relative(pluginsDir, filePath)

    if (event === 'unlink') {
      unregisterFile(relFile)
      console.log(`[PLUGIN] dihapus: ${relFile}`)
      return
    }
    if (event === 'add' || event === 'change') {
      console.log(`[PLUGIN] reload: ${relFile}`)
      await loadPlugin(relFile)
    }
  })
}