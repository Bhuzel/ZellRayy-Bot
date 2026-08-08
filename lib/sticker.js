import ffmpegPath from 'ffmpeg-static'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { tmpdir } from 'os'
import path from 'path'
import fs from 'fs-extra'
import { randomBytes } from 'crypto'
import { writeExifImg, writeExifVid } from './exif.js'
import { webpToImage, webpToVideo, isAnimatedWebp } from './converter.js'

const execFileAsync = promisify(execFile)

export { webpToImage, webpToVideo, isAnimatedWebp }

function tmpFile(ext) {
  return path.join(tmpdir(), randomBytes(8).toString('hex') + '.' + ext)
}

/**
 * Convert buffer gambar -> webp (sticker statis)
 * @param {Buffer} buffer
 * @param {boolean} crop
 * @param {{ packname?: string, author?: string }} exifOpts
 */
export async function imageToWebp(buffer, crop = false, exifOpts = {}) {
  const tmpIn  = tmpFile('png')
  const tmpOut = tmpFile('webp')
  await fs.writeFile(tmpIn, buffer)

  const vf = crop
    ? 'crop=min(iw\\,ih):min(iw\\,ih),scale=512:512'
    : 'scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000'

  try {
    await execFileAsync(ffmpegPath, [
      '-y',
      '-i', tmpIn,
      '-vcodec', 'libwebp',
      '-vf', vf,
      '-lossless', '0',
      '-q:v', '75',
      tmpOut
    ])

    let out = await fs.readFile(tmpOut)
    if (exifOpts.packname || exifOpts.author) {
      out = await writeExifImg(out, exifOpts)
    }
    return out
  } finally {
    await fs.remove(tmpIn).catch(() => {})
    await fs.remove(tmpOut).catch(() => {})
  }
}

/**
 * Convert buffer video -> animated webp (sticker gerak)
 * @param {Buffer} buffer
 * @param {boolean} crop
 * @param {{ packname?: string, author?: string }} exifOpts
 */
export async function videoToWebp(buffer, crop = false, exifOpts = {}) {
  const tmpIn  = tmpFile('mp4')
  const tmpOut = tmpFile('webp')
  await fs.writeFile(tmpIn, buffer)

  const vf = crop
    ? 'crop=min(iw\\,ih):min(iw\\,ih),scale=512:512,fps=15'
    : 'scale=512:512:force_original_aspect_ratio=decrease,fps=15,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000'

  try {
    await execFileAsync(ffmpegPath, [
      '-y',
      '-i', tmpIn,
      '-vcodec', 'libwebp',
      '-vf', vf,
      '-loop', '0',
      '-ss', '00:00:00',
      '-t', '00:00:06',
      '-an',
      '-vsync', '0',
      tmpOut
    ])

    let out = await fs.readFile(tmpOut)
    if (exifOpts.packname || exifOpts.author) {
      out = await writeExifVid(out, exifOpts)
    }
    return out
  } finally {
    await fs.remove(tmpIn).catch(() => {})
    await fs.remove(tmpOut).catch(() => {})
  }
}

