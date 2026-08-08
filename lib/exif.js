import { tmpdir } from 'os'
import path from 'path'
import fs from 'fs-extra'
import { randomBytes } from 'crypto'
import webp from 'node-webpmux'

function tmpFile(ext) {
  return path.join(tmpdir(), randomBytes(8).toString('hex') + '.' + ext)
}

/**
 * Sisipkan metadata packname & author ke dalam buffer WebP.
 * @param {Buffer} webpBuffer - buffer hasil convert ffmpeg (sudah jadi .webp)
 * @param {{ packname?: string, author?: string }} metadata
 * @returns {Promise<Buffer>} buffer webp dengan EXIF embedded
 */
export async function addExif(webpBuffer, metadata = {}) {
  const packname = metadata.packname || ''
  const author   = metadata.author   || ''

  // JSON yang dibaca WhatsApp sebagai info sticker pack
  const json = {
    'sticker-pack-id': `com.stickerpkg.${packname.replace(/\s+/g, '').toLowerCase() || 'bot'}`,
    'sticker-pack-name': packname,
    'sticker-pack-publisher': author,
    emojis: metadata.categories || ['']
  }

  // EXIF attribute header (format baku yang dipakai WA)
  const exifAttr = Buffer.from([
    0x49, 0x49, 0x2a, 0x00,
    0x08, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x41, 0x57,
    0x07, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x16, 0x00,
    0x00, 0x00,
  ])

  const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8')
  const exif = Buffer.concat([exifAttr, jsonBuff])
  exif.writeUIntLE(jsonBuff.length, 14, 4) // tulis panjang json di offset 14

  // Simpan webp sementara ke disk agar bisa di-load node-webpmux
  const tmpIn  = tmpFile('webp')
  const tmpOut = tmpFile('webp')

  await fs.writeFile(tmpIn, webpBuffer)

  const img = new webp.Image()
  await img.load(tmpIn)
  await fs.remove(tmpIn).catch(() => {})

  img.exif = exif
  await img.save(tmpOut)

  const result = await fs.readFile(tmpOut)
  await fs.remove(tmpOut).catch(() => {})

  return result
}

/**
 * Embed EXIF ke webp dari buffer gambar (sudah dikonversi ke webp).
 * @param {Buffer} webpBuffer
 * @param {{ packname?: string, author?: string }} metadata
 * @returns {Promise<Buffer>}
 */
export async function writeExifImg(webpBuffer, metadata) {
  return addExif(webpBuffer, metadata)
}

/**
 * Embed EXIF ke webp dari buffer video (sudah dikonversi ke webp).
 * @param {Buffer} webpBuffer
 * @param {{ packname?: string, author?: string }} metadata
 * @returns {Promise<Buffer>}
 */
export async function writeExifVid(webpBuffer, metadata) {
  return addExif(webpBuffer, metadata)
}
