'use strict';
const fs = require('fs');
const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const db = require('../database');
const config = require('../config');
const { isAdmin, todayVN } = require('../utils');

// Tìm kênh mod: ưu tiên MOD_LOG_CHANNEL_ID, nếu chưa đặt thì tìm kênh tên mod-chat
function findModChannel(guild) {
  if (config.modLogChannelId) {
    const ch = guild.channels.cache.get(config.modLogChannelId);
    if (ch && ch.isTextBased()) return ch;
  }
  return guild.channels.cache.find((c) => c.isTextBased() && c.name === 'mod-chat') || null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sao-luu')
    .setDescription('(Admin) Gửi bản sao lưu dữ liệu bot vào #mod-chat'),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ content: 'Chỉ admin mới dùng được lệnh này.', ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });
    // Lưu dữ liệu mới nhất rồi mới gửi, để file gửi đi không bị cũ
    try {
      db.save();
    } catch (e) {}
    db.backup();
    if (!fs.existsSync(db.file)) {
      return interaction.editReply('Chưa có file dữ liệu để sao lưu.');
    }
    const file = new AttachmentBuilder(db.file, { name: 'db-' + todayVN() + '.json' });
    const modCh = interaction.guild ? findModChannel(interaction.guild) : null;
    if (modCh) {
      await modCh.send({
        content:
          'Bản sao lưu dữ liệu bot ngày ' +
          todayVN() +
          ' (lệnh /sao-luu của ' +
          interaction.user.toString() +
          '). File này chứa cả mã giftcode chưa phát — chỉ để trong #mod-chat, đừng chuyển ra kênh công khai.',
        files: [file],
      });
      return interaction.editReply(
        'Đã gửi bản sao lưu ngày ' + todayVN() + ' vào #mod-chat. Tải file đính kèm trong đó về máy để cất giữ.'
      );
    }
    // Không tìm thấy #mod-chat: gửi thẳng file cho admin qua tin ephemeral
    await interaction.editReply({
      content: 'Không tìm thấy kênh #mod-chat nên gửi thẳng file tại đây (ngày ' + todayVN() + '):',
      files: [file],
    });
  },
};
