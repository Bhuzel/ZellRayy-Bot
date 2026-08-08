export default {
  command: ['tesbutton-location', 'tesbuttonlocation', 'teslocation', 'tesaddress'],
  description: 'Demo Tombol Send Location & Address Message',

  async run({ m, config }) {
    await m.sendButton(
      '📍 *DEMO LOCATION & ADDRESS BUTTONS*\n\nPilih opsi lokasi / alamat di bawah ini:',
      [
        { text: '📍 Kirim Lokasi Saya', id: '.location' },
        { text: '🏠 Isi Alamat Pengiriman', id: '.address' }
      ],
      `${config.botName} • Location Suite`
    )
  }
}
