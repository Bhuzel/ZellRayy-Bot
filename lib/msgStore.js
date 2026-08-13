/**
 * lib/msgStore.js — persistent message store buat crm & getMessage() retry
 *
 * KENAPA INI ADA (biang kerok yang sempet bikin ".crm" gagal ambil cards):
 * Sebelumnya `msgStore` itu `new Map()` biasa yang dibikin DI DALAM
 * `startBot()`, terus di-assign ke `global.store`. Masalahnya `startBot()`
 * dipanggil ULANG tiap kali Baileys reconnect (`sock.ev.on('connection.update')`
 * -> `setTimeout(() => startBot(), 5000)` pas connection close & bukan
 * logged-out) — dan itu KEJADIAN LUMAYAN SERING walau device WhatsApp kamu
 * gak pernah keliatan "disconnect". Setiap reconnect = `msgStore = new Map()`
 * baru = `global.store` ke-overwrite jadi Map KOSONG = semua histori pesan
 * (termasuk carousel/card yang br dikirim) HILANG dari store walau proses
 * Node-nya sendiri gak pernah restart. Efeknya persis keluhan user: raw
 * message ilang dari store padahal belom lama, crm jatoh ke fallback
 * m.quoted yang emang udah dipotong WhatsApp buat carousel/native_flow.
 *
 * Fix: store dibikin SEKALI di module scope (bukan di dalem startBot()),
 * jadi reference-nya tetep sama persis walau startBot() dipanggil ulang
 * berkali-kali karena reconnect. Ditambah persist ke disk (debounced) biar
 * juga survive restart proses beneran (pm2 restart / crash / redeploy),
 * bukan cuma reconnect.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const STORE_FILE = path.join(__dir, '..', 'database', 'msgstore.json')
const MAX_STORE = 500
const SAVE_DEBOUNCE_MS = 1500

/** Buffer/Uint8Array -> { __b64 } pas nulis ke disk */
function bufferReplacer(_key, value) {
    if (Buffer.isBuffer(value)) return { __b64: value.toString('base64') }
    if (value instanceof Uint8Array) return { __b64: Buffer.from(value).toString('base64') }
    if (value && typeof value === 'object' && value.type === 'Buffer' && Array.isArray(value.data)) {
        return { __b64: Buffer.from(value.data).toString('base64') }
    }
    return value
}

/** { __b64 } -> Buffer pas baca dari disk */
function bufferReviver(_key, value) {
    if (value && typeof value === 'object' && typeof value.__b64 === 'string' && Object.keys(value).length === 1) {
        return Buffer.from(value.__b64, 'base64')
    }
    return value
}

function loadFromDisk(map) {
    try {
        if (!fs.existsSync(STORE_FILE)) return
        const raw = fs.readFileSync(STORE_FILE, 'utf-8')
        if (!raw.trim()) return
        const parsed = JSON.parse(raw, bufferReviver)
        if (Array.isArray(parsed)) {
            for (const [id, val] of parsed) {
                if (id) map.set(id, val)
            }
        }
        console.log(`[msgStore] loaded ${map.size} pesan dari disk (${STORE_FILE})`)
    } catch (e) {
        console.error('[msgStore] gagal load store dari disk:', e.message)
    }
}

/**
 * Bikin message store yang persist. Dipanggil SEKALI di module scope
 * (lihat index.js) — JANGAN dipanggil ulang di dalam startBot(), itu yang
 * bikin bug reset di atas.
 */
export function createMessageStore() {
    const map = new Map()
    loadFromDisk(map)

    let saveTimer = null
    const persist = () => {
        if (saveTimer) return
        saveTimer = setTimeout(() => {
            saveTimer = null
            try {
                fs.mkdirSync(path.dirname(STORE_FILE), { recursive: true })
                const entries = [...map.entries()]
                fs.writeFileSync(STORE_FILE, JSON.stringify(entries, bufferReplacer))
            } catch (e) {
                console.error('[msgStore] gagal simpan store ke disk:', e.message)
            }
        }, SAVE_DEBOUNCE_MS)
    }

    return {
        get(id) {
            return map.get(id)
        },
        set(id, val) {
            if (!id) return map
            if (!map.has(id) && map.size >= MAX_STORE) {
                const firstKey = map.keys().next().value
                map.delete(firstKey)
            }
            map.set(id, val)
            persist()
            return map
        },
        has(id) {
            return map.has(id)
        },
        delete(id) {
            const r = map.delete(id)
            persist()
            return r
        },
        get size() {
            return map.size
        }
    }
}