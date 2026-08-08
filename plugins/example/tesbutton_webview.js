export default {
  command: ['tesbutton-webview', 'tesbuttonwebview', 'tesreminder'],
  description: 'Demo Tombol Open Webview Dialog & CTA Reminder',

  async run({ m, sock, config }) {
    await sock.sendInteractiveMessage(m.chat, {
      text: '🌐 *DEMO WEBVIEW DIALOG & REMINDER BUTTONS*\n\nTombol untuk membuka dialog webview atau membuat pengingat:',
      footer: `${config.botName} • Webview & Reminder Suite`,
      interactiveButtons: [
        {
          name: 'cta_url',
          buttonParamsJson: JSON.stringify({
            display_text: '🌐 Buka Form Webview',
            url: 'https://google.com',
            merchant_url: 'https://google.com'
          })
        },
        {
          name: 'cta_reminder',
          buttonParamsJson: JSON.stringify({
            display_text: '⏰ Pasang Pengingat'
          })
        }
      ]
    }, { quoted: m })
  }
}
