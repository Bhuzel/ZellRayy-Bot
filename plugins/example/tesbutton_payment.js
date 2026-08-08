export default {
  command: ['tesbutton-payment', 'tesbuttonpayment', 'tespayment', 'tesorder'],
  description: 'Demo Tombol Review and Pay & Payment Info Order',

  async run({ m, sock, config }) {
    await sock.sendInteractiveMessage(m.chat, {
      text: '💳 *DEMO PAYMENT & ORDER BUTTONS*\n\nContoh tombol transaksi dan konfirmasi pembayaran order:',
      footer: `${config.botName} • Payment Gateway`,
      interactiveButtons: [
        {
          name: 'quick_reply',
          buttonParamsJson: JSON.stringify({
            display_text: '💳 Konfirmasi Pembayaran',
            id: '.payconfirm'
          })
        },
        {
          name: 'cta_copy',
          buttonParamsJson: JSON.stringify({
            display_text: '🏦 Copy Rekening BNI',
            copy_code: '1234567890'
          })
        }
      ]
    }, { quoted: m })
  }
}
