'use strict';
const { SlashCommandBuilder } = require('discord.js');
const { embed } = require('../utils');

module.exports = {
  data: new SlashCommandBuilder().setName('trogiup').setDescription('Danh sách lệnh của bot'),
  async execute(interaction) {
    const e = embed('Lệnh của bot CCCT', null, 0x5865f2).addFields(
      { name: '/diemdanh', value: 'Điểm danh mỗi ngày, giữ chuỗi nhận XP' },
      { name: '/rank', value: 'Xem level, XP, chuỗi điểm danh, lượt mời của bạn' },
      { name: '/top', value: 'Bảng xếp hạng XP / mời bạn / điểm danh' },
      { name: '/giftcode nhan', value: 'Nhận giftcode (mỗi người 1 mã)' },
      { name: 'Ticket', value: 'Nhấn nút Mở ticket ở kênh hỗ trợ để liên hệ BQT / hợp tác' },
      { name: 'Game đoán số', value: 'Khi Admin mở ván, chat con số để đoán - trúng nhận 100 XP' }
    );
    return interaction.reply({ embeds: [e], ephemeral: true });
  },
};
