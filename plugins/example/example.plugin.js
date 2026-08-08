/**
 * Example Template Plugin — ZellRayy-Bot
 * Note: Properti 'category' sengaja dihilangkan agar tidak muncul di list menu.
 */
export default {
  command: ['example', 'tesexample'],
  description: 'Contoh plugin dasar',
    async run({ m, args }) {
    await m.reply(`Halo! Ini adalah contoh plugin. Args: ${args.join(' ') || 'kosong'}`)
  }
}
