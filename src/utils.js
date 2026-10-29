'use strict';
const { EmbedBuilder } = require('discord.js');
const config = require('./config');

// Ngày hiện tại theo giờ Việt Nam, định dạng YYYY-MM-DD
function todayVN() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: config.timezone }).format(new Date());
}
function dateVN(offsetDays) {
  const d = new Date(Date.now() + (offsetDays || 0) * 86400000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: config.timezone }).format(d);
}
function levelFromXp(xp) {
  // Level n cần tổng XP = 100 * n^2
  return Math.floor(Math.sqrt(xp / 100));
}
function xpForNextLevel(xp) {
  const lv = levelFromXp(xp);
  return 100 * (lv + 1) * (lv + 1);
}
function isAdmin(member) {
  if (!member) return false;
  if (member.permissions && member.permissions.has('Administrator')) return true;
  return member.roles && member.roles.cache
    ? member.roles.cache.some((r) => config.adminRoles.includes(r.name))
    : false;
}
function embed(title, description, color) {
  const e = new EmbedBuilder()
    .setTitle(title)
    .setColor(color || 0x5865f2)
    .setTimestamp();
  if (description) e.setDescription(description);
  return e;
}
function modLog(guild, text) {
  const id = config.modLogChannelId;
  if (!id) return;
  const ch = guild.channels.cache.get(id);
  if (ch && ch.isTextBased()) ch.send(text).catch(() => {});
}
// Tìm kênh mod: ưu tiên MOD_LOG_CHANNEL_ID, nếu chưa đặt thì tìm kênh tên mod-chat
function findModChannel(guild) {
  if (config.modLogChannelId) {
    const ch = guild.channels.cache.get(config.modLogChannelId);
    if (ch && ch.isTextBased()) return ch;
  }
  return guild.channels.cache.find((c) => c.isTextBased() && c.name === 'mod-chat') || null;
}
module.exports = { todayVN, dateVN, levelFromXp, xpForNextLevel, isAdmin, embed, modLog, findModChannel };
