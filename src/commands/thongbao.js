'use strict';
const { SlashCommandBuilder } = require('discord.js');
const { embed, isAdmin } = require('../utils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('thongbao')
    .setDescription('(Admin) Đăng thông báo dạng embed')
    .addStringOption((o) => o.setName('noidung').setDescription('Nội dung thông báo').setRequired(true))
    .addChannelOption((o) => o.setName('kenh').setDescription('Kênh đăng (mặc định: kênh này)')),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ content: 'Lệnh này chỉ dành cho Admin/Mod.', ephemeral: true });
    }
    const channel = interaction.options.getChannel('kenh') || interaction.channel;
    await channel.send({
      embeds: [embed('Thông báo', interaction.options.getString('noidung'), 0xeb459e)],
    });
    return interaction.reply({ content: 'Đã đăng thông báo vào ' + channel.toString(), ephemeral: true });
  },
};
