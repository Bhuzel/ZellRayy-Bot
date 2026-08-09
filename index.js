import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  Browsers,
  getContentType
} from '@whiskeysockets/baileys'
import pino from 'pino'
import readline from 'readline'
import chalk from 'chalk'
import qrcode from 'qrcode-terminal'
import os from 'os'
import config from './config.js'
import { serialize } from './lib/serialize.js'
import { plugins, loadAllPlugins, watchPlugins } from './lib/pluginLoader.js'
import { isAllowedInSelfMode } from './lib/selfMode.js'
import { getExtraOwners } from './lib/ownerDB.js'
import { isBanned } from './lib/bannedDB.js'
import { isBannedChat } from './lib/bannedChatDB.js'
import { getExtraPremium } from './lib/premiumDB.js'
import { attachWrapper } from './lib/wrapper.js'
import util from 'util'

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

const NOISE_PATTERNS = [
  'Closing open session',
  'Closing session',
  'SessionEntry',
  '_chains',
  'registrationId',
  'currentRatchet',
  'pendingPreKey',
  'remoteIdentityKey',
  'indexInfo',
  'ephemeralKeyPair',
  'Failed to decrypt message',
  'Session error',
  'Over 2000 messages into the future',
  'Bad MAC',
  'fillMessageKeys',
  'maybeStepRatchet',
  'decryptWithSessions',
  'doDecryptWhisperMessage',
  'prekey bundle',
]

const _isNoise = (...args) => {
  const formatted = util.format(...args)
  return NOISE_PATTERNS.some(p => formatted.includes(p))
}

const _originalLog = console.log
const _originalError = console.error
const _originalWarn = console.warn
const _originalInfo = console.info
const _originalDebug = console.debug

console.log = (...args) => { if (_isNoise(...args)) return; _originalLog(...args) }
console.error = (...args) => { if (_isNoise(...args)) return; _originalError(...args) }
console.warn = (...args) => { if (_isNoise(...args)) return; _originalWarn(...args) }
console.info = (...args) => { if (_isNoise(...args)) return; _originalInfo(...args) }
console.debug = (...args) => { if (_isNoise(...args)) return; _originalDebug(...args) }

const _origStdoutWrite = process.stdout.write.bind(process.stdout)
const _origStderrWrite = process.stderr.write.bind(process.stderr)

process.stdout.write = function (chunk, encoding, callback) {
  const str = typeof chunk === 'string' ? chunk : (Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk))
  if (NOISE_PATTERNS.some(p => str.includes(p))) {
    if (typeof callback === 'function') callback()
    return true
  }
  return _origStdoutWrite(chunk, encoding, callback)
}

process.stderr.write = function (chunk, encoding, callback) {
  const str = typeof chunk === 'string' ? chunk : (Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk))
  if (NOISE_PATTERNS.some(p => str.includes(p))) {
    if (typeof callback === 'function') callback()
    return true
  }
  return _origStderrWrite(chunk, encoding, callback)
}

/**
 * Cetak kode pairing 8 karakter dalam format kotak ASCII besar & mudah dibaca
 */
function printBigPairingCode(code) {
  const cleanCode = code.toUpperCase().replace(/\s+/g, '')
  const rawChars = cleanCode.includes('-') ? cleanCode : (cleanCode.slice(0, 4) + '-' + cleanCode.slice(4))
  const chars = rawChars.split('')

  let topRow = ''
  let midRow = ''
  let botRow = ''

  for (const ch of chars) {
    if (ch === '-') {
      topRow += '     '
      midRow += '  -  '
      botRow += '     '
    } else {
      topRow += '┌───┐ '
      midRow += `│ ${ch} │ `
      botRow += '└───┘ '
    }
  }

  topRow = topRow.trimEnd()
  midRow = midRow.trimEnd()
  botRow = botRow.trimEnd()

  const boxWidth = 62
  const padLeft = (str) => {
    const space = Math.max(0, Math.floor((boxWidth - str.length) / 2))
    return ' '.repeat(space) + str
  }

  console.log('')
  console.log(chalk.cyan.bold(' ╭' + '─'.repeat(boxWidth) + '╮'))
  console.log(chalk.cyan.bold(' │' + padLeft('KODE PAIRING WHATSAPP KAMU').padEnd(boxWidth) + '│'))
  console.log(chalk.cyan.bold(' ├' + '─'.repeat(boxWidth) + '┤'))
  console.log(chalk.cyan(' │' + ' '.repeat(boxWidth) + '│'))
  console.log(chalk.green.bold(' │' + padLeft(topRow).padEnd(boxWidth) + '│'))
  console.log(chalk.green.bold(' │' + padLeft(midRow).padEnd(boxWidth) + '│'))
  console.log(chalk.green.bold(' │' + padLeft(botRow).padEnd(boxWidth) + '│'))
  console.log(chalk.cyan(' │' + ' '.repeat(boxWidth) + '│'))
  console.log(chalk.cyan.bold(' ╰' + '─'.repeat(boxWidth) + '╯'))
  console.log(chalk.cyan('\n 📌 Buka WhatsApp > Perangkat Tertaut > Tautkan dengan Nomor Telepon.'))
  console.log(chalk.gray('    Masukkan 8 karakter kode besar di atas ke dalam WhatsApp HP kamu.\n'))
}

/**
 * Cetak Banner Pembukaan Bot di Terminal
 */
function printHeader() {
  console.clear()
  const banner = `
   ███████╗███████╗██╗     ██╗     ██████╗  █████╗ ██╗   ██╗
   ╚══███╔╝██╔════╝██║     ██║     ██╔══██╗██╔══██╗╚██╗ ██╔╝
     ███╔╝ █████╗  ██║     ██║     ██████╔╝███████║ ╚████╔╝ 
    ███╔╝  ██╔══╝  ██║     ██║     ██╔══██╗██╔══██║  ╚██╔╝  
   ███████╗███████╗███████╗███████╗██║  ██║██║  ██║   ██║   
   ╚══════╝╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   `

  console.log(chalk.cyan(banner))
  console.log(chalk.gray('               WhatsApp Multi-Device Bot v1.0.0\n'))

  const totalPlugins = new Set(plugins.values()).size
  const prefixes = Array.isArray(config.prefix) ? config.prefix.join(' ') : config.prefix

  console.log(chalk.cyan(' ╭─────────────────────────────────────────────────────────────╮'))
  console.log(chalk.cyan(` │  • Node.js  : ${chalk.green(process.version.padEnd(16))} • Bot    : ${chalk.green(config.botName.padEnd(16))}  │`))
  console.log(chalk.cyan(` │  • Platform : ${chalk.green(os.platform().padEnd(16))} • Author : ${chalk.green('ZellRayy'.padEnd(16))}  │`))
  console.log(chalk.cyan(` │  • Plugins  : ${chalk.green((totalPlugins + ' Loaded').padEnd(16))} • Prefix : ${chalk.green(('[ ' + (config.usePrefix === false ? 'No-Prefix' : prefixes) + ' ]').padEnd(16))}  │`))
  console.log(chalk.cyan(' ╰─────────────────────────────────────────────────────────────╯\n'))
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionName)
  const { version } = await fetchLatestBaileysVersion()

  const msgStore = new Map()
  const MAX_STORE = 500
  const groupCache = new Map()

  const getGroupMetadata = async (chatJid, forceRefresh = false) => {
    if (!chatJid || !chatJid.endsWith('@g.us')) return null
    if (!forceRefresh && groupCache.has(chatJid)) {
      return groupCache.get(chatJid)
    }
    try {
      const metadata = await sock.groupMetadata(chatJid)
      if (metadata) {
        groupCache.set(chatJid, metadata)
      }
      return metadata
    } catch (e) {
      return groupCache.get(chatJid) || null
    }
  }

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: Browsers.macOS('Safari'),
    getMessage: async (key) => {
      const stored = msgStore.get(key.id)
      if (stored?.message) return stored.message
      return undefined
    }
  })

  attachWrapper(sock)

  if (!sock.authState.creds.registered) {
    if (config.pairingMode) {
      let phoneNumber = await question(chalk.cyan(' 📱 Masukkan nomor WhatsApp bot (contoh: 628xxxxxxxxxx): '))
      phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

      if (!phoneNumber) {
        console.log(chalk.red('\n ❌ Nomor tidak boleh kosong. Jalankan ulang bot.'))
        process.exit(1)
      }

      try {
        const code = await sock.requestPairingCode(phoneNumber)
        printBigPairingCode(code)
      } catch (e) {
        console.error(chalk.red('\n ❌ Gagal meminta kode pairing:'), e.message)
      }
    } else {
      console.log(chalk.cyan('\n Mode QR Code aktif. Scan QR di bawah melalui WhatsApp > Perangkat Tertaut.\n'))
    }
  }

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (!config.pairingMode && qr) {
      console.clear()
      console.log(chalk.cyan('━'.repeat(50)))
      console.log(chalk.cyan.bold('  Scan QR Code ini dengan WhatsApp kamu'))
      console.log(chalk.cyan('━'.repeat(50)))
      qrcode.generate(qr, { small: true })
      console.log(chalk.gray('\n (QR otomatis refresh jika expired)\n'))
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode
      if (statusCode !== DisconnectReason.loggedOut) {
        console.log(chalk.cyan(' 🔄 Koneksi terputus, mencoba terhubung kembali dalam 5 detik...'))
        setTimeout(() => startBot(), 5000)
      } else {
        console.log(chalk.red(' ❌ Sesi logout. Hapus folder session lalu jalankan ulang bot.'))
      }
    } else if (connection === 'open') {
      rl.close()
      console.log(chalk.green.bold(` [SUCCESS] ${config.botName} berhasil terhubung ke WhatsApp.`))

      try {
        const groups = await sock.groupFetchAllParticipating()
        for (const [id, metadata] of Object.entries(groups)) {
          groupCache.set(id, metadata)
        }
      } catch (e) {
        // Silent group cache load
      }
    }
  })

  sock.ev.on('groups.update', async (updates) => {
    for (const update of updates) {
      if (groupCache.has(update.id)) {
        const cached = groupCache.get(update.id)
        groupCache.set(update.id, { ...cached, ...update })
      }
    }
  })

  sock.ev.on('group-participants.update', async ({ id }) => {
    try {
      groupCache.delete(id)
      await getGroupMetadata(id, true)
    } catch (e) {
      // Ignore update error
    }
  })

  let _symbolCommands = null
  const getSymbolCommands = () => {
    if (_symbolCommands) return _symbolCommands
    _symbolCommands = [...plugins.keys()]
      .filter(cmd => /^[^a-zA-Z0-9]+$/.test(cmd))
      .sort((a, b) => b.length - a.length)
    return _symbolCommands
  }
  plugins._onUpdate = () => { _symbolCommands = null }

  const processMsg = async (rawMsg) => {
    try {
      if (!rawMsg?.message) return
      if (rawMsg.key.remoteJid === 'status@broadcast') return

      if (msgStore.size >= MAX_STORE) {
        const firstKey = msgStore.keys().next().value
        msgStore.delete(firstKey)
      }
      msgStore.set(rawMsg.key.id, rawMsg)

      const m = serialize(rawMsg, sock, config)
      const body = m.body || ''

      const prefixes = Array.isArray(config.prefix) ? config.prefix : [config.prefix]

      let usedPrefix = ''
      let command = ''
      let args = []

      const bodyTrimmed = body.trim()
      if (!bodyTrimmed) return

      const foundPrefix = prefixes.find((p) => bodyTrimmed.startsWith(p)) || ''

      if (foundPrefix) {
        usedPrefix = foundPrefix
        const [cmd, ...rest] = bodyTrimmed.slice(foundPrefix.length).trim().split(/\s+/)
        command = cmd?.toLowerCase()
        args = rest
      } else {
        if (config.usePrefix === true) {
          let symbolMatch = null
          for (const cmd of getSymbolCommands()) {
            if (bodyTrimmed === cmd || bodyTrimmed.startsWith(cmd + ' ') || bodyTrimmed.startsWith(cmd + '\n')) {
              symbolMatch = { cmd, rest: bodyTrimmed.slice(cmd.length).trim() }
              break
            }
          }

          if (symbolMatch) {
            usedPrefix = ''
            command = symbolMatch.cmd
            args = symbolMatch.rest ? symbolMatch.rest.split(/\s+/) : []
          } else {
            return
          }
        } else {
          const [cmd, ...rest] = bodyTrimmed.split(/\s+/)
          command = cmd?.toLowerCase()
          args = rest
          usedPrefix = ''
        }
      }

      if (!command) return
      const plugin = plugins.get(command)
      if (!plugin) return

      const chat = m.chat
      const sender = m.sender

      const rawSenderNumber = sender?.split('@')[0] || ''
      const senderNumber = rawSenderNumber.replace(/[^0-9]/g, '')

      const rawAltNumber = m.senderAlt?.split('@')[0] || ''
      const senderAltNumber = rawAltNumber.replace(/[^0-9]/g, '') || null

      const allOwners = [...config.ownerNumber, ...getExtraOwners()]
      const isOwner =
        m.fromMe ||
        (senderNumber && allOwners.includes(senderNumber)) ||
        (senderAltNumber && allOwners.includes(senderAltNumber))
      const allPremium = [...(config.premiumNumber || []), ...getExtraPremium()]
      const isPremium =
        isOwner ||
        (senderNumber && allPremium.includes(senderNumber)) ||
        (senderAltNumber && allPremium.includes(senderAltNumber))
      const role = isOwner ? 'owner' : (isPremium ? 'premium' : 'member')

      const nameColor = isOwner ? chalk.red.bold : chalk.cyan
      const chatLabel = m.isGroup ? chalk.cyan('[Group]') : chalk.magenta('[Private]')
      console.log(
        `${chalk.green(config.botName)} ${chalk.gray('[WhatsApp]')} ${chatLabel} ${nameColor(m.pushName || 'Unknown')} : ${body || '[media/tanpa teks]'}`
      )

      const allowed = isAllowedInSelfMode({
        senderNumber,
        senderAltNumber,
        isOwner,
        fromMe: m.fromMe,
        ownerNumbers: config.ownerNumber
      })
      if (!allowed) return

      if (!isOwner && senderNumber && isBanned(senderNumber)) return
      if (!isOwner && senderAltNumber && isBanned(senderAltNumber)) return
      if (!isOwner && isBannedChat(chat)) return

      const react = async (emoji) => {
        return m.react(emoji)
      }

      const settings = plugin.settings || {}

      if (settings.owner && !isOwner) {
        return m.reply(config.messages.owner)
      }

      if (settings.premium && !isPremium) {
        return m.reply(config.messages.premium)
      }

      if (settings.group === false && m.isGroup) {
        return m.reply(config.messages.private)
      }

      if (settings.private === false && !m.isGroup) {
        return m.reply(config.messages.group)
      }

      let groupMetadata = null
      let isGroupAdmin = false
      let isBotGroupAdmin = false

      if (m.isGroup && (settings.admin || settings.botAdmin)) {
        groupMetadata = await getGroupMetadata(chat)
        if (groupMetadata) {
          const participants = groupMetadata.participants || []
          const senderP = participants.find((p) => p.id === sender || p.id === m.sender)
          isGroupAdmin = !!senderP && (senderP.admin === 'admin' || senderP.admin === 'superadmin')

          const botId = (sock.user?.id || '').split(':')[0] + '@s.whatsapp.net'
          const botLid = (sock.user?.lid || '').split(':')[0] + '@lid'
          const botP = participants.find((p) => p.id === botId || p.id === botLid || p.id === sock.user?.id)
          isBotGroupAdmin = !!botP && (botP.admin === 'admin' || botP.admin === 'superadmin')
        }

        if (settings.botAdmin && !isBotGroupAdmin) {
          groupMetadata = await getGroupMetadata(chat, true)
          if (groupMetadata) {
            const participants = groupMetadata.participants || []
            const botId = (sock.user?.id || '').split(':')[0] + '@s.whatsapp.net'
            const botLid = (sock.user?.lid || '').split(':')[0] + '@lid'
            const botP = participants.find((p) => p.id === botId || p.id === botLid || p.id === sock.user?.id)
            isBotGroupAdmin = !!botP && (botP.admin === 'admin' || botP.admin === 'superadmin')
          }
        }

        if (settings.admin && !isOwner && !isGroupAdmin) {
          groupMetadata = await getGroupMetadata(chat, true)
          if (groupMetadata) {
            const participants = groupMetadata.participants || []
            const senderP = participants.find((p) => p.id === sender || p.id === m.sender)
            isGroupAdmin = !!senderP && (senderP.admin === 'admin' || senderP.admin === 'superadmin')
          }
        }
      }

      if (settings.admin && !isOwner && !isGroupAdmin) {
        return m.reply(config.messages.botAdmin)
      }

      if (settings.botAdmin && !isBotGroupAdmin) {
        return m.reply(config.messages.grootbotbup)
      }

      await plugin.run({
        m,
        args,
        command,
        react,
        chat,
        sender,
        role,
        isOwner,
        isPremium,
        isGroup: m.isGroup,
        sock,
        config,
        groupMetadata,
        isGroupAdmin,
        isBotGroupAdmin,
        usedPrefix
      })
    } catch (e) {
      console.error(chalk.red('[HANDLER ERROR]'), e)
    }
  }

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    await processMsg(messages[0])
  })

  sock.ev.on('messages.update', async (updates) => {
    for (const { key, update } of updates) {
      if (update?.message) {
        const stored = msgStore.get(key.id)
        if (stored) {
          const retried = { ...stored, message: update.message }
          await processMsg(retried)
        }
      }
    }
  })

  return sock
}

async function main() {
  await loadAllPlugins()
  watchPlugins()
  printHeader()
  await startBot()
}

main()