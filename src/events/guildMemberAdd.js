'use strict';
const { Events } = require('discord.js');
const db = require('../database');
const config = require('../config');
const { embed } = require('../utils');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member, client) {
    // --- Gán credit mời bạn: đối chiếu invites trước/sau ---
    try {
      const cached = client.inviteCache && client.inviteCache.get(member.guild.id);
      const now = await member.guild.invites.fetch();
      if (cached) {
        const used = now.find((inv) => (cached.get(inv.code) || 0) < inv.uses);
        if (used && used.inviter && !used.inviter.bot) {
          const rec = db.user(member.id);
          rec.invitedBy = used.inviter.id;
          db.user(used.inviter.id).invites += 1;
          db.save();
        }
      }
      if (client.inviteCache) {
        client.inviteCache.set(member.guild.id, new Map(now.map((i) => [i.code, i.uses])));
      }
    } catch (e) {
      // Không có quyền đọc invites thì bỏ qua, không chặn welcome
    }

    // --- Tin nhắn chào mừng ---
    let channel = null;
    if (config.welcomeChannelId) channel = member.guild.channels.cache.get(config.welcomeChannelId);
    if (!channel) {
      channel =
        member.guild.systemChannel ||
        member.guild.channels.cache.find(
          (c) => c.isTextBased() && /(chao-mung|welcome|chem-gio|thong-bao)/i.test(c.name)
        );
    }
    if (channel && channel.isTextBased()) {
      const e = embed(
        'Chào mừng thành viên mới!',
        'Xin chào ' +
          member.toString() +
          '! Ta là Điêu Thuyền, bot nhà của cộng đồng CCCT. 🏯\nLên Quân sĩ rồi thì nhớ /diemdanh mỗi ngày để tích XP lên cấp, đua top mời bạn và săn giftcode nhé.\nCần hỗ trợ thì mở ticket, đội Mưu sĩ trực mỗi ngày nhé!',
        0x57f287
      ).setThumbnail(member.user.displayAvatarURL());
      channel.send({ embeds: [e] }).catch(() => {});
    }
  },
};
