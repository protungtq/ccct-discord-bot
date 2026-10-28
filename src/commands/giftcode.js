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
        .addStringOption((o) => o.setName('chiendich').setDescription('Tên chiến dịch (mặc định: OB)'))
    )
    .addSubcommand((s) =>
      s
        .setName('khoa')
        .setDescription('(Admin) Khóa chiến dịch theo role: chỉ role này mới nhận được')
        .addStringOption((o) => o.setName('chiendich').setDescription('Tên chiến dịch (mặc định: OB)'))
        .addRoleOption((o) => o.setName('role').setDescription('Role được nhận').setRequired(true))
        .addRoleOption((o) => o.setName('role2').setDescription('Role được nhận thêm (không bắt buộc)'))
        .addRoleOption((o) => o.setName('role3').setDescription('Role được nhận thêm (không bắt buộc)'))
    )
    .addSubcommand((s) =>
      s.setName('mokhoa').setDescription('(Admin) Mở khóa chiến dịch: mọi người đều nhận được')
        .addStringOption((o) => o.setName('chiendich').setDescription('Tên chiến dịch (mặc định: OB)'))
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const campaign = interaction.options.getString('chiendich') || 'OB';
    const memberRoleIds = interaction.member
      ? [...interaction.member.roles.cache.keys()]
      : [];
    const gateText = () => {
      const gate = service.gateRoles(campaign);
      return gate.length ? ' — chỉ dành cho role: ' + gate.map((r) => r.name).join(', ') : '';
    };

    if (sub === 'nhan') {
      const res = service.claim(interaction.user.id, campaign, memberRoleIds);
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
            : res.reason === 'thieu-role'
              ? 'Chiến dịch ' + campaign + gateText() + '. Bạn chưa có role này nên chưa nhận được.'
              : 'Đã phát hết giftcode chiến dịch ' + campaign + '. Chờ đợi đợt tiếp theo nhé!',
        ephemeral: true,
      });
    }

    if (sub === 'conlai') {
      return interaction.reply({
        content: 'Giftcode chiến dịch **' + campaign + '** còn lại: **' + service.remaining(campaign) + '** mã.' + gateText(),
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
      const customId = campaign === 'OB' ? 'gc_claim' : 'gc_claim:' + campaign;
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(customId).setLabel('Nhận giftcode').setStyle(ButtonStyle.Success)
      );
      await interaction.channel.send({
        embeds: [
          embed('Nhận giftcode tại đây', 'Nhấn nút bên dưới để nhận giftcode (chiến dịch ' + campaign + '). Mỗi tài khoản nhận 1 mã, mã sẽ gửi riêng cho bạn.' + gateText(), 0x57f287),
        ],
        components: [row],
      });
      return interaction.reply({ content: 'Đã đăng panel giftcode.', ephemeral: true });
    }
    if (sub === 'khoa') {
      const roles = ['role', 'role2', 'role3']
        .map((n) => interaction.options.getRole(n))
        .filter(Boolean);
      const gate = service.setGate(campaign, roles);
      return interaction.reply({
        content: 'Đã khóa chiến dịch **' + campaign + '**: chỉ role ' + gate.map((r) => r.name).join(', ') + ' mới nhận được. Kho hiện còn: ' + service.remaining(campaign) + ' mã.',
        ephemeral: true,
      });
    }
    if (sub === 'mokhoa') {
      service.clearGate(campaign);
      return interaction.reply({
        content: 'Đã mở khóa chiến dịch **' + campaign + '**: mọi người đều nhận được. Kho hiện còn: ' + service.remaining(campaign) + ' mã.',
        ephemeral: true,
      });
    }
  },
};
