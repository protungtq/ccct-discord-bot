'use strict';
const { SlashCommandBuilder } = require('discord.js');
const db = require('../database');
const { embed, isAdmin } = require('../utils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('doanso')
    .setDescription('Mini game đoán số bí mật (Admin)')
    .addSubcommand((s) =>
      s
        .setName('batdau')
        .setDescription('Bắt đầu ván đoán số tại kênh này')
        .addIntegerOption((o) =>
          o.setName('max').setDescription('Số lớn nhất (mặc định 100)').setMinValue(10).setMaxValue(10000)
        )
    )
    .addSubcommand((s) => s.setName('ketthuc').setDescription('Hủy ván đang chơi tại kênh này')),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ content: 'Lệnh này chỉ dành cho Admin/Mod.', ephemeral: true });
    }
    const sub = interaction.options.getSubcommand();
    if (sub === 'batdau') {
      const max = interaction.options.getInteger('max') || 100;
      const secret = 1 + Math.floor(Math.random() * max);
      db.data.games[interaction.channelId] = {
        type: 'doanso',
        secret,
        max,
        startedBy: interaction.user.id,
        startedAt: Date.now(),
      };
      db.save();
      return interaction.reply({
        embeds: [
          embed(
            'Game đoán số bắt đầu!',
            'Bot đã chọn 1 số bí mật từ **1 đến ' + max + '**.\nChat một con số vào kênh này để đoán - bot sẽ gợi ý lớn hơn/nhỏ hơn. Đoán đúng nhận **100 XP**!',
            0xf59e0b
          ),
        ],
      });
    }
    if (sub === 'ketthuc') {
      if (!db.data.games[interaction.channelId]) {
        return interaction.reply({ content: 'Kênh này không có ván đoán số nào.', ephemeral: true });
      }
      delete db.data.games[interaction.channelId];
      db.save();
      return interaction.reply('Đã hủy ván đoán số.');
    }
  },
};
