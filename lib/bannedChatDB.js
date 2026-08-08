/**
 * bannedChatDB.js
 * Menyimpan daftar chat/grup (JID) yang di-ban di database/bannedChats.json.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const DB_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../database/bannedChats.json')

let _cache = null

function load() {
  if (_cache !== null) return _cache
  try {
    if (!existsSync(DB_PATH)) {
      writeFileSync(DB_PATH, '[]', 'utf-8')
    }
    const parsed = JSON.parse(readFileSync(DB_PATH, 'utf-8'))
    _cache = Array.isArray(parsed) ? parsed : []
  } catch {
    _cache = []
  }
  return _cache
}

function save(list) {
  _cache = list
  try {
    writeFileSync(DB_PATH, JSON.stringify(list, null, 2), 'utf-8')
  } catch (e) {
    console.error('[bannedChatDB] Error saving:', e)
  }
}

/** Cek apakah chat/grup di-ban */
export function isBannedChat(chatJid) {
  if (!chatJid) return false
  return load().includes(chatJid.trim())
}

/** Ban chat/grup JID */
export function banChat(chatJid) {
  if (!chatJid) return false
  const clean = chatJid.trim()
  const list = load()
  if (list.includes(clean)) return false
  list.push(clean)
  save(list)
  return true
}

/** Unban chat/grup JID */
export function unbanChat(chatJid) {
  if (!chatJid) return false
  const clean = chatJid.trim()
  const list = load()
  const idx = list.indexOf(clean)
  if (idx === -1) return false
  list.splice(idx, 1)
  save(list)
  return true
}

/** Ambil seluruh daftar chat/grup yang di-ban */
export function getBannedChats() {
  return [...load()]
}
