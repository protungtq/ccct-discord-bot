'use strict';
// Đồng bộ avatar của bot từ file ảnh đi kèm repo:
//   - Ưu tiên assets/avatar.png nếu có;
//   - Nếu không, giải mã assets/avatar.b64 (base64) — dạng này dùng khi
//     đẩy ảnh qua kênh chỉ nhận file chữ.
// Chỉ gọi API đổi avatar khi nội dung ảnh thay đổi (đối chiếu md5 đã lưu
// trong db), để bot restart bao nhiêu lần cũng không chạm giới hạn đổi
// avatar của Discord. Lỗi ở bước này không được làm bot dừng.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('../database');

const ASSETS_DIR = path.join(__dirname, '..', '..', 'assets');

function loadAvatarBuffer() {
  const pngPath = path.join(ASSETS_DIR, 'avatar.png');
  if (fs.existsSync(pngPath)) return fs.readFileSync(pngPath);
  const b64Path = path.join(ASSETS_DIR, 'avatar.b64');
  if (fs.existsSync(b64Path)) {
    return Buffer.from(fs.readFileSync(b64Path, 'utf8').trim(), 'base64');
  }
  return null;
}

async function syncAvatar(client) {
  try {
    const buf = loadAvatarBuffer();
    if (!buf || !buf.length) return;
    const hash = crypto.createHash('md5').update(buf).digest('hex');
    if (db.data.botAvatarHash === hash) return;
    await client.user.setAvatar(buf);
    db.data.botAvatarHash = hash;
    db.save();
    console.log('[bot] Đã cập nhật avatar bot từ file assets/ (md5 ' + hash.slice(0, 8) + ')');
  } catch (e) {
    console.warn('[bot] Không cập nhật được avatar: ' + e.message);
  }
}

module.exports = { syncAvatar };
