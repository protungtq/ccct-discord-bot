'use strict';
// Sao lưu tự động mỗi tối: vào khung giờ đã đặt (mặc định 23h giờ VN),
// bot lưu dữ liệu mới nhất, lưu 1 bản theo ngày trên server, rồi gửi file
// db.json thẳng qua tin nhắn riêng (DM) cho chủ server. Nếu không DM được
// (chủ server khóa DM từ thành viên server) thì gửi vào #mod-chat.
// Ngày đã gửi được ghi vào dữ liệu (autoBackupSent) để bot khởi động lại
// trong cùng khung giờ cũng không gửi trùng.
const fs = require('fs');
const { AttachmentBuilder } = require('discord.js');
const db = require('../database');
const config = require('../config');
const { todayVN, findModChannel } = require('../utils');

function vnHour(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: config.timezone,
    hour: '2-digit',
    hour12: false,
  }).formatToParts(date);
  return Number(parts.find((p) => p.type === 'hour').value);
}

// Hàm thuần để test: chỉ gửi khi đúng giờ đã đặt và hôm nay chưa gửi
function shouldAutoBackup(vnDateStr, hour, lastSentDate) {
  return hour === config.autoBackupHour && vnDateStr !== lastSentDate;
}

async function tick(client) {
  try {
    const today = todayVN();
    if (!shouldAutoBackup(today, vnHour(new Date()), db.data.autoBackupSent || '')) return;
    try {
      db.save();
    } catch (e) {}
    db.backup();
    if (!fs.existsSync(db.file)) return;
    const file = new AttachmentBuilder(db.file, { name: 'db-' + today + '.json' });
    const guild = config.guildId
      ? client.guilds.cache.get(config.guildId)
      : client.guilds.cache.first();
    if (!guild) return;
    const content =
      'Sao lưu tự động 23h ngày ' +
      today +
      '. File dữ liệu bot — chứa cả mã giftcode chưa phát, bố giữ riêng, đừng chuyển tiếp.';
    let sent = false;
    try {
      const owner = await client.users.fetch(guild.ownerId);
      await owner.send({ content, files: [file] });
      sent = true;
    } catch (e) {
      // Không DM được thì gửi vào #mod-chat
    }
    if (!sent) {
      const modCh = findModChannel(guild);
      if (modCh) {
        await modCh.send({ content: content + ' (Không DM được cho chủ server nên gửi vào đây.)', files: [file] });
        sent = true;
      }
    }
    if (sent) {
      db.data.autoBackupSent = today;
      db.save();
      console.log('[bot] Đã gửi sao lưu tự động ngày ' + today);
    }
  } catch (e) {
    console.warn('[bot] Sao lưu tự động thất bại: ' + e.message);
  }
}

function startAutoBackup(client) {
  // Kiểm tra mỗi phút; tick ngay lúc khởi động để bot bật lên trong khung
  // 23h vẫn gửi bù trong đêm đó
  setInterval(() => tick(client), 60 * 1000);
  tick(client);
}

module.exports = { startAutoBackup, shouldAutoBackup, vnHour };
