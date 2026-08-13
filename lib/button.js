import {
  generateWAMessageFromContent,
  normalizeMessageContent,
  isJidGroup,
  generateMessageIDV2,
  generateMessageID,
  prepareWAMessageMedia
} from '@whiskeysockets/baileys'

function buildInteractiveButtons(buttons = []) {
  return buttons.map((b, i) => {
    if (b && b.name && b.buttonParamsJson) return b
    if (b && (b.id || b.text || b.displayText)) {
      const type = b.type || (b.url ? 'url' : b.copyCode ? 'copy' : b.phoneNumber ? 'call' : b.list ? 'list' : 'reply')
      switch (type) {
        case 'url':
        case 'cta_url':
          return {
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({
              display_text: b.text || b.displayText || 'Buka Link',
              url: b.url,
              merchant_url: b.url
            })
          }
        case 'copy':
        case 'cta_copy':
          return {
            name: 'cta_copy',
            buttonParamsJson: JSON.stringify({
              display_text: b.text || b.displayText || 'Salin Kode',
              id: b.id || b.copyCode,
              copy_code: b.copyCode || b.id
            })
          }
        case 'call':
        case 'cta_call':
          return {
            name: 'cta_call',
            buttonParamsJson: JSON.stringify({
              display_text: b.text || b.displayText || 'Telepon',
              id: b.id || b.phoneNumber,
              phone_number: b.phoneNumber || b.id
            })
          }
        case 'list':
        case 'single_select':
          return {
            name: 'single_select',
            buttonParamsJson: JSON.stringify({
              title: b.text || b.displayText || b.list?.title || 'Pilih Option',
              sections: b.list?.sections || b.sections || []
            })
          }
        case 'reply':
        case 'quick_reply':
        default:
          return {
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
              display_text: b.text || b.displayText || 'Button ' + (i + 1),
              id: b.id || ('quick_' + (i + 1))
            })
          }
      }
    }
    if (b && b.buttonId && b.buttonText?.displayText) {
      return {
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
          display_text: b.buttonText.displayText,
          id: b.buttonId
        })
      }
    }
    return b
  })
}

export function validateAuthoringButtons(buttons) {
  const errors = []
  const warnings = []
  if (buttons == null) {
    return { errors: [], warnings: [], valid: true, cleaned: [] }
  }
  if (!Array.isArray(buttons)) {
    errors.push('buttons must be an array')
    return { errors, warnings, valid: false, cleaned: [] }
  }
  const SOFT_BUTTON_CAP = 25
  if (buttons.length === 0) {
    warnings.push('buttons array is empty')
  } else if (buttons.length > SOFT_BUTTON_CAP) {
    warnings.push(`buttons count (${buttons.length}) exceeds soft cap of ${SOFT_BUTTON_CAP}; may be rejected by client`)
  }

  const cleaned = buttons.map((b, idx) => {
    if (b == null || typeof b !== 'object') {
      errors.push(`button[${idx}] is not an object`)
      return b
    }
    if (b.name && b.buttonParamsJson) {
      if (typeof b.buttonParamsJson !== 'string') {
        errors.push(`button[${idx}] buttonParamsJson must be string`)
      } else {
        try {
          JSON.parse(b.buttonParamsJson)
        } catch (e) {
          errors.push(`button[${idx}] buttonParamsJson is not valid JSON: ${e.message}`)
        }
      }
      return b
    }
    if (b.id || b.text || b.displayText) {
      if (!(b.id || b.text || b.displayText)) {
        errors.push(`button[${idx}] legacy shape missing id or text/displayText`)
      }
      return b
    }
    if (b.buttonId && b.buttonText && typeof b.buttonText === 'object' && b.buttonText.displayText) {
      return b
    }
    if (b.buttonParamsJson) {
      if (typeof b.buttonParamsJson !== 'string') {
        warnings.push(`button[${idx}] has non-string buttonParamsJson; will attempt to stringify`)
        try {
          b.buttonParamsJson = JSON.stringify(b.buttonParamsJson)
        } catch {
          errors.push(`button[${idx}] buttonParamsJson could not be serialized`)
        }
      } else {
        try { JSON.parse(b.buttonParamsJson); } catch (e) { warnings.push(`button[${idx}] buttonParamsJson not valid JSON (${e.message})`); }
      }
      if (!b.name) {
        warnings.push(`button[${idx}] missing name; defaulting to quick_reply`)
        b.name = 'quick_reply'
      }
      return b
    }
    warnings.push(`button[${idx}] unrecognized shape; passing through unchanged`)
    return b
  })

  return { errors, warnings, valid: errors.length === 0, cleaned }
}

export class InteractiveValidationError extends Error {
  constructor(message, { context, errors = [], warnings = [], example } = {}) {
    super(message)
    this.name = 'InteractiveValidationError'
    this.context = context
    this.errors = errors
    this.warnings = warnings
    this.example = example
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      context: this.context,
      errors: this.errors,
      warnings: this.warnings,
      example: this.example
    }
  }

  formatDetailed() {
    const lines = [
      `[${this.name}] ${this.message}${this.context ? ' (' + this.context + ')' : ''}`
    ]
    if (this.errors?.length) {
      lines.push('Errors:')
      this.errors.forEach(e => lines.push('  - ' + e))
    }
    if (this.warnings?.length) {
      lines.push('Warnings:')
      this.warnings.forEach(w => lines.push('  - ' + w))
    }
    if (this.example) {
      lines.push('Example payload:', JSON.stringify(this.example, null, 2))
    }
    return lines.join('\n')
  }
}

const EXAMPLE_PAYLOADS = {
  sendButtons: {
    text: 'Choose an option',
    buttons: [
      { id: 'opt1', text: 'Option 1' },
      { id: 'opt2', text: 'Option 2' },
      { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Visit Site', url: 'https://example.com' }) }
    ],
    footer: 'Footer text'
  },
  sendInteractiveMessage: {
    text: 'Pick an action',
    interactiveButtons: [
      { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Hello', id: 'hello' }) },
      { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'Copy Code', copy_code: 'ABC123' }) }
    ],
    footer: 'Footer'
  },
  sendButtonsWithImage: {
    image: { url: 'https://example.com/image.jpg' },
    caption: 'This is an image with buttons',
    buttons: [
      { id: 'opt1', text: 'Option 1' },
      { id: 'opt2', text: 'Option 2' }
    ],
    footer: 'Footer text'
  },
  sendCarousel: {
    text: 'Geser kartu untuk memilih',
    footer: 'Official Contact',
    cards: [
      {
        image: { url: 'https://example.com/card1.jpg' },
        text: 'Isi card pertama',
        buttons: [
          { type: 'url', text: 'Buka Link', url: 'https://example.com' }
        ]
      },
      {
        image: { url: 'https://example.com/card2.jpg' },
        text: 'Isi card kedua',
        buttons: [
          { type: 'reply', text: 'Chat Admin', id: '.admin' }
        ]
      }
    ]
  }
}

const SEND_BUTTONS_ALLOWED_COMPLEX = new Set([
  'quick_reply', 'cta_url', 'cta_copy', 'cta_call', 'cta_catalog', 'cta_reminder', 'cta_cancel_reminder',
  'address_message', 'send_location', 'open_webview', 'mpm', 'wa_payment_transaction_details',
  'automated_greeting_message_view_catalog', 'galaxy_message', 'single_select'
])
const INTERACTIVE_ALLOWED_NAMES = new Set([
  'quick_reply', 'cta_url', 'cta_copy', 'cta_call', 'cta_catalog', 'cta_reminder', 'cta_cancel_reminder',
  'address_message', 'send_location', 'open_webview', 'mpm', 'wa_payment_transaction_details',
  'automated_greeting_message_view_catalog', 'galaxy_message', 'single_select'
])
const REQUIRED_FIELDS_MAP = {
  cta_url: ['display_text', 'url'],
  cta_copy: ['display_text', 'copy_code'],
  cta_call: ['display_text', 'phone_number'],
  cta_catalog: [],
  cta_reminder: [],
  cta_cancel_reminder: [],
  address_message: [],
  send_location: [],
  open_webview: [],
  mpm: [],
  wa_payment_transaction_details: [],
  automated_greeting_message_view_catalog: [],
  galaxy_message: [],
  single_select: ['title', 'sections'],
  quick_reply: ['display_text', 'id']
}

function parseButtonParams(name, buttonParamsJson, errors, warnings, index) {
  let parsed
  try {
    parsed = JSON.parse(buttonParamsJson)
  } catch (e) {
    errors.push(`button[${index}] (${name}) invalid JSON: ${e.message}`)
    return null
  }
  const req = REQUIRED_FIELDS_MAP[name] || []
  for (const f of req) {
    if (!(f in parsed)) {
      errors.push(`button[${index}] (${name}) missing required field '${f}'`)
    }
  }
  if (name === 'open_webview' && parsed.link) {
    if (typeof parsed.link !== 'object' || !parsed.link.url) {
      errors.push(`button[${index}] (open_webview) link.url required`)
    }
  }
  if (name === 'single_select') {
    if (!Array.isArray(parsed.sections) || parsed.sections.length === 0) {
      errors.push(`button[${index}] (single_select) sections must be non-empty array`)
    }
  }
  return parsed
}

export function validateSendButtonsPayload(data) {
  const errors = []
  const warnings = []
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['payload must be an object'], warnings }
  }
  if (!data.text && !data.caption) {
    errors.push('text or caption is mandatory')
  }
  if (!Array.isArray(data.buttons) || data.buttons.length === 0) {
    errors.push('buttons is mandatory and must be a non-empty array')
  } else {
    data.buttons.forEach((btn, i) => {
      if (!btn || typeof btn !== 'object') {
        errors.push(`button[${i}] must be an object`)
        return
      }
      if ((btn.id || btn.url || btn.copyCode || btn.phoneNumber || btn.list || btn.text) && (btn.text || btn.displayText || btn.id)) {
        return
      }
      if (btn.name && btn.buttonParamsJson) {
        if (!SEND_BUTTONS_ALLOWED_COMPLEX.has(btn.name)) {
          errors.push(`button[${i}] name '${btn.name}' not allowed in sendButtons`)
          return
        }
        if (typeof btn.buttonParamsJson !== 'string') {
          errors.push(`button[${i}] buttonParamsJson must be string`)
          return
        }
        parseButtonParams(btn.name, btn.buttonParamsJson, errors, warnings, i)
        return
      }
      errors.push(`button[${i}] invalid shape (must be legacy quick reply or named ${Array.from(SEND_BUTTONS_ALLOWED_COMPLEX).join(', ')})`)
    })
  }
  return { valid: errors.length === 0, errors, warnings }
}

export function validateSendInteractiveMessagePayload(data) {
  const errors = []
  const warnings = []
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['payload must be an object'], warnings }
  }
  if (!data.text && !data.caption) {
    errors.push('text or caption is mandatory')
  }
  if (!Array.isArray(data.interactiveButtons) || data.interactiveButtons.length === 0) {
    errors.push('interactiveButtons is mandatory and must be a non-empty array')
  } else {
    data.interactiveButtons.forEach((btn, i) => {
      if (!btn || typeof btn !== 'object') {
        errors.push(`interactiveButtons[${i}] must be an object`)
        return
      }
      if (!btn.name || typeof btn.name !== 'string') {
        errors.push(`interactiveButtons[${i}] missing name`)
        return
      }
      if (!INTERACTIVE_ALLOWED_NAMES.has(btn.name)) {
        errors.push(`interactiveButtons[${i}] name '${btn.name}' not allowed`)
        return
      }
      if (!btn.buttonParamsJson || typeof btn.buttonParamsJson !== 'string') {
        errors.push(`interactiveButtons[${i}] buttonParamsJson must be string`)
        return
      }
      parseButtonParams(btn.name, btn.buttonParamsJson, errors, warnings, i)
    })
  }
  return { valid: errors.length === 0, errors, warnings }
}

export function validateInteractiveMessageContent(content) {
  const errors = []
  const warnings = []
  if (!content || typeof content !== 'object') {
    return { errors: ['content must be an object'], warnings, valid: false }
  }
  const interactive = content.viewOnceMessage?.message?.interactiveMessage || content.interactiveMessage
  if (!interactive) {
    return { errors, warnings, valid: true }
  }
  const nativeFlow = interactive.nativeFlowMessage
  if (!nativeFlow) {
    errors.push('interactiveMessage.nativeFlowMessage missing')
    return { errors, warnings, valid: false }
  }
  if (!Array.isArray(nativeFlow.buttons)) {
    errors.push('nativeFlowMessage.buttons must be an array')
    return { errors, warnings, valid: false }
  }
  if (nativeFlow.buttons.length === 0) {
    warnings.push('nativeFlowMessage.buttons is empty')
  }
  nativeFlow.buttons.forEach((btn, i) => {
    if (!btn || typeof btn !== 'object') {
      errors.push(`buttons[${i}] is not an object`)
      return
    }
    if (!btn.buttonParamsJson) {
      warnings.push(`buttons[${i}] missing buttonParamsJson (may fail to render)`)
    } else if (typeof btn.buttonParamsJson !== 'string') {
      errors.push(`buttons[${i}] buttonParamsJson must be string`)
    } else {
      try { JSON.parse(btn.buttonParamsJson); } catch (e) { warnings.push(`buttons[${i}] buttonParamsJson invalid JSON (${e.message})`); }
    }
    if (!btn.name) {
      warnings.push(`buttons[${i}] missing name; defaulting to quick_reply`)
      btn.name = 'quick_reply'
    }
  })
  return { errors, warnings, valid: errors.length === 0 }
}

// Wrapper key -> wrapper.message umumnya ngebungkus "pesan asli"-nya WA.
// Ini yang dipake findInteractiveContainer() buat nembus nesting apapun
// (termasuk ketumpuk, misal viewOnceMessage di dalem ephemeralMessage).
const WRAPPER_KEYS_WITH_MESSAGE = [
  'viewOnceMessage',
  'viewOnceMessageV2',
  'viewOnceMessageV2Extension',
  'ephemeralMessage',
  'documentWithCaptionMessage',
  'editedMessage',
  'deviceSentMessage'
]

/**
 * Deep-search sebuah message object buat nemuin "container" yang beneran
 * ngandung interactiveMessage / buttonsMessage / listMessage / templateMessage
 * (hydratedTemplate), nembus SEMUA wrapper WA yang umum dipake — bukan cuma
 * viewOnceMessage doang kayak sebelumnya. Ini bikin getButtonType/getButtonArgs
 * otomatis ngenalin pesan yang ke-nest di dalem ephemeralMessage,
 * documentWithCaptionMessage, editedMessage, deviceSentMessage, dst — atau
 * kombinasi ketumpuk dari itu semua — tanpa perlu nambahin cek manual satu2
 * tiap ada wrapper baru.
 *
 * @returns {{ container: object, path: string[] } | null}
 */
export function findInteractiveContainer(message, _path = [], _depth = 0) {
  if (!message || typeof message !== 'object' || _depth > 8) return null

  if (
    message.interactiveMessage ||
    message.buttonsMessage ||
    message.listMessage ||
    message.templateMessage ||
    message.hydratedTemplate
  ) {
    return { container: message, path: _path }
  }

  for (const key of WRAPPER_KEYS_WITH_MESSAGE) {
    const wrapped = message[key]?.message
    if (wrapped) {
      const found = findInteractiveContainer(wrapped, [..._path, key], _depth + 1)
      if (found) return found
    }
  }

  return null
}

export function getButtonType(message) {
  const found = findInteractiveContainer(message)
  const container = found ? found.container : message

  if (container.listMessage) {
    return 'list'
  } else if (container.buttonsMessage) {
    return 'buttons'
  }

  const interactive = container.interactiveMessage
  // carouselMessage gak punya nativeFlowMessage di level interactiveMessage
  // langsung (dia ada di dalem tiap cards[i].nativeFlowMessage), makanya
  // sebelumnya carousel gak pernah ke-detect di sini sama sekali dan cuma
  // ketolong lewat fallback manual di crm.js. Sekarang dideteksi native di
  // sini juga biar konsisten dipake di semua tempat (sendInteractiveMessage,
  // crm, dll).
  if (interactive?.carouselMessage) {
    return 'carousel'
  }
  if (interactive?.nativeFlowMessage) {
    return 'native_flow'
  }
  // templateMessage / hydratedTemplate: format lama tapi masih beredar &
  // masih perlu additionalNodes native_flow biar kebaca WA versi sekarang.
  if (container.templateMessage || container.hydratedTemplate) {
    return 'template'
  }
  return null
}

export function getButtonArgs(message) {
  const found = findInteractiveContainer(message)
  const container = found ? found.container : message
  const interactive = container.interactiveMessage
  const nativeFlow = interactive?.nativeFlowMessage
  const firstButtonName = nativeFlow?.buttons?.[0]?.name
  if (nativeFlow && (firstButtonName === 'review_and_pay' || firstButtonName === 'payment_info')) {
    return {
      tag: 'biz',
      attrs: {
        native_flow_name: firstButtonName === 'review_and_pay' ? 'order_details' : firstButtonName
      }
    }
  } else if (
    nativeFlow ||
    interactive?.carouselMessage ||
    container.buttonsMessage ||
    container.templateMessage ||
    container.hydratedTemplate
  ) {
    return {
      tag: 'biz',
      attrs: {},
      content: [{
        tag: 'interactive',
        attrs: {
          type: 'native_flow',
          v: '1'
        },
        content: [{
          tag: 'native_flow',
          attrs: {
            v: '9',
            name: 'mixed'
          }
        }]
      }]
    }
  } else if (container.listMessage) {
    return {
      tag: 'biz',
      attrs: {},
      content: [{
        tag: 'list',
        attrs: {
          v: '2',
          type: 'product_list'
        }
      }]
    }
  } else {
    return {
      tag: 'biz',
      attrs: {}
    }
  }
}

async function convertToInteractiveMessage(sock, content) {
  if (content.interactiveButtons && content.interactiveButtons.length > 0) {
    const interactiveMessage = {
      nativeFlowMessage: {
        messageVersion: 1,
        buttons: content.interactiveButtons.map(btn => ({
          name: btn.name || 'quick_reply',
          buttonParamsJson: typeof btn.buttonParamsJson === 'string' ? btn.buttonParamsJson : JSON.stringify(btn.buttonParamsJson)
        }))
      }
    }
    if (content.image || content.video || content.document) {
      const mediaType = content.image ? 'image' : content.video ? 'video' : 'document'
      const mediaContent = content[mediaType]

      try {
        const prepared = await prepareWAMessageMedia(
          { [mediaType]: mediaContent },
          { upload: sock.waUploadToServer }
        )

        if (mediaType === 'image' && prepared.imageMessage) {
          interactiveMessage.header = {
            hasMediaAttachment: true,
            imageMessage: prepared.imageMessage
          }
        } else if (mediaType === 'video' && prepared.videoMessage) {
          interactiveMessage.header = {
            hasMediaAttachment: true,
            videoMessage: prepared.videoMessage
          }
        } else if (mediaType === 'document' && prepared.documentMessage) {
          interactiveMessage.header = {
            hasMediaAttachment: true,
            documentMessage: prepared.documentMessage
          }
        }
      } catch (error) {
        console.error('Failed to prepare media:', error)
        throw new InteractiveValidationError('Failed to prepare media attachment', {
          context: 'convertToInteractiveMessage.prepareWAMessageMedia',
          errors: [error.message]
        })
      }
    } else if (content.title || content.subtitle) {
      interactiveMessage.header = {
        title: content.title || content.subtitle || ''
      }
    }
    if (content.caption || content.text) {
      interactiveMessage.body = { text: content.caption || content.text }
    }
    if (content.footer) {
      interactiveMessage.footer = { text: content.footer }
    }

    const newContent = { ...content }
    delete newContent.interactiveButtons
    delete newContent.title
    delete newContent.subtitle
    delete newContent.text
    delete newContent.caption
    delete newContent.footer
    delete newContent.image
    delete newContent.video
    delete newContent.document

    return { ...newContent, viewOnceMessage: { message: { interactiveMessage } } }
  }
  return content
}

/**
 * Validasi payload sendCarousel SEBELUM dibangun jadi carouselMessage.
 * Ini yang nyegah kasus "cards kosong yang kebaca" — kalau cards gak diisi
 * bener (kosong / bukan array / card tanpa header+body), error langsung
 * dilempar di sini alih-alih diem2 ngirim carousel yang bakal nongol blank
 * di WhatsApp.
 */
export function validateSendCarouselPayload(data) {
  const errors = []
  const warnings = []
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['payload must be an object'], warnings }
  }
  if (!data.text && !data.caption) {
    errors.push('text or caption is mandatory (dipakai sebagai body carousel)')
  }
  if (!Array.isArray(data.cards) || data.cards.length === 0) {
    errors.push('cards is mandatory and must be a non-empty array — ini penyebab utama "cards kosong" pas dibuka di WA')
  } else {
    data.cards.forEach((card, i) => {
      if (!card || typeof card !== 'object') {
        errors.push(`cards[${i}] must be an object`)
        return
      }
      if (!card.image && !card.video && !card.document && !card.title) {
        errors.push(`cards[${i}] butuh minimal salah satu: image, video, document, atau title (header card gak boleh kosong)`)
      }
      if (!card.text && !card.caption) {
        warnings.push(`cards[${i}] gak ada text/caption — body card bakal kosong`)
      }
      if (card.buttons != null && !Array.isArray(card.buttons)) {
        errors.push(`cards[${i}] buttons harus berupa array`)
      }
    })
  }
  return { valid: errors.length === 0, errors, warnings }
}

/**
 * Siapin header (media atau title-only) untuk satu card carousel.
 */
async function prepareCardHeader(sock, card) {
  if (card.image || card.video || card.document) {
    const mediaType = card.image ? 'image' : card.video ? 'video' : 'document'
    const mediaContent = card[mediaType]
    const prepared = await prepareWAMessageMedia(
      { [mediaType]: mediaContent },
      { upload: sock.waUploadToServer }
    )
    const key = `${mediaType}Message`
    if (prepared[key]) {
      return { hasMediaAttachment: true, [key]: prepared[key] }
    }
    throw new InteractiveValidationError(`Failed to prepare card ${mediaType}`, {
      context: 'prepareCardHeader',
      errors: [`prepareWAMessageMedia tidak menghasilkan ${key}`]
    })
  }
  if (card.title) {
    return { title: card.title, hasMediaAttachment: false }
  }
  return undefined
}

/**
 * Bangun satu object card carousel (header + body + nativeFlowMessage
 * berisi buttons), format persis yang dipakai carouselMessage.cards[i]
 * di WhatsApp — header WAJIB media (image/video/document) atau title,
 * kalau kosong dua-duanya WA bakal ngerender card itu blank.
 */
async function buildCarouselCard(sock, card) {
  const header = await prepareCardHeader(sock, card)
  const body = (card.text || card.caption) ? { text: card.text || card.caption } : undefined
  const buttons = buildInteractiveButtons(card.buttons || [])
  const nativeFlowMessage = { messageVersion: 1, buttons }

  return {
    ...(header ? { header } : {}),
    ...(body ? { body } : {}),
    nativeFlowMessage
  }
}

/**
 * sock.sendCarousel(jid, { text, footer, cards: [...] }, options)
 *
 * Builder untuk carouselMessage (kartu geser / "image slider") yang bener2
 * ke-render di WhatsApp — nembak langsung format resmi interactiveMessage
 * .carouselMessage.cards[], dibungkus viewOnceMessage, plus additionalNodes
 * biz/interactive/native_flow yang wajib ada biar client WA nge-render
 * carousel-nya (bukan cuma teks polos).
 *
 * Tiap item di `cards` support:
 *   - image / video / document: { url } atau Buffer — header media card
 *   - title: dipakai kalau card gak punya media (header title-only)
 *   - text / caption: body text card
 *   - buttons: array tombol per-card (format sama kayak sendButtons: url/copy/call/reply/list)
 */
export async function sendCarousel(sock, jid, data = {}, options = {}) {
  if (!sock) {
    throw new InteractiveValidationError('Socket is required', { context: 'sendCarousel' })
  }

  const { text = '', caption = '', footer = '', cards = [] } = data

  const strict = validateSendCarouselPayload({ text: text || caption, cards })
  if (!strict.valid) {
    throw new InteractiveValidationError('Carousel payload invalid', {
      context: 'sendCarousel.validateSendCarouselPayload',
      errors: strict.errors,
      warnings: strict.warnings,
      example: EXAMPLE_PAYLOADS.sendCarousel
    })
  }
  if (strict.warnings.length) console.warn('sendCarousel warnings:', strict.warnings)

  const builtCards = await Promise.all(cards.map(card => buildCarouselCard(sock, card)))

  const interactiveMessage = {
    body: { text: text || caption },
    ...(footer ? { footer: { text: footer } } : {}),
    carouselMessage: {
      messageVersion: 1,
      cards: builtCards
    }
  }

  const content = { viewOnceMessage: { message: { interactiveMessage } } }

  const userJid = sock.authState?.creds?.me?.id || sock.user?.id
  const genMsgId = generateMessageIDV2 || generateMessageID
  const fullMsg = generateWAMessageFromContent(jid, content, {
    logger: sock.logger,
    userJid,
    messageId: genMsgId ? genMsgId(userJid) : sock.generateMessageTag(),
    timestamp: new Date(),
    ...options
  })

  const normalizedContent = normalizeMessageContent(fullMsg.message)
  const buttonType = getButtonType(normalizedContent)
  let additionalNodes = [...(options.additionalNodes || [])]
  if (buttonType) {
    additionalNodes.push(getButtonArgs(normalizedContent))
    if (options.useAI === true) {
      additionalNodes.push({ tag: 'biz_bot', attrs: { ai_type: '1' } })
    }
  }

  await sock.relayMessage(jid, fullMsg.message, {
    messageId: fullMsg.key.id,
    useCachedGroupMetadata: options.useCachedGroupMetadata,
    additionalAttributes: options.additionalAttributes || {},
    statusJidList: options.statusJidList,
    additionalNodes
  })

  // Sama kayak sendInteractiveMessage: simpan ke store pas kirim biar
  // kalau raw carousel ini di-reply terus di-.crm, isi cards-nya PASTI
  // ketemu lengkap (bukan versi "tipis" hasil WA motong quotedMessage).
  if (global.store && typeof global.store.set === 'function') {
    global.store.set(fullMsg.key.id, fullMsg)
  }

  return fullMsg
}

export async function sendInteractiveMessage(sock, jid, content, options = {}) {
  if (!sock) {
    throw new InteractiveValidationError('Socket is required', { context: 'sendInteractiveMessage' })
  }

  const relayMessage = sock.relayMessage.bind(sock)
  const genMsgId = generateMessageIDV2 || generateMessageID

  if (!generateWAMessageFromContent || !normalizeMessageContent || !isJidGroup || !relayMessage) {
    throw new InteractiveValidationError('Missing baileys internals', {
      context: 'sendInteractiveMessage.staticImport',
      errors: ['Could not import required functions from @whiskeysockets/baileys. Is it installed?'],
      example: { install: 'npm i @whiskeysockets/baileys' }
    })
  }

  if (content && Array.isArray(content.interactiveButtons)) {
    const strict = validateSendInteractiveMessagePayload(content)
    if (!strict.valid) {
      throw new InteractiveValidationError('Interactive authoring payload invalid', {
        context: 'sendInteractiveMessage.validateSendInteractiveMessagePayload',
        errors: strict.errors,
        warnings: strict.warnings,
        example: EXAMPLE_PAYLOADS.sendInteractiveMessage
      })
    }
    if (strict.warnings.length) console.warn('sendInteractiveMessage warnings:', strict.warnings)
  }

  const convertedContent = await convertToInteractiveMessage(sock, content)
  const { errors: contentErrors, warnings: contentWarnings, valid: contentValid } = validateInteractiveMessageContent(convertedContent)
  if (!contentValid) {
    throw new InteractiveValidationError('Converted interactive content invalid', {
      context: 'sendInteractiveMessage.validateInteractiveMessageContent',
      errors: contentErrors,
      warnings: contentWarnings,
      example: await convertToInteractiveMessage(sock, EXAMPLE_PAYLOADS.sendInteractiveMessage)
    })
  }
  if (contentWarnings.length) {
    console.warn('Interactive content warnings:', contentWarnings)
  }

  const userJid = sock.authState?.creds?.me?.id || sock.user?.id
  const fullMsg = generateWAMessageFromContent(jid, convertedContent, {
    logger: sock.logger,
    userJid,
    messageId: genMsgId ? genMsgId(userJid) : sock.generateMessageTag(),
    timestamp: new Date(),
    ...options
  })

  const normalizedContent = normalizeMessageContent(fullMsg.message)
  const buttonType = getButtonType(normalizedContent)
  let additionalNodes = [...(options.additionalNodes || [])]
  if (buttonType) {
    const buttonsNode = getButtonArgs(normalizedContent)
    additionalNodes.push(buttonsNode)
    if (options.useAI === true) {
      additionalNodes.push({ tag: 'biz_bot', attrs: { ai_type: '1' } })
    }
  }

  await relayMessage(jid, fullMsg.message, {
    messageId: fullMsg.key.id,
    useCachedGroupMetadata: options.useCachedGroupMetadata,
    additionalAttributes: options.additionalAttributes || {},
    statusJidList: options.statusJidList,
    additionalNodes
  })

  // Simpan langsung ke store pas kirim, jangan cuma ngandelin event echo
  // 'messages.upsert' dari server (itu bisa aja telat/gak selalu balik untuk
  // pesan yang dikirim via relayMessage). Ini penting biar kalau owner reply
  // pesan interactive/button ini terus jalanin .crm, raw message-nya PASTI
  // ketemu di store (bukan versi quoted yang WA suka strip/sederhanain).
  if (global.store && typeof global.store.set === 'function') {
    global.store.set(fullMsg.key.id, fullMsg)
  }

  return fullMsg
}

export async function sendInteractiveButtonsBasic(sock, jid, data = {}, options = {}) {
  if (!sock) {
    throw new InteractiveValidationError('Socket is required', { context: 'sendButtons' })
  }

  const { text = '', caption = '', footer = '', title, subtitle, buttons = [], image, video, document } = data
  const strict = validateSendButtonsPayload({ text: text || caption, buttons, title, subtitle, footer })
  if (!strict.valid) {
    throw new InteractiveValidationError('Buttons payload invalid', {
      context: 'sendButtons.validateSendButtonsPayload',
      errors: strict.errors,
      warnings: strict.warnings,
      example: EXAMPLE_PAYLOADS.sendButtons
    })
  }
  if (strict.warnings.length) console.warn('sendButtons warnings:', strict.warnings)
  const { errors, warnings, cleaned } = validateAuthoringButtons(buttons)
  if (errors.length) {
    throw new InteractiveValidationError('Authoring button objects invalid', {
      context: 'sendButtons.validateAuthoringButtons',
      errors,
      warnings,
      example: EXAMPLE_PAYLOADS.sendButtons.buttons
    })
  }
  if (warnings.length) {
    console.warn('Button validation warnings:', warnings)
  }
  const interactiveButtons = buildInteractiveButtons(cleaned)
  const payload = {
    text: text || caption,
    caption: caption || text,
    footer,
    interactiveButtons
  }

  if (title) payload.title = title
  if (subtitle) payload.subtitle = subtitle
  if (image) payload.image = image
  if (video) payload.video = video
  if (document) payload.document = document

  return sendInteractiveMessage(sock, jid, payload, options)
}

export {
  sendInteractiveButtonsBasic as sendButtons
}