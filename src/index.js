'use strict';
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const config = require('./config');

if (!config.token) {
  console.error('Chưa có DISCORD_TOKEN trong .env - xem README.md để setup.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // cần bật "Server Members Intent" trong Developer Portal
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // cần bật "Message Content Intent"
    GatewayIntentBits.GuildInvites,
  ],
});

client.commands = new Collection();
const cmdDir = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(cmdDir).filter((f) => f.endsWith('.js'))) {
  const cmd = require(path.join(cmdDir, file));
  if (cmd.data && cmd.execute) client.commands.set(cmd.data.name, cmd);
}

const evDir = path.join(__dirname, 'events');
for (const file of fs.readdirSync(evDir).filter((f) => f.endsWith('.js'))) {
  const ev = require(path.join(evDir, file));
  if (ev.once) client.once(ev.name, (...args) => ev.execute(...args, client));
  else client.on(ev.name, (...args) => ev.execute(...args, client));
}

client.login(config.token);
