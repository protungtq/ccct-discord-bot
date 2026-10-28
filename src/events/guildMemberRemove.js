'use strict';
const { Events } = require('discord.js');
const db = require('../database');

module.exports = {
  name: Events.GuildMemberRemove,
  execute(member) {
    // Người được mời rời server -> trừ credit của người mời (giữ BXH trung thực)
    const rec = db.data.users[member.id];
    if (rec && rec.invitedBy) {
      const inviter = db.data.users[rec.invitedBy];
      if (inviter && inviter.invites > 0) inviter.invites -= 1;
      rec.invitedBy = '';
      db.save();
    }
  },
};
