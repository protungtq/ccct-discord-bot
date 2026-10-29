'use strict';
// Smoke test: nạp tất cả module, chạy thử logic giftcode + utils (không cần token)
const fs = require('fs');
const os = require('os');
const path = require('path');

let pass = 0;
function ok(name) {
  pass++;
  console.log('  OK - ' + name);
}

// 1) Nạp commands + events
const cmdDir = path.join(__dirname, '..', 'src', 'commands');
const commands = fs.readdirSync(cmdDir).filter((f) => f.endsWith('.js'));
for (const f of commands) {
  const cmd = require(path.join(cmdDir, f));
  if (!cmd.data || typeof cmd.execute !== 'function') throw new Error('Command lỗi: ' + f);
  ok('command ' + cmd.data.name);
}
const evDir = path.join(__dirname, '..', 'src', 'events');
for (const f of fs.readdirSync(evDir).filter((x) => x.endsWith('.js'))) {
  const ev = require(path.join(evDir, f));
  if (!ev.name || typeof ev.execute !== 'function') throw new Error('Event lỗi: ' + f);
  ok('event ' + f);
}

// 2) Utils
const utils = require('../src/utils');
if (!/^\d{4}-\d{2}-\d{2}$/.test(utils.todayVN())) throw new Error('todayVN sai định dạng');
if (utils.levelFromXp(0) !== 0 || utils.levelFromXp(100) !== 1 || utils.levelFromXp(400) !== 2)
  throw new Error('levelFromXp sai');
ok('utils (todayVN, levelFromXp)');

// 3) Database + giftcode trên file tạm
const db = require('../src/database');
const tmp = path.join(os.tmpdir(), 'ccct-bot-check-' + Date.now() + '.json');
db.file = tmp;
db.data = { users: {}, giftcodes: [], claims: {}, games: {}, tickets: {}, giftcodeRoles: {} };
db.save();
const gc = require('../src/services/giftcode');
if (gc.addCodes(['CODE1', 'CODE2', 'CODE1'], 'OB') !== 2) throw new Error('addCodes sai');
if (gc.remaining('OB') !== 2) throw new Error('remaining sai');
const c1 = gc.claim('userA', 'OB');
if (!c1.ok) throw new Error('claim lần 1 thất bại');
const c2 = gc.claim('userA', 'OB');
if (c2.ok || c2.reason !== 'da-nhan') throw new Error('claim trùng không bị chặn');
const c3 = gc.claim('userB', 'OB');
if (!c3.ok || c3.code === c1.code) throw new Error('2 người nhận trùng mã');
const c4 = gc.claim('userC', 'OB');
if (c4.ok || c4.reason !== 'het-code') throw new Error('hết code không báo đúng');
ok('giftcode service (nạp/nhận/chặn trùng/hết kho)');
// 4) Khóa role giftcode: chưa có role thì bị chặn, có role thì nhận được, mở khóa thì lại mở
gc.addCodes(['G1', 'G2', 'G3'], 'VIP');
gc.setGate('VIP', [{ id: 'role-tuong-quan', name: 'Tướng quân' }]);
const g1 = gc.claim('userX', 'VIP', ['role-quan-si']);
if (g1.ok || g1.reason !== 'thieu-role') throw new Error('khóa role không chặn người lạ');
const g2 = gc.claim('userX', 'VIP', ['role-tuong-quan']);
if (!g2.ok) throw new Error('người có role không nhận được code');
const g3 = gc.claim('userY', 'VIP');
if (!g3.ok) throw new Error('claim không truyền roles phải giữ hành vi cũ (mở)');
gc.clearGate('VIP');
const g4 = gc.claim('userZ', 'VIP', ['role-quan-si']);
if (!g4.ok) throw new Error('mở khóa xong phải nhận được');
ok('giftcode khóa role (chặn/thông/mở khóa)');
fs.unlinkSync(tmp);
// 5) Backup theo ngày: lưu vào thư mục tạm, backup phải tạo được bản copy đúng ngày
const tmpDir = path.join(os.tmpdir(), 'ccct-bot-check-' + Date.now());
db.file = path.join(tmpDir, 'db.json');
db.data = { users: {}, giftcodes: [], claims: {}, games: {}, tickets: {}, giftcodeRoles: {} };
db.save();
const backupPath = db.backup();
const expectBackup = path.join(tmpDir, 'backups', 'db-' + utils.todayVN() + '.json');
if (backupPath !== expectBackup || !fs.existsSync(expectBackup)) throw new Error('backup không tạo đúng file ngày');
if (fs.readFileSync(expectBackup, 'utf8') !== fs.readFileSync(db.file, 'utf8')) throw new Error('backup lệch nội dung');
// Giữ tối đa 14 bản: tạo thêm 15 bản cũ rồi backup lại, bản cũ nhất phải bị xóa
for (let i = 1; i <= 15; i++) {
  fs.writeFileSync(path.join(tmpDir, 'backups', 'db-2025-01-' + String(i).padStart(2, '0') + '.json'), '{}');
}
db.backup();
const kept = fs.readdirSync(path.join(tmpDir, 'backups')).filter((f) => f.startsWith('db-'));
if (kept.length > 14 || fs.existsSync(path.join(tmpDir, 'backups', 'db-2025-01-01.json')))
  throw new Error('backup không dọn bản cũ');
fs.rmSync(tmpDir, { recursive: true, force: true });
ok('backup theo ngày (tạo bản copy + dọn bản cũ quá 14)');
// 6) Sao lưu tự động: chỉ gửi đúng giờ 23h và khi hôm nay chưa gửi
const ab = require('../src/services/autobackup');
const today = utils.todayVN();
if (!ab.shouldAutoBackup(today, 23, '')) throw new Error('23h chưa gửi phải cho gửi');
if (ab.shouldAutoBackup(today, 23, today)) throw new Error('23h đã gửi rồi phải chặn');
if (ab.shouldAutoBackup(today, 22, '')) throw new Error('22h không được gửi');
if (ab.shouldAutoBackup(today, 10, '')) throw new Error('10h sáng không được gửi');
ok('sao lưu tự động (đúng giờ + chống gửi trùng)');

console.log('\nTẤT CẢ ' + pass + ' MỤC KIỂM TRA ĐỀU QUA');
