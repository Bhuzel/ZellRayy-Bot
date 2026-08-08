/**
 * ownerDB.js
 * Menyimpan daftar owner tambahan (di luar config.ownerNumber) secara permanen
 * di database/owners.json.
 *
 * Data di-cache di memory → readFileSync hanya terjadi sekali saat pertama diakses,
 * bukan setiap pesan masuk.
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const DB_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../database/owners.json')

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

export function getExtraOwners() {
  return load()
}

export function addOwner(number) {
  const normalized = number.replace(/[^0-9]/g, '')
  const list = load()
  if (list.includes(normalized)) return false
  list.push(normalized)
  save(list)
  return true
}

export function removeOwner(number) {
  const normalized = number.replace(/[^0-9]/g, '')
  const list = load()
  const idx = list.indexOf(normalized)
  if (idx === -1) return false
  list.splice(idx, 1)
  save(list)
  return true
}
