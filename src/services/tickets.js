'use strict';
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');
const db = require('../database');
const config = require('../config');
const { embed, modLog } = require('../utils');

function staffOverwrites(guild) {
  const list = [];
  for (const name of config.adminRoles) {
    const role = guild.roles.cache.find((r) => r.name === name);
    if (role) {
      list.push({
        id: role.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      });
    }
  }
  return list;
}

async function openTicket(interaction) {
  const existing = Object.entries(db.data.tickets).find(
    ([, t]) => t.userId === interaction.user.id
  );
  if (existing) {
    return interaction.reply({
      content: 'Bạn đang có ticket mở: <#' + existing[0] + '>',
      ephemeral: true,
    });
  }
  const guild = interaction.guild;
  let category = config.ticketCategoryId
    ? guild.channels.cache.get(config.ticketCategoryId)
    : guild.channels.cache.find(
        (c) => c.type === ChannelType.GuildCategory && /ticket/i.test(c.name)
      );
  if (!category) {
    category = await guild.channels.create({
      name: 'Tickets',
      type: ChannelType.GuildCategory,
    });
  }
  const channel = await guild.channels.create({
    name: 'ticket-' + interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, ''),
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: interaction.user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      },
      {
        id: guild.members.me.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      },
      ...staffOverwrites(guild),
    ],
  });
  db.data.tickets[channel.id] = { userId: interaction.user.id, openedAt: Date.now() };
  db.save();
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('Đóng ticket')
      .setStyle(ButtonStyle.Danger)
  );
  await channel.send({
    content: '<@' + interaction.user.id + '>',
    embeds: [
      embed(
        'Ticket hỗ trợ',
        'Cảm ơn bạn đã liên hệ. Đội ngũ hỗ trợ sẽ phản hồi tại đây.\nNhấn nút bên dưới để đóng ticket khi xong việc.',
        0x57f287
      ),
    ],
    components: [row],
  });
  modLog(guild, 'Ticket mới: ' + channel.toString() + ' bởi <@' + interaction.user.id + '>');
  return interaction.reply({
    content: 'Đã tạo ticket: ' + channel.toString(),
    ephemeral: true,
  });
}

async function closeTicket(interaction) {
  const info = db.data.tickets[interaction.channelId];
  if (!info) {
    return interaction.reply({ content: 'Đây không phải kênh ticket.', ephemeral: true });
  }
  delete db.data.tickets[interaction.channelId];
  db.save();
  modLog(
    interaction.guild,
    'Ticket ' + interaction.channel.name + ' đã đóng bởi ' + interaction.user.tag
  );
  await interaction.reply('Ticket sẽ đóng sau 5 giây. Cảm ơn bạn!');
  setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
}

function panel() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_open')
      .setLabel('Mở ticket hỗ trợ')
      .setStyle(ButtonStyle.Primary)
  );
  return {
    embeds: [
      embed(
        'Hỗ trợ & hợp tác',
        'Cần hỗ trợ hoặc muốn liên hệ hợp tác (partner), nhấn nút bên dưới để mở ticket riêng với đội ngũ quản trị.',
        0x5865f2
      ),
    ],
    components: [row],
  };
}

module.exports = { openTicket, closeTicket, panel };
