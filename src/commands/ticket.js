'use strict';
const { SlashCommandBuilder } = require('discord.js');
const tickets = require('../services/tickets');
const { isAdmin } = require('../utils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Hệ thống ticket hỗ trợ')
    .addSubcommand((s) => s.setName('panel').setDescription('(Admin) Đăng bảng mở ticket vào kênh này')),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) {
      return interaction.reply({ content: 'Lệnh này chỉ dành cho Admin/Mod.', ephemeral: true });
    }
    await interaction.channel.send(tickets.panel());
    return interaction.reply({ content: 'Đã đăng panel ticket.', ephemeral: true });
  },
};
