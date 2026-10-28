'use strict';
const { Events } = require('discord.js');
const db = require('../database');
const config = require('../config');
const { embed, isAdmin, modLog } = require('../utils');

const flood = new Map(); // userId -> [timestamps]

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    // --- Mini game đoán số: tin nhắn là một số nguyên trong kênh đang chơi ---
    const game = db.data.games[message.channelId];
    if (game && game.type === 'doanso' && /^\d+$/.test(message.content.trim())) {
      const guess = parseInt(message.content.trim(), 10);
      if (guess >= 1 && guess <= game.max) {
        if (guess === game.secret) {
          const rec = db.user(message.author.id);
          rec.xp += 100;
          delete db.data.games[message.channelId];
          db.save();
          await message.channel.send({
            embeds: [
              embed(
                'Đoán số: có người thắng!',
                message.author.toString() +
                  ' đã đoán đúng số bí mật **' +
                  game.secret +
                  '** và nhận 100 XP!',
                0xf59e0b
              ),
            ],
          });
        } else {
          await message
            .reply(guess < game.secret ? 'Số bí mật LỚN hơn ' + guess : 'Số bí mật NHỎ hơn ' + guess)
            .catch(() => {});
        }
        return;
      }
    }

    // --- Lọc link (khi bật) ---
    if (config.linkFilter && /https?:\/\//i.test(message.content) && !isAdmin(message.member)) {
      await message.delete().catch(() => {});
      modLog(message.guild, 'Đã xóa tin chứa link của ' + message.author.tag);
      return;
    }

    // --- Chống spam: >5 tin trong 5 giây -> timeout 60 giây ---
    const key = message.guild.id + ':' + message.author.id;
    const now = Date.now();
    const arr = (flood.get(key) || []).filter((t) => now - t < 5000);
    arr.push(now);
    flood.set(key, arr);
    if (arr.length > 5) {
      flood.delete(key);
      if (message.member && message.member.moderatable) {
        await message.member.timeout(60 * 1000, 'Spam tin nhắn').catch(() => {});
        modLog(message.guild, 'Timeout 60s ' + message.author.tag + ' vì spam');
      }
      return;
    }

    // --- XP theo tin nhắn (cooldown) ---
    const rec = db.user(message.author.id);
    if (now - rec.lastXpAt >= config.xpCooldownMs) {
      const [min, max] = config.xpPerMessage;
      rec.xp += Math.floor(min + Math.random() * (max - min + 1));
      rec.lastXpAt = now;
      db.save();
    }
  },
};
