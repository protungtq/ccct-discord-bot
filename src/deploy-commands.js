'use strict';
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const config = require('./config');

const commands = [];
const dir = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
  const cmd = require(path.join(dir, file));
  if (cmd.data) commands.push(cmd.data.toJSON());
}

(async () => {
  if (!config.token || !config.clientId) {
    console.error('Thiếu DISCORD_TOKEN hoặc CLIENT_ID trong .env');
    process.exit(1);
  }
  const rest = new REST({ version: '10' }).setToken(config.token);
  try {
    if (config.guildId) {
      await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: commands });
      console.log('Đã đăng ký ' + commands.length + ' lệnh cho server ' + config.guildId);
    } else {
      await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
      console.log('Đã đăng ký ' + commands.length + ' lệnh toàn cục (chờ tới 1 giờ để cập nhật)');
    }
  } catch (e) {
    console.error('Đăng ký lệnh thất bại:', e.message);
    process.exit(1);
  }
})();
