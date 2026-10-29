'use strict';
const { Events, ActivityType } = require('discord.js');
const db = require('../database');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log('[bot] Đăng nhập thành công: ' + client.user.tag);
    console.log('[bot] Đang phục vụ ' + client.guilds.cache.size + ' server');
    client.user.setActivity('CCCT | /trogiup', { type: ActivityType.Playing });
    // Sao lưu dữ liệu theo ngày: 1 bản lúc khởi động + kiểm tra mỗi giờ
    // (để qua ngày mới khi bot đang chạy vẫn có bản mới). Chỉ giữ 14 bản.
    const daily = db.backup();
    if (daily) console.log('[bot] Đã lưu bản sao lưu: ' + daily);
    setInterval(() => {
      try {
        db.backup();
      } catch (e) {}
    }, 60 * 60 * 1000);
    // Cache lời mời để đối chiếu khi có member mới (invite tracking)
    client.inviteCache = new Map();
    for (const guild of client.guilds.cache.values()) {
      // Chẩn đoán: bot tự báo role và quyền thật của nó trong server
      const me = guild.members.me;
      if (me) {
        console.log(
          '[bot] Quyền tại ' + guild.name + ': Admin=' + me.permissions.has('Administrator') +
          ', ManageGuild=' + me.permissions.has('ManageGuild') +
          ', Roles=[' + me.roles.cache.map((r) => r.name).join(', ') + ']'
        );
      }
      try {
        const invites = await guild.invites.fetch();
        client.inviteCache.set(guild.id, new Map(invites.map((i) => [i.code, i.uses])));
      } catch (e) {
        console.warn('[bot] Không đọc được invites của ' + guild.name + ' (mã lỗi ' + e.code + ': ' + e.message + ')');
      }
    }
  },
};
