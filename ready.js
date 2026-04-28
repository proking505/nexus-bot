const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const data = require('../data');

const slashCommands = [
  new SlashCommandBuilder().setName('ping').setDescription('Check bot latency'),
  new SlashCommandBuilder().setName('help').setDescription('Show member command list'),
  new SlashCommandBuilder().setName('serverinfo').setDescription('Server information'),
  new SlashCommandBuilder().setName('userinfo').setDescription('User info').addUserOption(o => o.setName('user').setDescription('Target user')),
  new SlashCommandBuilder().setName('avatar').setDescription('Show avatar').addUserOption(o => o.setName('user').setDescription('Target user')),
  new SlashCommandBuilder().setName('inviter').setDescription('Who invited a member?').addUserOption(o => o.setName('user').setDescription('Target user')),
  new SlashCommandBuilder().setName('invites').setDescription('Invite count').addUserOption(o => o.setName('user').setDescription('Target user')),
  new SlashCommandBuilder().setName('messages').setDescription('Message count').addUserOption(o => o.setName('user').setDescription('Target user')),
  new SlashCommandBuilder().setName('balance').setDescription('Check coin balance'),
  new SlashCommandBuilder().setName('msglb').setDescription('Message leaderboard'),
  new SlashCommandBuilder().setName('invitelb').setDescription('Invite leaderboard'),
  new SlashCommandBuilder().setName('claim').setDescription('Giveaway claim form'),
  new SlashCommandBuilder().setName('gw').setDescription('Active giveaway info'),
  new SlashCommandBuilder().setName('timer').setDescription('Countdown timer')
    .addIntegerOption(o => o.setName('minutes').setDescription('Minutes').setRequired(true))
    .addStringOption(o => o.setName('label').setDescription('Timer label')),
  new SlashCommandBuilder().setName('stopwatch').setDescription('Stopwatch control')
    .addStringOption(o => o.setName('action').setDescription('Action').setRequired(true)
      .addChoices({ name: 'start', value: 'start' }, { name: 'stop', value: 'stop' }, { name: 'lap', value: 'lap' }, { name: 'reset', value: 'reset' }, { name: 'status', value: 'status' })),
].map(c => c.toJSON());

module.exports = async client => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  client.user.setActivity('.help | thepl', { type: 'WATCHING' });

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: slashCommands });
    console.log('✅ Slash commands registered');
  } catch (e) { console.error('Slash error:', e); }

  for (const guild of client.guilds.cache.values()) {
    try {
      const invs = await guild.invites.fetch();
      invs.forEach(inv => data.inviteCache.set(inv.code, { uses: inv.uses, inviterId: inv.inviter?.id, inviterTag: inv.inviter?.tag }));
    } catch {}
  }
  console.log('✅ Invite cache loaded');
};
