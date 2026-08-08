export default {
  command: ['tesbutton', 'testbutton', 'buttonmenu'],
  description: 'Menu Hub Pengujian Semua Jenis Interactive Buttons',
  settings: { owner: true },

  async run({ m, config }) {
    await m.sendButton(
      '🤖 *HUB DEMO INTERACTIVE BUTTONS*\n\nPilih salah satu jenis tombol di bawah ini untuk melihat contoh penerapannya secara langsung:',
      [
        { text: '💬 1. Quick Reply', id: '.tesbutton-reply' },
        { text: '🌐 2. CTA URL / Copy / Call', id: '.tesbutton-cta' },
        { text: '📋 3. List Dropdown Select', id: '.tesbutton-list' },
        { text: '🖼️ 4. Image Header Button', id: '.tesbutton-image' },
        { text: '🛍️ 5. Catalog Product', id: '.tesbutton-catalog' },
        { text: '📍 6. Location & Address', id: '.tesbutton-location' },
        { text: '💳 7. Order & Payment', id: '.tesbutton-payment' },
        { text: '🌐 8. Webview & Reminder', id: '.tesbutton-webview' }
      ],
      `${config.botName} • Interactive Suite`
    )
  }
}
