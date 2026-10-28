'use strict';
const { Events } = require('discord.js');
const tickets = require('../services/tickets');
const giftcodeService = require('../services/giftcode');
const { embed } = require('../utils');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    try {
      if (interaction.isChatInputCommand()) {
        const cmd = client.commands.get(interaction.commandName);
        if (!cmd) return;
        await cmd.execute(interaction, client);
        return;
      }
      if (interaction.isButton()) {
        if (interaction.customId === 'ticket_open') return tickets.openTicket(interaction);
        if (interaction.customId === 'ticket_close') return tickets.closeTicket(interaction);
        if (interaction.customId === 'gc_claim' || interaction.customId.startsWith('gc_claim:')) {
          const campaign = interaction.customId === 'gc_claim' ? 'OB' : interaction.customId.slice('gc_claim:'.length);
          const memberRoleIds = interaction.member ? [...interaction.member.roles.cache.keys()] : [];
          const res = giftcodeService.claim(interaction.user.id, campaign, memberRoleIds);
          if (res.ok) {
            // Gửi code qua tin nhắn riêng (ephemeral), không lộ ra kênh công cộng
            return interaction.reply({
              embeds: [
                embed('Giftcode của bạn', 'Mã của bạn: **' + res.code + '**\nGiữ kín mã này nhé!', 0x57f287),
              ],
              ephemeral: true,
            });
          }
          const gate = giftcodeService.gateRoles(campaign);
          const msg =
            res.reason === 'da-nhan'
              ? 'Bạn đã nhận giftcode rồi: **' + res.code + '**'
              : res.reason === 'thieu-role'
                ? 'Chiến dịch ' + campaign + ' chỉ dành cho role: ' + gate.map((r) => r.name).join(', ') + '. Bạn chưa có role này nên chưa nhận được.'
                : 'Đã phát hết giftcode đợt này. Chờ đợi đợt tiếp theo nhé!';
          return interaction.reply({ content: msg, ephemeral: true });
        }
      }
    } catch (err) {
      console.error('[bot] Lỗi xử lý interaction:', err);
      const payload = { content: 'Có lỗi xảy ra, thử lại sau nhé.', ephemeral: true };
      if (interaction.replied || interaction.deferred) interaction.followUp(payload).catch(() => {});
      else interaction.reply(payload).catch(() => {});
    }
  },
};
