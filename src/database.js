'use strict';
// Lớp dữ liệu đơn giản bằng file JSON (ghi atomic: file tạm + rename).
// Quy mô cộng đồng vài trăm/thousand member chạy tốt. Khi cần lớn hơn,
// thay lớp này bằng SQLite mà không đổi các module khác (chúng chỉ dùng
// db.data + db.save()).

const fs = require('fs');
const path = require('path');
const config = require('./config');

const EMPTY = () => ({
  users: {},      // userId -> { xp, lastXpAt, checkin:{lastDate,streak,total}, invites, invitedBy }
  giftcodes: [],  // { code, campaign, claimedBy, claimedAt }
  claims: {},     // userId -> { campaign: code }
  giftcodeRoles: {}, // campaign -> [{ id, name }] (khóa role; rỗng = mở cho mọi người)
  games: {},      // channelId -> { type:'doanso', secret, max, startedBy, startedAt }
  tickets: {},    // channelId -> { userId, openedAt }
});

class Database {
  constructor(file) {
    this.file = file || config.dataFile;
    this.data = EMPTY();
    this.load();
  }
  load() {
    try {
      const raw = fs.readFileSync(this.file, 'utf8');
      const parsed = JSON.parse(raw);
      this.data = Object.assign(EMPTY(), parsed);
    } catch (e) {
      this.data = EMPTY();
    }
  }
  save() {
    const dir = path.dirname(this.file);
    fs.mkdirSync(dir, { recursive: true });
    const tmp = this.file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), 'utf8');
    fs.renameSync(tmp, this.file);
  }
  // Lưu 1 bản copy theo ngày (giờ VN) vào data/backups/, chỉ giữ 14 bản mới nhất.
  // Trả về đường dẫn bản backup, hoặc null nếu chưa có file dữ liệu.
  backup() {
    try {
      const dir = path.join(path.dirname(this.file), 'backups');
      fs.mkdirSync(dir, { recursive: true });
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: config.timezone }).format(new Date());
      const dest = path.join(dir, 'db-' + today + '.json');
      fs.copyFileSync(this.file, dest);
      const files = fs
        .readdirSync(dir)
        .filter((f) => /^db-\d{4}-\d{2}-\d{2}\.json$/.test(f))
        .sort();
      while (files.length > 14) {
        fs.unlinkSync(path.join(dir, files.shift()));
      }
      return dest;
    } catch (e) {
      return null;
    }
  }
  user(id) {
    if (!this.data.users[id]) {
      this.data.users[id] = {
        xp: 0,
        lastXpAt: 0,
        checkin: { lastDate: '', streak: 0, total: 0 },
        invites: 0,
        invitedBy: '',
      };
    }
    return this.data.users[id];
  }
}

module.exports = new Database();
