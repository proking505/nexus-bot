const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const http = require('http');

// ─── Keep-Alive Web Server ────────────────────────────────────────────────────
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Nexus Bot is online! 🚀');
}).listen(process.env.PORT || 3000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageReactions,
  ]
});

const PREFIX = '.';
const STAFF_ROLE_NAME = '🏛️ ✧ Staff ✧ 🏛️';
const REPPED_ROLE_NAME = '💠 ✦ Repped ✦ 💠';
const REVIVE_ROLE_NAME = '🔥 Chat Revive';
const SERVER_VANITY = 'thepl';
const THEPL_INVITE = 'https://discord.gg/bcgz9gmVAa';
const THEHB_INVITE = 'https://discord.gg/uRZbB7ZXam';
const OWNER_ID = '1453876045726875729';

// ─── Password / Activation System ────────────────────────────────────────────
const serverPasswords = new Map();
const activatedServers = new Set();

function generatePassword() {
  const words = ['cosmic', 'blaze', 'nexus', 'storm', 'ultra', 'hyper', 'epic', 'nova', 'pulse', 'vibe', 'solar', 'frost', 'ember', 'swift', 'blade'];
  const nums = Math.floor(1000 + Math.random() * 9000);
  return words[Math.floor(Math.random() * words.length)] + '-' + words[Math.floor(Math.random() * words.length)] + '-' + nums;
}

// ─── In-Memory Data ───────────────────────────────────────────────────────────
const cooldowns = new Map();
const economy = new Map();
const afkUsers = new Map();
const sniped = new Map();
const warnings = new Map();
const numberGames = new Map();

function isStaff(member) {
  return member.roles.cache.some(r => r.name === STAFF_ROLE_NAME);
}

function onCooldown(userId, command, seconds) {
  const key = `${userId}-${command}`;
  if (cooldowns.has(key)) {
    const expires = cooldowns.get(key);
    if (Date.now() < expires) return Math.ceil((expires - Date.now()) / 1000);
  }
  cooldowns.set(key, Date.now() + seconds * 1000);
  return false;
}

// ─── Ready Event ──────────────────────────────────────────────────────────────
client.once('ready', () => {
  console.log(`✅ Bot online as ${client.user.tag}`);
  client.user.setActivity('.help | thepl', { type: 'WATCHING' });
});

// ─── New Server Join → Generate Password & DM Owner ──────────────────────────
client.on('guildCreate', async guild => {
  try {
    const password = generatePassword();
    serverPasswords.set(guild.id, password);
    const owner = await client.users.fetch(OWNER_ID);
    await owner.send(
      `🔐 **New server joined!**\n` +
      `**Server:** ${guild.name}\n` +
      `**ID:** ${guild.id}\n` +
      `**Members:** ${guild.memberCount}\n` +
      `**Password:** \`${password}\`\n\n` +
      `⚠️ This password expires as soon as it is used once!`
    );
    console.log(`✅ New guild: ${guild.name} — password sent to owner.`);
  } catch (e) {
    console.error('guildCreate DM error:', e);
  }
});

// ─── Presence Update (Vanity Watch) ───────────────────────────────────────────
client.on('presenceUpdate', async (oldPresence, newPresence) => {
  try {
    const member = newPresence?.member;
    if (!member) return;
    const guild = newPresence.guild;
    const reppedRole = guild.roles.cache.find(r => r.name === REPPED_ROLE_NAME);
    if (!reppedRole) return;
    const hasVanity = newPresence.activities?.some(a =>
      a.state?.toLowerCase().includes(SERVER_VANITY) ||
      a.name?.toLowerCase().includes(SERVER_VANITY)
    );
    if (hasVanity && !member.roles.cache.has(reppedRole.id)) {
      await member.roles.add(reppedRole);
      const perksChannel = guild.channels.cache.find(c => c.name.includes('extra-perks'));
      const logChan = perksChannel || guild.systemChannel;
      if (logChan) logChan.send({ embeds: [new EmbedBuilder()
        .setTitle('💠 New Repped Member!')
        .setDescription(`${member} has been given the **${REPPED_ROLE_NAME}** role for repping the server!`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setColor(0x00BFFF)
        .setTimestamp()]});
    } else if (!hasVanity && member.roles.cache.has(reppedRole.id)) {
      await member.roles.remove(reppedRole);
    }
  } catch (e) { console.error(e); }
});

// ─── Message Delete (Snipe) ───────────────────────────────────────────────────
client.on('messageDelete', (message) => {
  if (message.author?.bot) return;
  sniped.set(message.channel.id, {
    content: message.content || '*(attachment/embed)*',
    author: message.author?.tag || 'Unknown',
    avatar: message.author?.displayAvatarURL() || '',
    time: message.createdTimestamp,
  });
});

// ─── Message Handler ──────────────────────────────────────────────────────────
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  const member = message.member;

  // ── .activate ────────────────────────────────────────────────────────────────
  if (command === 'activate') {
    const password = args.join(' ');
    if (activatedServers.has(message.guild.id)) return message.reply('✅ This server is already activated!');
    if (!serverPasswords.has(message.guild.id)) return message.reply('❌ No password found for this server. Please contact the bot owner.');
    if (password === serverPasswords.get(message.guild.id)) {
      activatedServers.add(message.guild.id);
      serverPasswords.delete(message.guild.id);
      return message.reply('✅ **Bot successfully activated for this server!** 🎉\nAll commands are now unlocked!');
    } else {
      return message.reply('❌ Wrong password! Contact the bot owner for the correct password.');
    }
  }

  // ── Block all commands if server not activated ────────────────────────────
  if (!activatedServers.has(message.guild.id)) {
    return message.reply('🔒 This bot is not activated in this server yet! An admin must type `.activate [password]` to unlock it. Contact the bot owner for the password.');
  }

  // ── .ping ────────────────────────────────────────────────────────────────────
 if (command === 'newpass') {
    if (message.author.id !== OWNER_ID) return message.reply('❌ Only the bot owner can use this command.');
    const password = generatePassword();
    serverPasswords.set(message.guild.id, password);
    activatedServers.delete(message.guild.id);
    const owner = await client.users.fetch(OWNER_ID);
    await owner.send(`🔐 **New password for ${message.guild.name}:**\n\`${password}\``);
    return message.reply('✅ New password generated and sent to your DMs!');
  }
  if (command === 'ping') {
    return message.reply(`🏓 Pong! Latency: **${client.ws.ping}ms**`);
  }

  // ── .help ────────────────────────────────────────────────────────────────────
  if (command === 'help') {
    const embed = new EmbedBuilder()
      .setTitle('📋 Nexus Bot Command List')
      .setColor(0x5865F2)
      .addFields(
        { name: '🔗 Server Invites', value: '`.thepl` `.thehb`' },
        { name: '🎉 Giveaway', value: '`.claim` `.gw` `.gstart` `.gend` `.greroll`' },
        { name: '🛡️ Staff Only', value: '`.nuke` `.revive` `.kick` `.ban` `.unban` `.mute` `.unmute` `.warn` `.warns` `.clearwarns` `.lock` `.unlock` `.slowmode` `.purge` `.announce` `.dm` `.role` `.removerole` `.setnick` `.number` `.stopnumber`' },
        { name: '📊 Info', value: '`.userinfo` `.serverinfo` `.roleinfo` `.channelinfo` `.avatar` `.banner` `.botinfo` `.stats` `.uptime` `.membercount`' },
        { name: '🎭 Fun', value: '`.8ball` `.coinflip` `.roll` `.rps` `.joke` `.roast` `.compliment` `.quote` `.fact` `.trivia` `.wouldyourather` `.truth` `.dare` `.ship` `.rate` `.mock` `.reverse`' },
        { name: '🏆 Economy', value: '`.balance` `.daily` `.weekly` `.work` `.rob` `.give` `.shop` `.inventory` `.leaderboard`' },
        { name: '⚙️ Utility', value: '`.embed` `.poll` `.remind` `.afk` `.snipe` `.whois` `.timestamp` `.calc` `.qr` `.vanity` `.partners` `.stafflist`' },
        { name: '🎮 Games', value: '`.tictactoe` `.hangman` `.guess` `.slots` `.blackjack`' },
        { name: '💕 Social', value: '`.hug` `.pat` `.slap` `.poke` `.highfive` `.cuddle` `.wave` `.bonk` `.wink` `.stare` `.cry` `.laugh` `.dance`' },
      )
      .setFooter({ text: `Prefix: ${PREFIX} | Nexus Bot` });
    return message.reply({ embeds: [embed] });
  }

  // ── .thepl ───────────────────────────────────────────────────────────────────
  if (command === 'thepl') {
    const embed = new EmbedBuilder()
      .setTitle('🌟 Join ThePL Server!')
      .setDescription(`Click below or use this invite:\n${THEPL_INVITE}`)
      .setColor(0x5865F2)
      .setFooter({ text: 'ThePL Community' });
    return message.reply({ embeds: [embed] });
  }

  // ── .thehb ───────────────────────────────────────────────────────────────────
  if (command === 'thehb') {
    const embed = new EmbedBuilder()
      .setTitle('🌟 Join TheHB Server!')
      .setDescription(`Click below or use this invite:\n${THEHB_INVITE}`)
      .setColor(0xEB459E)
      .setFooter({ text: 'TheHB Community' });
    return message.reply({ embeds: [embed] });
  }

  // ── .claim ───────────────────────────────────────────────────────────────────
  if (command === 'claim') {
    const embed = new EmbedBuilder()
      .setTitle('🎉 Giveaway Claim')
      .setDescription('Please provide the following info:')
      .addFields(
        { name: '1️⃣ Host', value: 'Who is the host of the giveaway?' },
        { name: '2️⃣ Type', value: 'What kind of giveaway? (Nreq or REQ?)' },
        { name: '3️⃣ Prize', value: 'What do you want as your prize?' },
        { name: '4️⃣ Screenshot', value: 'Send a screenshot of winning.' },
        { name: '5️⃣ REQ Only', value: 'If REQ, also send a `/inviter` screenshot.' },
      )
      .setColor(0xFFD700)
      .setTimestamp()
      .setFooter({ text: 'Fill out all steps to complete your claim.' });
    return message.reply({ embeds: [embed] });
  }

  // ── .nuke ────────────────────────────────────────────────────────────────────
  if (command === 'nuke') {
    if (!isStaff(member)) return message.reply('❌ You need the Staff role to use this command.');
    const confirmEmbed = new EmbedBuilder()
      .setTitle('⚠️ Are you sure you want to nuke this channel?')
      .setDescription('Type `.confirm` to confirm or `.cancel` to cancel.\n⏰ You have 15 seconds.')
      .setColor(0xFF0000);
    await message.reply({ embeds: [confirmEmbed] });
    const filter = m => m.author.id === message.author.id && ['.confirm', '.cancel'].includes(m.content.toLowerCase());
    const collector = message.channel.createMessageCollector({ filter, time: 15000, max: 1 });
    collector.on('collect', async m => {
      if (m.content.toLowerCase() === '.confirm') {
        try {
          const newChannel = await message.channel.clone();
          await message.channel.delete();
          const nukeEmbed = new EmbedBuilder()
            .setTitle('💥 Channel Nuked!')
            .setDescription('This channel has been nuked by staff.')
            .setColor(0xFF0000)
            .setTimestamp();
          await newChannel.send({ embeds: [nukeEmbed] });
        } catch (e) {
          console.error(e);
        }
      } else {
        m.reply('✅ Nuke cancelled!');
      }
    });
    collector.on('end', collected => {
      if (collected.size === 0) message.channel.send('⏰ Nuke cancelled — no response in time.').catch(() => {});
    });
    return;
  }

  // ── .number ───────────────────────────────────────────────────────────────────
  if (command === 'number') {
    if (!isStaff(member)) return message.reply('❌ Staff only.');
    const max = parseInt(args[0]) || 100;
    const hints = args[1]?.toLowerCase() === 'hints' || args.join(' ').toLowerCase().includes('hints on');
    const number = Math.floor(Math.random() * max) + 1;
    numberGames.set(message.guild.id, { number, max, hints, active: true, hostId: message.author.id });
    const embed = new EmbedBuilder()
      .setTitle('🔢 Guess the Number!')
      .setDescription(`I'm thinking of a number between **1 and ${max}**!\nType your guess in the chat!\n${hints ? '💡 Hints are **ON**' : '🔕 Hints are **OFF**'}`)
      .setColor(0x57F287)
      .setFooter({ text: `Started by ${message.author.tag} | Use .stopnumber to end` });
    return message.channel.send({ embeds: [embed] });
  }

  // ── .stopnumber ───────────────────────────────────────────────────────────────
  if (command === 'stopnumber') {
    if (!isStaff(member)) return message.reply('❌ Staff only.');
    const game = numberGames.get(message.guild.id);
    if (!game || !game.active) return message.reply('❌ No active number game!');
    const answer = game.number;
    numberGames.delete(message.guild.id);
    return message.reply(`🛑 Number game stopped! The answer was **${answer}**!`);
  }

  // ── Handle number game guesses ────────────────────────────────────────────────
  const activeGame = numberGames.get(message.guild.id);
  if (activeGame && activeGame.active && !isNaN(message.content) && !message.content.startsWith(PREFIX)) {
    const guess = parseInt(message.content);
    const { number, max, hints } = activeGame;
    if (guess === number) {
      numberGames.delete(message.guild.id);
      return message.reply(`🎉 **${message.author.username}** got it! The number was **${number}**! 🏆`);
    } else if (hints) {
      if (guess < number) return message.reply(`📈 Higher than **${guess}**!`);
      else return message.reply(`📉 Lower than **${guess}**!`);
    }
    return;
  }

  // ── .revive ───────────────────────────────────────────────────────────────────
  if (command === 'revive') {
    if (!isStaff(member)) return message.reply('❌ Staff only.');
    const reviveRole = message.guild.roles.cache.find(r => r.name === REVIVE_ROLE_NAME);
    const ping = reviveRole ? `<@&${reviveRole.id}>` : '@everyone';
    const embed = new EmbedBuilder()
      .setTitle('🔥 Chat Revive!')
      .setDescription('Come and chat! Let\'s get this server active! 🎉')
      .setColor(0xFF4500)
      .setTimestamp();
    return message.channel.send({ content: ping, embeds: [embed] });
  }
  // ── .userinfo ────────────────────────────────────────────────────────────────
  if (command === 'userinfo') {
    const target = message.mentions.members.first() || member;
    const embed = new EmbedBuilder()
      .setTitle(`👤 User Info — ${target.user.tag}`)
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'ID', value: target.id, inline: true },
        { name: 'Nickname', value: target.nickname || 'None', inline: true },
        { name: 'Joined Server', value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`, inline: true },
        { name: 'Account Created', value: `<t:${Math.floor(target.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Roles', value: target.roles.cache.map(r => `<@&${r.id}>`).join(', ') || 'None' },
      )
      .setColor(0x5865F2);
    return message.reply({ embeds: [embed] });
  }

  // ── .serverinfo ───────────────────────────────────────────────────────────────
  if (command === 'serverinfo') {
    const g = message.guild;
    const embed = new EmbedBuilder()
      .setTitle(`🏠 ${g.name}`)
      .setThumbnail(g.iconURL({ dynamic: true }))
      .addFields(
        { name: 'Owner', value: `<@${g.ownerId}>`, inline: true },
        { name: 'Members', value: `${g.memberCount}`, inline: true },
        { name: 'Channels', value: `${g.channels.cache.size}`, inline: true },
        { name: 'Roles', value: `${g.roles.cache.size}`, inline: true },
        { name: 'Boost Level', value: `Level ${g.premiumTier}`, inline: true },
        { name: 'Created', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`, inline: true },
      )
      .setColor(0x57F287);
    return message.reply({ embeds: [embed] });
  }

  // ── .avatar ───────────────────────────────────────────────────────────────────
  if (command === 'avatar') {
    const target = message.mentions.users.first() || message.author;
    const embed = new EmbedBuilder()
      .setTitle(`🖼️ ${target.username}'s Avatar`)
      .setImage(target.displayAvatarURL({ dynamic: true, size: 1024 }))
      .setColor(0x5865F2);
    return message.reply({ embeds: [embed] });
  }

  // ── .banner ───────────────────────────────────────────────────────────────────
  if (command === 'banner') {
    const target = await (message.mentions.users.first() || message.author).fetch();
    const bannerURL = target.bannerURL({ dynamic: true, size: 1024 });
    if (!bannerURL) return message.reply('❌ This user has no banner.');
    const embed = new EmbedBuilder()
      .setTitle(`🎨 ${target.username}'s Banner`)
      .setImage(bannerURL)
      .setColor(0x5865F2);
    return message.reply({ embeds: [embed] });
  }

  // ── .membercount ──────────────────────────────────────────────────────────────
  if (command === 'membercount') {
    return message.reply(`👥 **Member Count:** ${message.guild.memberCount}`);
  }

  // ── .botinfo ──────────────────────────────────────────────────────────────────
  if (command === 'botinfo') {
    const embed = new EmbedBuilder()
      .setTitle('🤖 Bot Info')
      .addFields(
        { name: 'Name', value: client.user.tag, inline: true },
        { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true },
        { name: 'Uptime', value: `<t:${Math.floor((Date.now() - client.uptime) / 1000)}:R>`, inline: true },
        { name: 'Library', value: 'discord.js v14', inline: true },
      )
      .setThumbnail(client.user.displayAvatarURL())
      .setColor(0x5865F2);
    return message.reply({ embeds: [embed] });
  }

  // ── .uptime ───────────────────────────────────────────────────────────────────
  if (command === 'uptime') {
    return message.reply(`⏱️ Bot has been online since <t:${Math.floor((Date.now() - client.uptime) / 1000)}:R>`);
  }

  // ── .purge ────────────────────────────────────────────────────────────────────
  if (command === 'purge') {
    if (!isStaff(member)) return message.reply('❌ Staff only.');
    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 1 || amount > 100) return message.reply('❌ Provide a number between 1-100.');
    await message.channel.bulkDelete(amount + 1, true).catch(() => null);
    const m = await message.channel.send(`🗑️ Deleted **${amount}** messages.`);
    setTimeout(() => m.delete().catch(() => {}), 3000);
    return;
  }

  // ── .kick ─────────────────────────────────────────────────────────────────────
  if (command === 'kick') {
    if (!isStaff(member)) return message.reply('❌ Staff only.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Mention a member.');
    const reason = args.slice(1).join(' ') || 'No reason provided';
    await target.kick(reason);
    return message.reply(`👢 **${target.user.tag}** has been kicked. Reason: ${reason}`);
  }

  // ── .ban ──────────────────────────────────────────────────────────────────────
  if (command === 'ban') {
    if (!isStaff(member)) return message.reply('❌ Staff only.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Mention a member.');
    const reason = args.slice(1).join(' ') || 'No reason provided';
    await target.ban({ reason });
    return message.reply(`🔨 **${target.user.tag}** has been banned. Reason: ${reason}`);
  }

  // ── .unban ────────────────────────────────────────────────────────────────────
  if (command === 'unban') {
    if (!isStaff(member)) return message.reply('❌ Staff only.');
    const userId = args[0];
    if (!userId) return message.reply('❌ Provide a user ID.');
    await message.guild.members.unban(userId);
    return message.reply(`✅ User **${userId}** has been unbanned.`);
  }

  // ── .mute ─────────────────────────────────────────────────────────────────────
  if (command === 'mute') {
    if (!isStaff(member)) return message.reply('❌ Staff only.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Mention a member.');
    const duration = parseInt(args[1]) || 10;
    await target.timeout(duration * 60 * 1000);
    return message.reply(`🔇 **${target.user.tag}** has been muted for **${duration}** minutes.`);
  }

  // ── .unmute ───────────────────────────────────────────────────────────────────
  if (command === 'unmute') {
    if (!isStaff(member)) return message.reply('❌ Staff only.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Mention a member.');
    await target.timeout(null);
    return message.reply(`🔊 **${target.user.tag}** has been unmuted.`);
  }

  // ── .warn ─────────────────────────────────────────────────────────────────────
  if (command === 'warn') {
    if (!isStaff(member)) return message.reply('❌ Staff only.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Mention a member.');
    const reason = args.slice(1).join(' ') || 'No reason';
    const uid = target.id;
    if (!warnings.has(uid)) warnings.set(uid, []);
    warnings.get(uid).push({ reason, by: message.author.tag, time: new Date().toISOString() });
    return message.reply(`⚠️ **${target.user.tag}** has been warned. Reason: ${reason}`);
  }

  // ── .warns ────────────────────────────────────────────────────────────────────
  if (command === 'warns') {
    const target = message.mentions.members.first() || member;
    const userWarns = warnings.get(target.id) || [];
    if (!userWarns.length) return message.reply(`✅ **${target.user.tag}** has no warnings.`);
    const embed = new EmbedBuilder()
      .setTitle(`⚠️ Warnings for ${target.user.tag}`)
      .setDescription(userWarns.map((w, i) => `**${i+1}.** ${w.reason} — by ${w.by}`).join('\n'))
      .setColor(0xFEE75C);
    return message.reply({ embeds: [embed] });
  }

  // ── .clearwarns ───────────────────────────────────────────────────────────────
  if (command === 'clearwarns') {
    if (!isStaff(member)) return message.reply('❌ Staff only.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Mention a member.');
    warnings.delete(target.id);
    return message.reply(`✅ Cleared all warnings for **${target.user.tag}**.`);
  }

  // ── .lock ─────────────────────────────────────────────────────────────────────
  if (command === 'lock') {
    if (!isStaff(member)) return message.reply('❌ Staff only.');
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
    return message.reply('🔒 Channel locked.');
  }

  // ── .unlock ───────────────────────────────────────────────────────────────────
  if (command === 'unlock') {
    if (!isStaff(member)) return message.reply('❌ Staff only.');
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null });
    return message.reply('🔓 Channel unlocked.');
  }

  // ── .slowmode ─────────────────────────────────────────────────────────────────
  if (command === 'slowmode') {
    if (!isStaff(member)) return message.reply('❌ Staff only.');
    const seconds = parseInt(args[0]) || 0;
    await message.channel.setRateLimitPerUser(seconds);
    return message.reply(`⏱️ Slowmode set to **${seconds}** seconds.`);
  }

  // ── .announce ─────────────────────────────────────────────────────────────────
  if (command === 'announce') {
    if (!isStaff(member)) return message.reply('❌ Staff only.');
    const text = args.join(' ');
    if (!text) return message.reply('❌ Provide an announcement message.');
    const embed = new EmbedBuilder()
      .setTitle('📢 Announcement')
      .setDescription(text)
      .setColor(0xEB459E)
      .setTimestamp()
      .setFooter({ text: `Announced by ${message.author.tag}` });
    return message.channel.send({ embeds: [embed] });
  }

  // ── .dm ───────────────────────────────────────────────────────────────────────
  if (command === 'dm') {
    if (!isStaff(member)) return message.reply('❌ Staff only.');
    const target = message.mentions.users.first();
    const text = args.slice(1).join(' ');
    if (!target || !text) return message.reply('❌ Usage: `.dm @user message`');
    await target.send(`📨 Message from **${message.guild.name}**: ${text}`).catch(() => null);
    return message.reply(`✅ DM sent to **${target.tag}**.`);
  }

  // ── .role ─────────────────────────────────────────────────────────────────────
  if (command === 'role') {
    if (!isStaff(member)) return message.reply('❌ Staff only.');
    const target = message.mentions.members.first();
    const roleName = args.slice(1).join(' ');
    if (!target || !roleName) return message.reply('❌ Usage: `.role @user RoleName`');
    const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
    if (!role) return message.reply('❌ Role not found.');
    await target.roles.add(role);
    return message.reply(`✅ Gave **${role.name}** to **${target.user.tag}**.`);
  }

  // ── .removerole ───────────────────────────────────────────────────────────────
  if (command === 'removerole') {
    if (!isStaff(member)) return message.reply('❌ Staff only.');
    const target = message.mentions.members.first();
    const roleName = args.slice(1).join(' ');
    if (!target || !roleName) return message.reply('❌ Usage: `.removerole @user RoleName`');
    const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
    if (!role) return message.reply('❌ Role not found.');
    await target.roles.remove(role);
    return message.reply(`✅ Removed **${role.name}** from **${target.user.tag}**.`);
  }

  // ── .setnick ──────────────────────────────────────────────────────────────────
  if (command === 'setnick') {
    if (!isStaff(member)) return message.reply('❌ Staff only.');
    const target = message.mentions.members.first();
    const nick = args.slice(1).join(' ') || null;
    if (!target) return message.reply('❌ Mention a member.');
    await target.setNickname(nick);
    return message.reply(`✅ Nickname updated for **${target.user.tag}**.`);
  }

  // ── .8ball ────────────────────────────────────────────────────────────────────
  if (command === '8ball') {
    const responses = ['Yes!', 'No!', 'Maybe...', 'Absolutely!', 'Definitely not.', 'Ask again later.', 'Without a doubt!', 'Very doubtful.', 'Signs point to yes.', 'My sources say no.'];
    const q = args.join(' ');
    if (!q) return message.reply('❌ Ask a question!');
    return message.reply(`🎱 **Q:** ${q}\n**A:** ${responses[Math.floor(Math.random() * responses.length)]}`);
  }

  // ── .coinflip ─────────────────────────────────────────────────────────────────
  if (command === 'coinflip') {
    return message.reply(`🪙 **${Math.random() < 0.5 ? 'Heads' : 'Tails'}!**`);
  }

  // ── .roll ─────────────────────────────────────────────────────────────────────
  if (command === 'roll') {
    const sides = parseInt(args[0]) || 6;
    return message.reply(`🎲 You rolled a **${Math.floor(Math.random() * sides) + 1}** (d${sides})`);
  }

  // ── .rps ──────────────────────────────────────────────────────────────────────
  if (command === 'rps') {
    const choices = ['rock', 'paper', 'scissors'];
    const userChoice = args[0]?.toLowerCase();
    if (!choices.includes(userChoice)) return message.reply('❌ Choose: rock, paper, or scissors.');
    const botChoice = choices[Math.floor(Math.random() * 3)];
    const wins = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
    const result = userChoice === botChoice ? '🤝 Tie!' : wins[userChoice] === botChoice ? '🏆 You win!' : '😔 Bot wins!';
    return message.reply(`You: **${userChoice}** | Bot: **${botChoice}** — ${result}`);
  }

  // ── .joke ─────────────────────────────────────────────────────────────────────
  if (command === 'joke') {
    const jokes = [
      "Why don't scientists trust atoms? Because they make up everything!",
      "I told my wife she was drawing her eyebrows too high. She looked surprised.",
      "What do you call a fish with no eyes? A fsh!",
      "Why can't your nose be 12 inches long? Because then it'd be a foot!",
      "I used to hate facial hair, but then it grew on me.",
    ];
    return message.reply(`😂 ${jokes[Math.floor(Math.random() * jokes.length)]}`);
  }

  // ── .roast ────────────────────────────────────────────────────────────────────
  if (command === 'roast') {
    const target = message.mentions.users.first() || message.author;
    const roasts = [
      `${target} you're like a cloud — when you disappear, it's a beautiful day.`,
      `${target} I'd roast you but my mom said I shouldn't burn trash.`,
      `${target} you're not stupid; you just have bad luck thinking.`,
      `${target} even your dog waves at the neighbors more than you.`,
    ];
    return message.reply(roasts[Math.floor(Math.random() * roasts.length)]);
  }

  // ── .compliment ───────────────────────────────────────────────────────────────
  if (command === 'compliment') {
    const target = message.mentions.users.first() || message.author;
    const compliments = [
      `${target}, you make the world a better place just by being in it! 🌟`,
      `${target}, your smile could light up an entire server! ✨`,
      `${target}, you are an absolute legend! 👑`,
    ];
    return message.reply(compliments[Math.floor(Math.random() * compliments.length)]);
  }

  // ── .quote ────────────────────────────────────────────────────────────────────
  if (command === 'quote') {
    const quotes = [
      '"The only way to do great work is to love what you do." — Steve Jobs',
      '"In the middle of difficulty lies opportunity." — Albert Einstein',
      '"Success is not final, failure is not fatal." — Winston Churchill',
      '"Dream big and dare to fail." — Norman Vaughan',
    ];
    return message.reply(`💬 ${quotes[Math.floor(Math.random() * quotes.length)]}`);
  }

  // ── .fact ─────────────────────────────────────────────────────────────────────
  if (command === 'fact') {
    const facts = [
      'Honey never spoils — archaeologists found 3000-year-old honey in Egyptian tombs.',
      'A group of flamingos is called a "flamboyance."',
      'Octopuses have three hearts.',
      'Bananas are technically berries, but strawberries are not.',
      'The human nose can detect over 1 trillion scents.',
    ];
    return message.reply(`📚 **Fact:** ${facts[Math.floor(Math.random() * facts.length)]}`);
  }

  // ── .trivia ───────────────────────────────────────────────────────────────────
  if (command === 'trivia') {
    const questions = [
      { q: 'What planet is closest to the Sun?', a: 'Mercury' },
      { q: 'How many sides does a hexagon have?', a: '6' },
      { q: 'What is the capital of France?', a: 'Paris' },
      { q: 'What is the largest ocean?', a: 'Pacific' },
      { q: 'How many continents are there?', a: '7' },
    ];
    const picked = questions[Math.floor(Math.random() * questions.length)];
    await message.reply(`❓ **Trivia:** ${picked.q}\n*(Answer revealed in 10 seconds)*`);
    setTimeout(() => message.channel.send(`✅ **Answer:** ${picked.a}`), 10000);
    return;
  }

  // ── .wouldyourather ──────────────────────────────────────────────────────────
  if (command === 'wouldyourather') {
    const options = [
      ['fly', 'be invisible'],
      ['live in the ocean', 'live in space'],
      ['always be hot', 'always be cold'],
    ];
    const [a, b] = options[Math.floor(Math.random() * options.length)];
    return message.reply(`🤔 **Would you rather:** ${a} **OR** ${b}?`);
  }

  // ── .truth ────────────────────────────────────────────────────────────────────
  if (command === 'truth') {
    const truths = ['What is your biggest fear?', 'Have you ever lied to a close friend?', 'What is your most embarrassing moment?'];
    return message.reply(`🤍 **Truth:** ${truths[Math.floor(Math.random() * truths.length)]}`);
  }

  // ── .dare ─────────────────────────────────────────────────────────────────────
  if (command === 'dare') {
    const dares = [
      'Send a voice message saying "I love pickles" in your best opera voice.',
      'Change your nickname to "Potato Lord" for 10 minutes.',
      'Send a GIF of a dancing cat in the next channel.',
    ];
    return message.reply(`🔥 **Dare:** ${dares[Math.floor(Math.random() * dares.length)]}`);
  }

  // ── .ship ─────────────────────────────────────────────────────────────────────
  if (command === 'ship') {
    const user1 = message.mentions.users.first();
    const user2 = message.mentions.users.at(1) || message.author;
    const percent = Math.floor(Math.random() * 101);
    const bar = '💗'.repeat(Math.floor(percent / 10)) + '🖤'.repeat(10 - Math.floor(percent / 10));
    return message.reply(`💘 **${user1?.username || '???'} & ${user2.username}**\n${bar} **${percent}%** compatible!`);
  }

  // ── .rate ─────────────────────────────────────────────────────────────────────
  if (command === 'rate') {
    const thing = args.join(' ') || 'yourself';
    return message.reply(`⭐ I rate **${thing}** a **${Math.floor(Math.random() * 11)}/10**!`);
  }

  // ── .mock ─────────────────────────────────────────────────────────────────────
  if (command === 'mock') {
    const text = args.join(' ');
    if (!text) return message.reply('❌ Provide text to mock.');
    const mocked = text.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join('');
    return message.reply(`🤪 ${mocked}`);
  }

  // ── .reverse ──────────────────────────────────────────────────────────────────
  if (command === 'reverse') {
    const text = args.join(' ');
    if (!text) return message.reply('❌ Provide text to reverse.');
    return message.reply(`🔄 ${text.split('').reverse().join('')}`);
  }

  // ── .poll ─────────────────────────────────────────────────────────────────────
  if (command === 'poll') {
    const text = args.join(' ');
    if (!text) return message.reply('❌ Provide a poll question.');
    const embed = new EmbedBuilder()
      .setTitle('📊 Poll')
      .setDescription(text)
      .setColor(0x5865F2)
      .setFooter({ text: `Poll by ${message.author.tag}` });
    const msg = await message.channel.send({ embeds: [embed] });
    await msg.react('✅');
    await msg.react('❌');
    return;
  }

  // ── .embed ────────────────────────────────────────────────────────────────────
  if (command === 'embed') {
    if (!isStaff(member)) return message.reply('❌ Staff only.');
    const text = args.join(' ');
    if (!text) return message.reply('❌ Provide embed content.');
    const embed = new EmbedBuilder()
      .setDescription(text)
      .setColor(0x5865F2)
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── .afk ──────────────────────────────────────────────────────────────────────
  if (command === 'afk') {
    const reason = args.join(' ') || 'AFK';
    afkUsers.set(message.author.id, { reason, time: Date.now() });
    return message.reply(`😴 You are now AFK: **${reason}**`);
  }

  // ── .snipe ────────────────────────────────────────────────────────────────────
  if (command === 'snipe') {
    const data = sniped.get(message.channel.id);
    if (!data) return message.reply('❌ Nothing to snipe!');
    const embed = new EmbedBuilder()
      .setAuthor({ name: data.author, iconURL: data.avatar })
      .setDescription(data.content)
      .setColor(0x5865F2)
      .setTimestamp(data.time);
    return message.reply({ embeds: [embed] });
  }

  // ── .calc ─────────────────────────────────────────────────────────────────────
  if (command === 'calc') {
    const expr = args.join(' ');
    try {
      const result = eval(expr.replace(/[^0-9+\-*/().%^ ]/g, ''));
      return message.reply(`🧮 **${expr} = ${result}**`);
    } catch {
      return message.reply('❌ Invalid expression.');
    }
  }

  // ── .whois ────────────────────────────────────────────────────────────────────
  if (command === 'whois') {
    const target = message.mentions.members.first() || member;
    const embed = new EmbedBuilder()
      .setTitle(`🔍 Who is ${target.user.username}?`)
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Tag', value: target.user.tag, inline: true },
        { name: 'ID', value: target.id, inline: true },
        { name: 'Bot?', value: target.user.bot ? 'Yes' : 'No', inline: true },
        { name: 'Joined', value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`, inline: true },
        { name: 'Created', value: `<t:${Math.floor(target.user.createdTimestamp / 1000)}:R>`, inline: true },
      )
      .setColor(0x5865F2);
    return message.reply({ embeds: [embed] });
  }

  // ── .timestamp ────────────────────────────────────────────────────────────────
  if (command === 'timestamp') {
    const now = Math.floor(Date.now() / 1000);
    return message.reply(`🕐 Current Unix timestamp: \`${now}\`\nFormatted: <t:${now}:F>`);
  }

  // ── .remind ───────────────────────────────────────────────────────────────────
  if (command === 'remind') {
    const minutes = parseInt(args[0]);
    const reminder = args.slice(1).join(' ');
    if (isNaN(minutes) || !reminder) return message.reply('❌ Usage: `.remind 10 Take a break`');
    message.reply(`⏰ I'll remind you in **${minutes}** minutes: **${reminder}**`);
    setTimeout(() => message.author.send(`⏰ Reminder: **${reminder}**`).catch(() => message.channel.send(`${message.author} ⏰ Reminder: **${reminder}**`)), minutes * 60 * 1000);
    return;
  }

  // ── .qr ───────────────────────────────────────────────────────────────────────
  if (command === 'qr') {
    const text = args.join(' ');
    if (!text) return message.reply('❌ Provide text for QR code.');
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
    const embed = new EmbedBuilder()
      .setTitle('📱 QR Code')
      .setImage(url)
      .setColor(0x5865F2);
    return message.reply({ embeds: [embed] });
  }

  // ── .balance ──────────────────────────────────────────────────────────────────
  if (command === 'balance') {
    const bal = economy.get(message.author.id) || 0;
    return message.reply(`💰 Your balance: **${bal} coins**`);
  }

  // ── .daily ────────────────────────────────────────────────────────────────────
  if (command === 'daily') {
    const uid = message.author.id;
    const bal = economy.get(uid) || 0;
    economy.set(uid, bal + 100);
    return message.reply(`💸 You claimed your daily **100 coins**! New balance: **${bal + 100}**`);
  }

  // ── .weekly ───────────────────────────────────────────────────────────────────
  if (command === 'weekly') {
    const uid = message.author.id;
    const bal = economy.get(uid) || 0;
    economy.set(uid, bal + 500);
    return message.reply(`💰 You claimed your weekly **500 coins**! New balance: **${bal + 500}**`);
  }

  // ── .work ─────────────────────────────────────────────────────────────────────
  if (command === 'work') {
    const uid = message.author.id;
    const earned = Math.floor(Math.random() * 50) + 10;
    const bal = economy.get(uid) || 0;
    economy.set(uid, bal + earned);
    const jobs = ['delivering pizza', 'mowing lawns', 'fixing bugs', 'teaching cats to sing'];
    return message.reply(`💼 You worked hard ${jobs[Math.floor(Math.random() * jobs.length)]} and earned **${earned} coins**!`);
  }

  // ── .rob ──────────────────────────────────────────────────────────────────────
  if (command === 'rob') {
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Mention someone to rob.');
    if (Math.random() < 0.5) return message.reply(`🔒 You got caught trying to rob ${target.user.tag} and paid a fine!`);
    const stolen = Math.floor(Math.random() * 50) + 5;
    return message.reply(`💰 You stole **${stolen} coins** from ${target.user.tag}!`);
  }

  // ── .give ─────────────────────────────────────────────────────────────────────
  if (command === 'give') {
    const target = message.mentions.members.first();
    const amount = parseInt(args[1]);
    if (!target || isNaN(amount)) return message.reply('❌ Usage: `.give @user amount`');
    return message.reply(`💸 Gave **${amount} coins** to ${target.user.tag}!`);
  }

  // ── .leaderboard ──────────────────────────────────────────────────────────────
  if (command === 'leaderboard' || command === 'lb') {
    return message.reply('🏆 Leaderboard is not yet populated — earn coins with `.work` and `.daily`!');
  }

  // ── .inventory ────────────────────────────────────────────────────────────────
  if (command === 'inventory' || command === 'inv') {
    return message.reply(`🎒 **${message.author.username}'s Inventory:** *(empty — visit the shop!)*`);
  }

  // ── .shop ─────────────────────────────────────────────────────────────────────
  if (command === 'shop') {
    const embed = new EmbedBuilder()
      .setTitle('🛒 Shop')
      .setDescription('Coming soon! Items will be added here.')
      .setColor(0x57F287);
    return message.reply({ embeds: [embed] });
  }

  // ── .slots ────────────────────────────────────────────────────────────────────
  if (command === 'slots') {
    const symbols = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎'];
    const spin = () => symbols[Math.floor(Math.random() * symbols.length)];
    const [a, b, c] = [spin(), spin(), spin()];
    const won = a === b && b === c;
    return message.reply(`🎰 | ${a} | ${b} | ${c} |\n${won ? '🎉 **JACKPOT! You won!**' : '😔 Try again!'}`);
  }

  // ── .blackjack ───────────────────────────────────────────────────────────────
  if (command === 'blackjack' || command === 'bj') {
    const card = () => [2,3,4,5,6,7,8,9,10,'J','Q','K','A'][Math.floor(Math.random() * 13)];
    const val = (c) => ['J','Q','K'].includes(c) ? 10 : c === 'A' ? 11 : c;
    const p1 = card(), p2 = card(), d1 = card();
    const playerTotal = val(p1) + val(p2);
    return message.reply(`🃏 **Blackjack!**\nYour hand: **${p1}, ${p2}** (${playerTotal})\nDealer shows: **${d1}**`);
  }

  // ── .hangman ─────────────────────────────────────────────────────────────────
  if (command === 'hangman') {
    const words = ['discord', 'giveaway', 'server', 'community', 'moderator'];
    const word = words[Math.floor(Math.random() * words.length)];
    const hidden = word.split('').map(() => '\\_').join(' ');
    return message.reply(`🪢 **Hangman!**\nGuess the word: ${hidden}`);
  }

  // ── .guess ────────────────────────────────────────────────────────────────────
  if (command === 'guess') {
    const num = Math.floor(Math.random() * 10) + 1;
    await message.reply(`🔢 I'm thinking of a number between 1-10. Reply with your guess!`);
    const filter = m => m.author.id === message.author.id && !isNaN(m.content);
    const collected = await message.channel.awaitMessages({ filter, max: 1, time: 15000 }).catch(() => null);
    if (!collected || collected.size === 0) return message.channel.send("⏰ Time's up!");
    const guess = parseInt(collected.first().content);
    return message.channel.send(guess === num ? `🎉 Correct! It was **${num}**!` : `❌ Wrong! It was **${num}**.`);
  }

  // ── .stats ────────────────────────────────────────────────────────────────────
  if (command === 'stats') {
    const embed = new EmbedBuilder()
      .setTitle('📊 Server Stats')
      .addFields(
        { name: 'Members', value: `${message.guild.memberCount}`, inline: true },
        { name: 'Channels', value: `${message.guild.channels.cache.size}`, inline: true },
        { name: 'Roles', value: `${message.guild.roles.cache.size}`, inline: true },
        { name: 'Emojis', value: `${message.guild.emojis.cache.size}`, inline: true },
        { name: 'Boost Level', value: `${message.guild.premiumTier}`, inline: true },
        { name: 'Boosters', value: `${message.guild.premiumSubscriptionCount}`, inline: true },
      )
      .setColor(0x5865F2);
    return message.reply({ embeds: [embed] });
  }

  // ── .roleinfo ─────────────────────────────────────────────────────────────────
  if (command === 'roleinfo') {
    const roleName = args.join(' ');
    const role = message.mentions.roles.first() || message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName?.toLowerCase());
    if (!role) return message.reply('❌ Role not found.');
    const embed = new EmbedBuilder()
      .setTitle(`🎭 Role: ${role.name}`)
      .addFields(
        { name: 'ID', value: role.id, inline: true },
        { name: 'Color', value: role.hexColor, inline: true },
        { name: 'Members', value: `${role.members.size}`, inline: true },
        { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
        { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
      )
      .setColor(role.color);
    return message.reply({ embeds: [embed] });
  }

  // ── .channelinfo ──────────────────────────────────────────────────────────────
  if (command === 'channelinfo') {
    const chan = message.mentions.channels.first() || message.channel;
    const embed = new EmbedBuilder()
      .setTitle(`#${chan.name}`)
      .addFields(
        { name: 'ID', value: chan.id, inline: true },
        { name: 'Type', value: `${chan.type}`, inline: true },
        { name: 'Created', value: `<t:${Math.floor(chan.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Topic', value: chan.topic || 'None' },
      )
      .setColor(0x5865F2);
    return message.reply({ embeds: [embed] });
  }

  // ── .servericon ───────────────────────────────────────────────────────────────
  if (command === 'servericon') {
    const icon = message.guild.iconURL({ dynamic: true, size: 1024 });
    if (!icon) return message.reply('❌ Server has no icon.');
    const embed = new EmbedBuilder()
      .setTitle(`🖼️ ${message.guild.name}'s Icon`)
      .setImage(icon)
      .setColor(0x5865F2);
    return message.reply({ embeds: [embed] });
  }

  // ── .emojis ───────────────────────────────────────────────────────────────────
  if (command === 'emojis') {
    const emojis = message.guild.emojis.cache.map(e => `${e}`).slice(0, 30).join(' ') || 'None';
    return message.reply(`😀 **Server Emojis:** ${emojis}`);
  }

  // ── .boosts ───────────────────────────────────────────────────────────────────
  if (command === 'boosts') {
    return message.reply(`🚀 **Server Boosts:** ${message.guild.premiumSubscriptionCount} | Level ${message.guild.premiumTier}`);
  }

  // ── .created ──────────────────────────────────────────────────────────────────
  if (command === 'created') {
    const target = message.mentions.users.first() || message.author;
    return message.reply(`📅 **${target.username}** created their account <t:${Math.floor(target.createdTimestamp / 1000)}:R>`);
  }

  // ── .joined ───────────────────────────────────────────────────────────────────
  if (command === 'joined') {
    const target = message.mentions.members.first() || member;
    return message.reply(`📅 **${target.user.username}** joined the server <t:${Math.floor(target.joinedTimestamp / 1000)}:R>`);
  }

  // ── .vanity ───────────────────────────────────────────────────────────────────
  if (command === 'vanity') {
    return message.reply(`🔗 Put \`.${SERVER_VANITY}\` in your status to earn the Repped role!`);
  }

  // ── .partners ─────────────────────────────────────────────────────────────────
  if (command === 'partners') {
    const embed = new EmbedBuilder()
      .setTitle('🤝 Our Partners')
      .addFields({ name: 'TheHB', value: THEHB_INVITE })
      .setColor(0x5865F2);
    return message.reply({ embeds: [embed] });
  }

  // ── .stafflist ────────────────────────────────────────────────────────────────
  if (command === 'stafflist') {
    const staffRole = message.guild.roles.cache.find(r => r.name === STAFF_ROLE_NAME);
    if (!staffRole) return message.reply('❌ Staff role not found.');
    const staffMembers = staffRole.members.map(m => m.user.tag).join('\n') || 'None';
    const embed = new EmbedBuilder()
      .setTitle('🛡️ Staff Members')
      .setDescription(staffMembers)
      .setColor(0x5865F2);
    return message.reply({ embeds: [embed] });
  }

  // ── .gw ───────────────────────────────────────────────────────────────────────
  if (command === 'gw') {
    const embed = new EmbedBuilder()
      .setTitle('🎉 Giveaway Info')
      .setDescription('Use `.gstart` to start a giveaway, `.gend` to end one, or `.greroll` to reroll.')
      .setColor(0xFFD700);
    return message.reply({ embeds: [embed] });
  }

  // ── .gstart ───────────────────────────────────────────────────────────────────
  if (command === 'gstart') {
    if (!isStaff(member)) return message.reply('❌ Staff only.');
    const prize = args.join(' ') || 'Mystery Prize';
    const embed = new EmbedBuilder()
      .setTitle('🎉 GIVEAWAY!')
      .setDescription(`**Prize:** ${prize}\nReact with 🎉 to enter!`)
      .setColor(0xFFD700)
      .setTimestamp()
      .setFooter({ text: `Started by ${message.author.tag}` });
    const msg = await message.channel.send({ embeds: [embed] });
    await msg.react('🎉');
    return;
  }

  // ── .gend ─────────────────────────────────────────────────────────────────────
  if (command === 'gend') {
    if (!isStaff(member)) return message.reply('❌ Staff only.');
    return message.reply('🎉 Giveaway ended! Use `.greroll` to pick a winner.');
  }

  // ── .greroll ──────────────────────────────────────────────────────────────────
  if (command === 'greroll') {
    if (!isStaff(member)) return message.reply('❌ Staff only.');
    return message.reply('🎲 Rerolling winner...');
  }

  // ── .clap ─────────────────────────────────────────────────────────────────────
  if (command === 'clap') {
    const text = args.join(' 👏 ');
    return message.reply(`👏 ${text} 👏`);
  }

  // ── Social Commands ───────────────────────────────────────────────────────────
  const socialCmds = { hug: '🤗', pat: '🫶', slap: '👋', poke: '👉', highfive: '🙌', cuddle: '🥰', wave: '👋', bonk: '🔨', wink: '😉', stare: '👀' };
  if (socialCmds[command]) {
    const target = message.mentions.users.first() || message.author;
    return message.reply(`${socialCmds[command]} **${message.author.username}** ${command}s **${target.username}**!`);
  }
  if (command === 'cry') return message.reply(`😢 **${message.author.username}** is crying... someone give them a hug!`);
  if (command === 'laugh') return message.reply(`😂 **${message.author.username}** is laughing their head off!`);
  if (command === 'dance') return message.reply(`💃 **${message.author.username}** is dancing! 🕺`);

  if (command === 'apply') return message.reply('📝 Staff applications: Check the announcements channel for info!');
  if (command === 'rules') return message.reply('📜 **Rules:** 1. Be respectful 2. No spam 3. No NSFW 4. Follow Discord ToS 5. Listen to staff');
  if (command === 'support') return message.reply(`🆘 Need help? Join: ${THEPL_INVITE}`);
  if (command === 'invite') return message.reply(`📨 Invite the bot to your server and contact the owner for the activation password!`);

});

client.login(process.env.DISCORD_TOKEN);
