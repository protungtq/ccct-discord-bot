'use strict';
const db = require('../database');

// Khóa role theo chiến dịch: { campaign: [{ id, name }] }.
// Chiến dịch không có khóa = mở cho mọi người (giữ nguyên hành vi cũ).
function gates() {
  if (!db.data.giftcodeRoles) db.data.giftcodeRoles = {};
  return db.data.giftcodeRoles;
}

function gateRoles(campaign) {
  return gates()[campaign || 'OB'] || [];
}

// Đặt lại toàn bộ khóa của chiến dịch thành đúng các role cho trước.
function setGate(campaign, roles) {
  campaign = campaign || 'OB';
  gates()[campaign] = roles.map((r) => ({ id: String(r.id), name: String(r.name) }));
  db.save();
  return gates()[campaign];
}

function clearGate(campaign) {
  campaign = campaign || 'OB';
  delete gates()[campaign];
  db.save();
}

function addCodes(codes, campaign) {
  let added = 0;
  for (const raw of codes) {
    const code = String(raw).trim();
    if (!code) continue;
    if (db.data.giftcodes.some((g) => g.code === code)) continue;
    db.data.giftcodes.push({ code, campaign: campaign || 'OB', claimedBy: '', claimedAt: 0 });
    added++;
  }
  if (added) db.save();
  return added;
}

function remaining(campaign) {
  return db.data.giftcodes.filter(
    (g) => (!campaign || g.campaign === campaign) && !g.claimedBy
  ).length;
}

// Trả về { ok:true, code } hoặc { ok:false, reason }.
// reason: 'da-nhan' | 'thieu-role' | 'het-code'.
// memberRoleIds: mảng role ID của người nhận (lấy từ interaction.member).
// Không truyền memberRoleIds = bỏ qua kiểm tra khóa (dùng cho test/back-compat).
function claim(userId, campaign, memberRoleIds) {
  campaign = campaign || 'OB';
  const claims = db.data.claims[userId] || (db.data.claims[userId] = {});
  if (claims[campaign]) return { ok: false, reason: 'da-nhan', code: claims[campaign] };
  const gate = gateRoles(campaign);
  if (gate.length && Array.isArray(memberRoleIds)) {
    const hasRole = gate.some((r) => memberRoleIds.includes(r.id));
    if (!hasRole) return { ok: false, reason: 'thieu-role', roles: gate };
  }
  const slot = db.data.giftcodes.find((g) => g.campaign === campaign && !g.claimedBy);
  if (!slot) return { ok: false, reason: 'het-code' };
  slot.claimedBy = userId;
  slot.claimedAt = Date.now();
  claims[campaign] = slot.code;
  db.save();
  return { ok: true, code: slot.code };
}

module.exports = { addCodes, remaining, claim, gateRoles, setGate, clearGate };
