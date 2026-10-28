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
db.data = { users: {}, giftcodes: [], claims: {}, games: {}, tickets: {} };
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
fs.unlinkSync(tmp);

console.log('\nTẤT CẢ ' + pass + ' MỤC KIỂM TRA ĐỀU QUA');
