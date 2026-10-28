'use strict';
const { SlashCommandBuilder } = require('discord.js');
const db = require('../database');
const config = require('../config');
const { todayVN, dateVN, embed } = require('../utils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('diemdanh')
    .setDescription('Điểm danh hàng ngày, giữ chuỗi để nhận thêm XP'),
  async execute(interaction) {
    const rec = db.user(interaction.user.id);
    const today = todayVN();
    if (rec.checkin.lastDate === today) {
      return interaction.reply({
        embeds: [
          embed(
            'Đã điểm danh hôm nay rồi',
            'Chuỗi hiện tại: **' + rec.checkin.streak + ' ngày** - tổng ' + rec.checkin.total + ' lần điểm danh.\nQuay lại vào ngày mai nhé!',
            0xf59e0b
          ),
        ],
        ephemeral: true,
      });
    }
    const yesterday = dateVN(-1);
    rec.checkin.streak = rec.checkin.lastDate === yesterday ? rec.checkin.streak + 1 : 1;
    rec.checkin.lastDate = today;
    rec.checkin.total += 1;
    const bonus = Math.min(rec.checkin.streak * 5, 50);
    rec.xp += config.checkinXp + bonus;
    db.save();
    return interaction.reply({
      embeds: [
        embed(
          'Điểm danh thành công!',
          interaction.user.toString() +
            ' nhận **' + (config.checkinXp + bonus) + ' XP** (cơ bản ' + config.checkinXp +
            ' + thưởng chuỗi ' + bonus + ').\nChuỗi: **' + rec.checkin.streak +
            ' ngày** liên tiếp - tổng ' + rec.checkin.total + ' lần.',
          0x57f287
        ),
      ],
    });
  },
};
