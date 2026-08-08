import ffmpegPath from 'ffmpeg-static'
import { execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs-extra'
import path from 'path'
import { tmpdir } from 'os'
import { randomBytes } from 'crypto'
import webpmux from 'node-webpmux'
import axios from 'axios'
import FormData from 'form-data'

const execFileAsync = promisify(execFile)

function tmpFile(ext) {
  return path.join(tmpdir(), `${randomBytes(8).toString('hex')}.${ext}`)
}

function tmpDir() {
  const dir = path.join(tmpdir(), randomBytes(8).toString('hex'))
  fs.mkdirpSync(dir)
  return dir
}

/**
 * Deteksi ekstensi file berdasarkan magic bytes buffer & hint mimetype/filename
 * @param {Buffer} buffer
 * @param {string} [hint='']
 * @returns {string}
 */
export function detectExt(buffer, hint = '') {
  if (hint && typeof hint === 'string') {
    const cleanHint = hint.toLowerCase().split(';')[0].replace(/[^a-z0-9]/g, '')
    if (cleanHint.includes('mp3') || cleanHint.includes('mpeg')) return 'mp3'
    if (cleanHint.includes('ogg') || cleanHint.includes('opus')) return 'ogg'
    if (cleanHint.includes('wav')) return 'wav'
    if (cleanHint.includes('m4a') || cleanHint.includes('aac')) return 'm4a'
    if (cleanHint.includes('mp4') || cleanHint.includes('video')) return 'mp4'
    if (cleanHint.includes('webp')) return 'webp'
  }
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 4) return 'mp3'

  // Magic bytes check
  if (buffer.slice(0, 3).toString('ascii') === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)) {
    return 'mp3'
  }
  if (buffer.slice(0, 4).toString('ascii') === 'OggS') {
    return 'ogg'
  }
  if (buffer.slice(0, 4).toString('ascii') === 'RIFF') {
    const type = buffer.slice(8, 12).toString('ascii')
    if (type === 'WEBP') return 'webp'
    if (type === 'WAVE') return 'wav'
    return 'wav'
  }
  if (buffer.slice(4, 8).toString('ascii') === 'ftyp') {
    return 'mp4'
  }
  return 'mp3'
}

/**
 * Memeriksa apakah stiker WebP bergerak (animasi)
 * @param {Buffer} buffer
 * @returns {Promise<boolean>}
 */
export async function isAnimatedWebp(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) return false
  try {
    const img = new webpmux.Image()
    await img.load(buffer)
    return !!img.hasAnim
  } catch (e) {
    return buffer.includes(Buffer.from('ANIM'))
  }
}

/**
 * Convert WebP (statis/gerak) -> PNG Image Buffer
 * @param {Buffer} buffer
 * @returns {Promise<Buffer>}
 */
export async function webpToImage(buffer) {
  const tmpIn = tmpFile('webp')
  const tmpOut = tmpFile('png')
  await fs.writeFile(tmpIn, buffer)

  try {
    await execFileAsync(ffmpegPath, [
      '-y',
      '-i', tmpIn,
      '-vframes', '1',
      tmpOut
    ])
    return await fs.readFile(tmpOut)
  } finally {
    await fs.remove(tmpIn).catch(() => {})
    await fs.remove(tmpOut).catch(() => {})
  }
}

/**
 * Convert Animated WebP (stiker gerak) -> MP4 Video Buffer
 * Menggunakan demuxer lokal node-webpmux dengan img.demux({ buffers: true })
 * dan fallback EzGif API dengan browser headers
 * @param {Buffer} buffer
 * @returns {Promise<Buffer>}
 */
export async function webpToVideo(buffer) {
  try {
    const img = new webpmux.Image()
    await img.load(buffer)

    if (!img.hasAnim) {
      const tmpIn = tmpFile('webp')
      const tmpOut = tmpFile('mp4')
      await fs.writeFile(tmpIn, buffer)
      try {
        await execFileAsync(ffmpegPath, [
          '-y',
          '-loop', '1',
          '-i', tmpIn,
          '-c:v', 'libx264',
          '-t', '3',
          '-pix_fmt', 'yuv420p',
          '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
          tmpOut
        ])
        return await fs.readFile(tmpOut)
      } finally {
        await fs.remove(tmpIn).catch(() => {})
        await fs.remove(tmpOut).catch(() => {})
      }
    }

    const workDir = tmpDir()
    const mp4Path = path.join(workDir, 'output.mp4')

    try {
      const frameBuffers = await img.demux({ buffers: true })
      if (!frameBuffers || frameBuffers.length === 0) {
        throw new Error('Tidak ada frame yang dapat diekstrak dari stiker WebP')
      }

      for (let i = 0; i < frameBuffers.length; i++) {
        const frameWebp = path.join(workDir, `frame_${String(i).padStart(4, '0')}.webp`)
        const framePng = path.join(workDir, `frame_${String(i).padStart(4, '0')}.png`)
        await fs.writeFile(frameWebp, frameBuffers[i])
        await execFileAsync(ffmpegPath, ['-y', '-i', frameWebp, '-vframes', '1', framePng])
      }

      const anim = img.anim
      const delay = (anim && anim.delay) ? anim.delay : 100
      const fps = Math.max(1, Math.min(60, Math.round(1000 / delay)))

      await execFileAsync(ffmpegPath, [
        '-y',
        '-framerate', String(fps),
        '-i', path.join(workDir, 'frame_%04d.png'),
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        '-movflags', '+faststart',
        mp4Path
      ])

      return await fs.readFile(mp4Path)
    } finally {
      await fs.remove(workDir).catch(() => {})
    }
  } catch (localErr) {
    return await webp2mp4Ezgif(buffer)
  }
}

/**
 * Fallback WebP to MP4 via EzGif dengan browser User-Agent
 */
async function webp2mp4Ezgif(buffer) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
  }

  const form = new FormData()
  form.append('new-image', buffer, { filename: 'sticker.webp', contentType: 'image/webp' })
  form.append('new-image-url', '')

  const res1 = await axios.post('https://ezgif.com/webp-to-mp4', form, {
    headers: { ...headers, ...form.getHeaders() },
    timeout: 20000
  })

  const html1 = res1.data
  const fileMatch = html1.match(/name="file"\s+value="([^"]+)"/)
  if (!fileMatch) throw new Error('Gagal memproses stiker pada ezgif (stage 1)')

  const fileId = fileMatch[1]
  const form2 = new URLSearchParams()
  form2.append('file', fileId)
  form2.append('convert', 'Convert WebP to MP4!')

  const res2 = await axios.post(`https://ezgif.com/webp-to-mp4/${fileId}`, form2.toString(), {
    headers: {
      ...headers,
      'content-type': 'application/x-www-form-urlencoded'
    },
    timeout: 20000
  })

  const html2 = res2.data
  const srcMatch = html2.match(/<video[^>]+src="([^"]+)"/) || html2.match(/<source[^>]+src="([^"]+)"/)
  if (!srcMatch) throw new Error('Gagal konversi stiker ke video pada ezgif (stage 2)')

  let videoUrl = srcMatch[1]
  if (videoUrl.startsWith('//')) videoUrl = 'https:' + videoUrl
  else if (videoUrl.startsWith('/')) videoUrl = 'https://ezgif.com' + videoUrl

  const videoRes = await axios.get(videoUrl, { headers, responseType: 'arraybuffer', timeout: 20000 })
  return Buffer.from(videoRes.data)
}

/**
 * Convert media apapun (video, audio, vn, mp3, doc) -> MP3 Audio Buffer
 * @param {Buffer} buffer
 * @param {string} [hintExt='']
 * @returns {Promise<Buffer>}
 */
export async function toMp3(buffer, hintExt = '') {
  const ext = detectExt(buffer, hintExt)
  const tmpIn = tmpFile(ext)
  const tmpOut = tmpFile('mp3')
  await fs.writeFile(tmpIn, buffer)

  try {
    await execFileAsync(ffmpegPath, [
      '-y',
      '-i', tmpIn,
      '-vn',
      '-map', '0:a:0?',
      '-acodec', 'libmp3lame',
      '-b:a', '192k',
      tmpOut
    ])
    return await fs.readFile(tmpOut)
  } finally {
    await fs.remove(tmpIn).catch(() => {})
    await fs.remove(tmpOut).catch(() => {})
  }
}

/**
 * Parse durasi detik dari stderr output FFmpeg
 * @param {string} stderr
 * @returns {number}
 */
export function parseDurationFromFFmpeg(stderr = '') {
  if (!stderr) return 0
  const match = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/)
  if (match) {
    const hours = parseFloat(match[1])
    const minutes = parseFloat(match[2])
    const seconds = parseFloat(match[3])
    return Math.max(1, Math.round(hours * 3600 + minutes * 60 + seconds))
  }
  return 0
}

/**
 * Hasilkan data gelombang suara (waveform bars) untuk Voice Note WhatsApp
 * @param {Buffer} buffer
 * @param {number} [points=64]
 * @returns {Uint8Array}
 */
export function generateWaveform(buffer, points = 64) {
  const waveform = new Uint8Array(points)
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    for (let i = 0; i < points; i++) waveform[i] = Math.floor(Math.random() * 40) + 10
    return waveform
  }
  const step = Math.floor(buffer.length / points) || 1
  for (let i = 0; i < points; i++) {
    const sample = buffer[i * step] || 0
    const peak = Math.floor((sample / 255) * 75) + 15
    waveform[i] = Math.min(100, Math.max(5, peak))
  }
  return waveform
}

/**
 * Deteksi durasi audio file menggunakan FFmpeg
 * @param {string} filePath
 * @returns {Promise<number>}
 */
export async function getAudioDuration(filePath) {
  try {
    const { stderr } = await execFileAsync(ffmpegPath, ['-i', filePath])
    return parseDurationFromFFmpeg(stderr)
  } catch (e) {
    return parseDurationFromFFmpeg(e.stderr || '')
  }
}

/**
 * Convert media apapun (video, mp3, audio, vn, doc) -> OGG Opus Voice Note (PTT) Object { buffer, seconds, waveform }
 * @param {Buffer} buffer
 * @param {string} [hintExt='']
 * @returns {Promise<{ buffer: Buffer, seconds: number, waveform: Uint8Array }>}
 */
export async function toVn(buffer, hintExt = '') {
  const ext = detectExt(buffer, hintExt)
  const tmpIn = tmpFile(ext)
  const tmpOut = tmpFile('ogg')
  await fs.writeFile(tmpIn, buffer)

  let seconds = 0
  try {
    try {
      const { stderr } = await execFileAsync(ffmpegPath, [
        '-y',
        '-ss', '0',
        '-i', tmpIn,
        '-vn',
        '-map_metadata', '-1',
        '-af', 'asetpts=PTS-STARTPTS',
        '-c:a', 'libopus',
        '-b:a', '64k',
        '-vbr', 'on',
        '-compression_level', '10',
        '-ar', '48000',
        '-ac', '1',
        '-application', 'voip',
        '-avoid_negative_ts', 'make_zero',
        '-f', 'ogg',
        tmpOut
      ])
      seconds = parseDurationFromFFmpeg(stderr)
    } catch (e1) {
      const { stderr } = await execFileAsync(ffmpegPath, [
        '-y',
        '-i', tmpIn,
        '-vn',
        '-map_metadata', '-1',
        '-c:a', 'libopus',
        '-b:a', '64k',
        '-ar', '48000',
        '-ac', '1',
        '-f', 'ogg',
        tmpOut
      ]).catch(() => ({ stderr: '' }))
      seconds = parseDurationFromFFmpeg(stderr)
    }

    const vnBuf = await fs.readFile(tmpOut)
    if (!seconds || seconds <= 0) {
      seconds = await getAudioDuration(tmpOut)
    }
    if (!seconds || seconds <= 0) seconds = 15

    const waveform = generateWaveform(vnBuf, 64)
    return { buffer: vnBuf, seconds, waveform }
  } finally {
    await fs.remove(tmpIn).catch(() => {})
    await fs.remove(tmpOut).catch(() => {})
  }
}
