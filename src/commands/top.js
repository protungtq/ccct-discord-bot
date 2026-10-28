'use strict';
const { SlashCommandBuilder } = require('discord.js');
const db = require('../database');
const { embed } = require('../utils');

const TYPES = {
  xp: { label: 'XP', get: (u) => u.xp },
  moi: { label: 'Lượt mời bạn', get: (u) => u.invites },
  diemdanh: { label: 'Tổng điểm danh', get: (u) => u.checkin.total },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('top')
    .setDescription('Bảng xếp hạng cộng đồng')
    .addStringOption((o) =>
      o
        .setName('loai')
        .setDescription('Loại bảng xếp hạng')
        .setRequired(true)
        .addChoices(
          { name: 'XP', value: 'xp' },
          { name: 'Mời bạn', value: 'moi' },
          { name: 'Điểm danh', value: 'diemdanh' }
        )
    ),
  async execute(interaction) {
    const type = TYPES[interaction.options.getString('loai')] || TYPES.xp;
    const rows = Object.entries(db.data.users)
      .map(([id, u]) => ({ id, val: type.get(u) }))
      .filter((r) => r.val > 0)
      .sort((a, b) => b.val - a.val)
      .slice(0, 10);
    if (!rows.length) {
      return interaction.reply({ content: 'Chưa có dữ liệu xếp hạng. Hãy là người đầu tiên nhé!', ephemeral: true });
    }
    const medals = ['1.', '2.', '3.'];
    const lines = rows.map(
      (r, i) => (medals[i] || i + 1 + '.') + ' <@' + r.id + '> - **' + r.val + '**'
    );
    return interaction.reply({
      embeds: [embed('Bảng xếp hạng: ' + type.label, lines.join('\n'), 0xf59e0b)],
    });
  },
};
