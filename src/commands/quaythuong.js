'use strict';
const { SlashCommandBuilder } = require('discord.js');
const db = require('../database');
const { embed, isAdmin, todayVN } = require('../utils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quay')
    .setDescription('(Admin) Quay random chọn người trúng thưởng')
    .addStringOption((o) =>
      o
        .setName('nguon')
        .setDescription('Tập người quay (mặc định: điểm danh hôm nay)')
        .addChoices(
          { name: 'Điểm danh hôm nay', value: 'diemdanh' },
          { name: 'Tất cả thành viên có dữ liệu', value: 'tatca' }
        )
    )
    .addIntegerOption((o) =>
      o.setName('songuoi').setDescription('Số người trúng (mặc định 1)').setMinValue(1).setMaxValue(20)
    ),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ content: 'Lệnh này chỉ dành cho Admin/Mod.', ephemeral: true });
    }
    const source = interaction.options.getString('nguon') || 'diemdanh';
    const count = interaction.options.getInteger('songuoi') || 1;
    const today = todayVN();
    let pool = Object.entries(db.data.users)
      .filter(([, u]) => (source === 'diemdanh' ? u.checkin.lastDate === today : true))
      .map(([id]) => id);
    if (!pool.length) {
      return interaction.reply({ content: 'Không có ai trong tập quay này.', ephemeral: true });
    }
    // Trộn Fisher-Yates rồi cắt
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const winners = pool.slice(0, Math.min(count, pool.length));
    return interaction.reply({
      embeds: [
        embed(
          'Kết quả quay thưởng',
          'Nguồn quay: ' + (source === 'diemdanh' ? 'điểm danh hôm nay (' + pool.length + ' người)' : 'tất cả (' + pool.length + ' người)') +
            '\n\nTrúng thưởng:\n' + winners.map((id) => '<@' + id + '>').join('\n'),
          0xf59e0b
        ),
      ],
    });
  },
};
