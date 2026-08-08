/**
 * premiumDB.js
 * Menyimpan daftar user premium secara permanen di database/premium.json.
 *
 * Data di-cache di memory → readFileSync hanya terjadi sekali saat pertama diakses.
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const DB_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../database/premium.json')

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

export function getExtraPremium() {
  return load()
}

export function addPremium(number) {
  const normalized = number.replace(/[^0-9]/g, '')
  const list = load()
  if (list.includes(normalized)) return false
  list.push(normalized)
  save(list)
  return true
}

export function removePremium(number) {
  const normalized = number.replace(/[^0-9]/g, '')
  const list = load()
  const idx = list.indexOf(normalized)
  if (idx === -1) return false
  list.splice(idx, 1)
  save(list)
  return true
}
