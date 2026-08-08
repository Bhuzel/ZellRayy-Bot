/**
 * bannedDB.js
 * Menyimpan daftar user yang di-ban di database/banned.json.
 *
 * Data di-cache di memory → readFileSync hanya terjadi sekali saat pertama diakses,
 * bukan setiap pesan masuk.
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const DB_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../database/banned.json')

// Cache in-memory — null berarti belum pernah dimuat
let _cache = null

function load() {
  if (_cache !== null) return _cache
  try {
    const parsed = JSON.parse(readFileSync(DB_PATH, 'utf-8'))
    _cache = Array.isArray(parsed) ? parsed : []
  } catch {
    _cache = []
  }
  return _cache
}

function save(list) {
  _cache = list
  writeFileSync(DB_PATH, JSON.stringify(list, null, 2), 'utf-8')
}

/** Cek apakah nomor terban */
export function isBanned(number) {
  const clean = String(number).replace(/[^0-9]/g, '')
  return load().includes(clean)
}

/** Ban nomor, return true kalau berhasil (false kalau sudah ada) */
export function banUser(number) {
  const clean = String(number).replace(/[^0-9]/g, '')
  const list  = load()
  if (list.includes(clean)) return false
  list.push(clean)
  save(list)
  return true
}

/** Unban nomor, return true kalau berhasil (false kalau tidak ada) */
export function unbanUser(number) {
  const clean = String(number).replace(/[^0-9]/g, '')
  const list  = load()
  const idx   = list.indexOf(clean)
  if (idx === -1) return false
  list.splice(idx, 1)
  save(list)
  return true
}

/** Ambil semua nomor yang di-ban */
export function getBannedList() {
  return load()
}
