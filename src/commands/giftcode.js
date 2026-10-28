'use strict';
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const service = require('../services/giftcode');
const { embed, isAdmin } = require('../utils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giftcode')
    .setDescription('Giftcode cộng đồng')
    .addSubcommand((s) =>
      s
        .setName('nhan')
        .setDescription('Nhận giftcode của bạn (mỗi người 1 mã)')
        .addStringOption((o) => o.setName('chiendich').setDescription('Tên chiến dịch (mặc định: OB)'))
    )
    .addSubcommand((s) =>
      s
        .setName('them')
        .setDescription('(Admin) Nạp thêm giftcode vào kho')
        .addStringOption((o) =>
          o.setName('codes').setDescription('Các mã, cách nhau bằng dấu phẩy').setRequired(true)
        )
        .addStringOption((o) => o.setName('chiendich').setDescription('Tên chiến dịch (mặc định: OB)'))
    )
    .addSubcommand((s) =>
      s.setName('conlai').setDescription('Xem số giftcode còn lại')
        .addStringOption((o) => o.setName('chiendich').setDescription('Tên chiến dịch (mặc định: OB)'))
    )
    .addSubcommand((s) =>
      s.setName('panel').setDescription('(Admin) Đăng bảng nút nhận giftcode vào kênh này')
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const campaign = interaction.options.getString('chiendich') || 'OB';

    if (sub === 'nhan') {
      const res = service.claim(interaction.user.id, campaign);
      if (res.ok) {
        return interaction.reply({
          embeds: [embed('Giftcode của bạn', 'Mã: **' + res.code + '** (chiến dịch ' + campaign + ')\nGiữ kín mã này nhé!', 0x57f287)],
          ephemeral: true,
        });
      }
      return interaction.reply({
        content:
          res.reason === 'da-nhan'
            ? 'Bạn đã nhận rồi: **' + res.code + '**'
            : 'Đã phát hết giftcode chiến dịch ' + campaign + '. Chờ đợi đợt tiếp theo nhé!',
        ephemeral: true,
      });
    }

    if (sub === 'conlai') {
      return interaction.reply({
        content: 'Giftcode chiến dịch **' + campaign + '** còn lại: **' + service.remaining(campaign) + '** mã.',
        ephemeral: !isAdmin(interaction.member),
      });
    }

    if (!isAdmin(interaction.member)) {
      return interaction.reply({ content: 'Lệnh này chỉ dành cho Admin/Mod.', ephemeral: true });
    }
    if (sub === 'them') {
      const codes = interaction.options.getString('codes').split(/[\s,]+/);
      const added = service.addCodes(codes, campaign);
      return interaction.reply({
        content: 'Đã nạp **' + added + '** mã vào chiến dịch ' + campaign + '. Kho hiện còn: ' + service.remaining(campaign) + ' mã.',
        ephemeral: true,
      });
    }
    if (sub === 'panel') {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('gc_claim').setLabel('Nhận giftcode').setStyle(ButtonStyle.Success)
      );
      await interaction.channel.send({
        embeds: [
          embed('Nhận giftcode tại đây', 'Nhấn nút bên dưới để nhận giftcode. Mỗi tài khoản nhận 1 mã, mã sẽ gửi riêng cho bạn.', 0x57f287),
        ],
        components: [row],
      });
      return interaction.reply({ content: 'Đã đăng panel giftcode.', ephemeral: true });
    }
  },
};
