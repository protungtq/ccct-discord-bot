'use strict';
require('dotenv').config();

function idList(v) {
  return (v || '').split(',').map((s) => s.trim()).filter(Boolean);
}

module.exports = {
  token: process.env.DISCORD_TOKEN || '',
  clientId: process.env.CLIENT_ID || '',
  guildId: process.env.GUILD_ID || '',
  welcomeChannelId: process.env.WELCOME_CHANNEL_ID || '',
  modLogChannelId: process.env.MOD_LOG_CHANNEL_ID || '',
  ticketCategoryId: process.env.TICKET_CATEGORY_ID || '',
  linkFilter: (process.env.LINK_FILTER || 'off').toLowerCase() === 'on',
  adminRoles: idList(process.env.ADMIN_ROLES || 'Admin,Mod'),
  autoBackupHour: Number(process.env.AUTO_BACKUP_HOUR || 23), // giờ VN gửi sao lưu tự động
  timezone: 'Asia/Ho_Chi_Minh',
  // XP: mỗi tin nhắn hợp lệ nhận ngẫu nhiên trong khoảng này, cooldown 60s
  xpPerMessage: [15, 25],
  xpCooldownMs: 60 * 1000,
  checkinXp: 50, // XP thưởng điểm danh + streak * 5 (tối đa +50)
  dataFile: require('path').join(__dirname, '..', 'data', 'db.json'),
};
