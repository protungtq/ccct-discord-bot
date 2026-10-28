'use strict';
const db = require('../database');

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

// Trả về { ok:true, code } hoặc { ok:false, reason }
function claim(userId, campaign) {
  campaign = campaign || 'OB';
  const claims = db.data.claims[userId] || (db.data.claims[userId] = {});
  if (claims[campaign]) return { ok: false, reason: 'da-nhan', code: claims[campaign] };
  const slot = db.data.giftcodes.find((g) => g.campaign === campaign && !g.claimedBy);
  if (!slot) return { ok: false, reason: 'het-code' };
  slot.claimedBy = userId;
  slot.claimedAt = Date.now();
  claims[campaign] = slot.code;
  db.save();
  return { ok: true, code: slot.code };
}

module.exports = { addCodes, remaining, claim };
