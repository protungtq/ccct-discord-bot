'use strict';
const { SlashCommandBuilder } = require('discord.js');
const db = require('../database');
const { embed, levelFromXp, xpForNextLevel } = require('../utils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Xem thẻ cấp bậc: XP, level, chuỗi điểm danh, lượt mời')
    .addUserOption((o) => o.setName('thanhvien').setDescription('Thành viên muốn xem (mặc định: bạn)')),
  async execute(interaction) {
    const target = interaction.options.getUser('thanhvien') || interaction.user;
    const rec = db.data.users[target.id];
    if (!rec) {
      return interaction.reply({ content: target.username + ' chưa có dữ liệu. Hãy chat hoặc /diemdanh trước nhé!', ephemeral: true });
    }
    const lv = levelFromXp(rec.xp);
    const next = xpForNextLevel(rec.xp);
    const e = embed('Thẻ cấp bậc - ' + target.username, null, 0x5865f2)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: 'Level', value: String(lv), inline: true },
        { name: 'XP', value: rec.xp + ' / ' + next, inline: true },
        { name: 'Chuỗi điểm danh', value: rec.checkin.streak + ' ngày (tổng ' + rec.checkin.total + ')', inline: true },
        { name: 'Đã mời được', value: rec.invites + ' người', inline: true }
      );
    return interaction.reply({ embeds: [e] });
  },
};
