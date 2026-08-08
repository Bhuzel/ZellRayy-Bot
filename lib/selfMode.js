import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const DB_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../database/access-self.json')

let _cache = null

function loadDB() {
  if (_cache !== null) return _cache
  try {
    const raw = readFileSync(DB_PATH, 'utf-8')
    const parsed = JSON.parse(raw)
    _cache = {
      active: typeof parsed.active === 'boolean' ? parsed.active : false,
      whitelist: Array.isArray(parsed.whitelist) ? parsed.whitelist : []
    }
  } catch {
    _cache = { active: false, whitelist: [] }
  }
  return _cache
}

function saveDB(db) {
  _cache = db
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8')
}

export function isSelfActive() {
  return loadDB().active
}

export function setSelf(state) {
  const db = loadDB()
  db.active = state
  saveDB(db)
}

export const getSelfMode = isSelfActive
export const setSelfMode = setSelf

export function getWhitelist() {
  return loadDB().whitelist
}

export function addWhitelist(number) {
  const normalized = number.replace(/[^0-9]/g, '')
  const db = loadDB()
  if (db.whitelist.includes(normalized)) return false
  db.whitelist.push(normalized)
  saveDB(db)
  return true
}

export function removeWhitelist(number) {
  const normalized = number.replace(/[^0-9]/g, '')
  const db = loadDB()
  const idx = db.whitelist.indexOf(normalized)
  if (idx === -1) return false
  db.whitelist.splice(idx, 1)
  saveDB(db)
  return true
}

export function isAllowedInSelfMode({ senderNumber, senderAltNumber, isOwner, fromMe }) {
  const db = loadDB()
  if (!db.active) return true
  if (fromMe) return true
  if (isOwner) return true
  if (db.whitelist.includes(senderNumber)) return true
  if (senderAltNumber && db.whitelist.includes(senderAltNumber)) return true
  return false
}
