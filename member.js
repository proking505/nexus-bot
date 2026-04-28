const { EmbedBuilder } = require('discord.js');
const cfg = require('../config');
const data = require('../data');
const { getStats, fmtMs, claimEmbed, memberHelpEmbed } = require('../helpers');

// ─── Random helpers ───────────────────────────────────────────────────────────
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

module.exports = async (message, command, args) => {
  const { member, guild, channel, author } = message;

  // ── .help ──────────────────────────────────────────────────────────────────
  if (command === 'help') return message.reply({ embeds: [memberHelpEmbed()] });

  // ── .ping ──────────────────────────────────────────────────────────────────
  if (command === 'ping') return message.reply(`🏓 Pong! **${message.client.ws.ping}ms**`);

  // ── .thepl / .thehb ────────────────────────────────────────────────────────
  if (command === 'thepl') return message.reply({ embeds: [new EmbedBuilder().setTitle('🌟 Join ThePL!').setDescription(cfg.THEPL_INVITE).setColor(0x5865F2)] });
  if (command === 'thehb') return message.reply({ embeds: [new EmbedBuilder().setTitle('🌟 Join TheHB!').setDescription(cfg.THEHB_INVITE).setColor(0xEB459E)] });

  // ── .claim ─────────────────────────────────────────────────────────────────
  if (command === 'claim') return message.reply({ embeds: [claimEmbed()] });

  // ── .gw ────────────────────────────────────────────────────────────────────
  if (command === 'gw') {
    const gw = data.activeGW.get(guild.id);
    if (!gw) return message.reply('❌ No active giveaway right now.');
    return message.reply({ embeds: [new EmbedBuilder()
      .setTitle('🎉 Active Giveaway')
      .addFields(
        { name: '🎁 Prize',     value: gw.prize,            inline: true },
        { name: '👤 Host',      value: `<@${gw.hostId}>`,   inline: true },
        { name: '🏷️ Type',      value: gw.type || 'Nreq',   inline: true },
        { name: '🏆 Winners',   value: `${gw.winnerCount}`, inline: true },
      )
      .setColor(0xFFD700).setTimestamp()] });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  ⏱️ TIMERS
  // ══════════════════════════════════════════════════════════════════════════

  if (command === 'timer') {
    const mins = parseInt(args[0]);
    if (isNaN(mins) || mins < 1 || mins > 1440) return message.reply('❌ Usage: `.timer [minutes] [label]`  (max 1440 min)');
    const label = args.slice(1).join(' ') || 'Timer';
    if (data.timers.has(author.id)) return message.reply('❌ You already have a timer running! Use `.canceltimer` first.');
    let remaining = mins * 60;
    message.reply(`⏱️ **${label}** — Countdown started for **${mins}** minute(s)!`);
    const iv = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(iv);
        data.timers.delete(author.id);
        channel.send(`⏰ ${author} your **${label}** timer is done! Time's up!`);
      }
    }, 1000);
    data.timers.set(author.id, { intervalId: iv, label, totalSecs: mins * 60 });
    return;
  }

  if (command === 'canceltimer') {
    const t = data.timers.get(author.id);
    if (!t) return message.reply('❌ You have no active timer.');
    clearInterval(t.intervalId);
    data.timers.delete(author.id);
    return message.reply(`✅ **${t.label}** timer cancelled.`);
  }

  if (command === 'checktimer') {
    const t = data.timers.get(author.id);
    if (!t) return message.reply('❌ You have no active timer.');
    return message.reply(`⏱️ Your **${t.label}** timer is currently running!`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  ⏱️ STOPWATCH  (.sw start/stop/lap/reset/status)
  // ══════════════════════════════════════════════════════════════════════════

  if (command === 'sw' || command === 'stopwatch') {
    const action = (args[0] || 'start').toLowerCase();

    if (action === 'start') {
      if (data.stopwatches.has(author.id)) return message.reply('❌ Already running! Use `.sw stop` or `.sw reset`.');
      data.stopwatches.set(author.id, { startTime: Date.now(), lapTimes: [] });
      return message.reply('⏱️ Stopwatch **started**! Use `.sw lap`, `.sw stop`, or `.sw reset`.');
    }

    if (action === 'lap') {
      const sw = data.stopwatches.get(author.id);
      if (!sw) return message.reply('❌ No stopwatch running. Use `.sw start`.');
      const elapsed = Date.now() - sw.startTime;
      sw.lapTimes.push(elapsed);
      return message.reply(`🏁 **Lap ${sw.lapTimes.length}:** \`${fmtMs(elapsed)}\``);
    }

    if (action === 'stop') {
      const sw = data.stopwatches.get(author.id);
      if (!sw) return message.reply('❌ No stopwatch running.');
      const elapsed = Date.now() - sw.startTime;
      data.stopwatches.delete(author.id);
      const lapLines = sw.lapTimes.length
        ? sw.lapTimes.map((t, i) => `Lap ${i + 1}: \`${fmtMs(t)}\``).join('\n')
        : 'No laps recorded.';
      return message.reply({ embeds: [new EmbedBuilder()
        .setTitle('⏱️ Stopwatch Stopped')
        .addFields({ name: '⏱️ Total Time', value: `\`${fmtMs(elapsed)}\`` }, { name: '🏁 Laps', value: lapLines })
        .setColor(0x57F287)] });
    }

    if (action === 'reset') {
      data.stopwatches.delete(author.id);
      return message.reply('🔄 Stopwatch reset.');
    }

    if (action === 'status') {
      const sw = data.stopwatches.get(author.id);
      if (!sw) return message.reply('❌ No stopwatch running.');
      const elapsed = Date.now() - sw.startTime;
      return message.reply(`⏱️ Running for \`${fmtMs(elapsed)}\` — **${sw.lapTimes.length}** laps recorded.`);
    }

    return message.reply('❌ Usage: `.sw [start|stop|lap|reset|status]`');
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  📨 INVITE TRACKING
  // ══════════════════════════════════════════════════════════════════════════

  if (command === 'inviter') {
    const target = message.mentions.members.first() || member;
    const d = data.inviterMap.get(target.id);
    if (!d) return message.reply(`🔍 No invite data for **${target.user.username}**. They may have joined before the bot was online.`);
    return message.reply({ embeds: [new EmbedBuilder()
      .setTitle('📨 Inviter Lookup')
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '👤 Member',      value: `${target}`,                                inline: true },
        { name: '✉️ Invited By',  value: `<@${d.inviterId}> (${d.inviterTag})`,      inline: true },
        { name: '🔗 Code Used',   value: `\`${d.code}\``,                            inline: true },
      )
      .setColor(0x5865F2).setTimestamp().setFooter({ text: 'Invite Tracker' })] });
  }

  if (command === 'invites') {
    const target = message.mentions.members.first() || member;
    const s = getStats(data.inviteCount, target.id);
    const net = s.regular - s.left;
    return message.reply({ embeds: [new EmbedBuilder()
      .setTitle('📊 Invite Stats')
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '✅ Joined',    value: `${s.regular}`, inline: true },
        { name: '🚪 Left',     value: `${s.left}`,    inline: true },
        { name: '💎 Net',      value: `${net}`,        inline: true },
      )
      .setColor(0x57F287).setFooter({ text: 'Net = Joined − Left' })] });
  }

  if (command === 'inviters' || command === 'invitelb') {
    const sorted = [...data.inviteCount.entries()]
      .map(([id, s]) => ({ id, net: s.regular - s.left, ...s }))
      .sort((a, b) => b.net - a.net).slice(0, 10);
    if (!sorted.length) return message.reply('📊 No invite data yet!');
    const medals = ['🥇','🥈','🥉'];
    const lines = sorted.map((e, i) =>
      `${medals[i] || `**${i+1}.**`} <@${e.id}> — **${e.net}** net (${e.regular} joined, ${e.left} left)`
    ).join('\n');
    return message.reply({ embeds: [new EmbedBuilder().setTitle('🏆 Invite Leaderboard').setDescription(lines).setColor(0xFFD700)] });
  }

  if (command === 'myinvite') {
    try {
      const inv = await channel.createInvite({ maxAge: 0, maxUses: 0, reason: `Requested by ${author.tag}` });
      const embed = new EmbedBuilder().setTitle('🔗 Your Invite Link')
        .setDescription(`https://discord.gg/${inv.code}`)
        .addFields({ name: 'Track it', value: 'Use `.invites` to see how many people join!' })
        .setColor(0x5865F2);
      await author.send({ embeds: [embed] }).catch(() => null);
      return message.reply('📨 Invite link sent to your DMs!');
    } catch { return message.reply('❌ Could not create invite — check bot permissions.'); }
  }

  if (command === 'inviteinfo') {
    const code = args[0]?.replace('https://discord.gg/', '');
    if (!code) return message.reply('❌ Usage: `.inviteinfo [code]`');
    try {
      const inv = await message.client.fetchInvite(code);
      return message.reply({ embeds: [new EmbedBuilder().setTitle(`🔗 Invite: ${code}`)
        .addFields(
          { name: 'Server',     value: inv.guild?.name || 'Unknown',  inline: true },
          { name: 'Channel',    value: inv.channel?.name || 'Unknown',inline: true },
          { name: 'Created By', value: inv.inviter?.tag || 'Unknown', inline: true },
          { name: 'Uses',       value: `${inv.uses ?? '?'}`,          inline: true },
          { name: 'Max Uses',   value: `${inv.maxUses || '∞'}`,       inline: true },
          { name: 'Expires',    value: inv.expiresAt ? `<t:${Math.floor(inv.expiresTimestamp / 1000)}:R>` : 'Never', inline: true },
        ).setColor(0x5865F2)] });
    } catch { return message.reply('❌ Invalid or expired invite code.'); }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  💬 MESSAGE TRACKING
  // ══════════════════════════════════════════════════════════════════════════

  if (command === 'messages' || command === 'msgs') {
    const target = message.mentions.members.first() || member;
    const count = data.msgCount.get(target.id) || 0;
    return message.reply({ embeds: [new EmbedBuilder()
      .setTitle('💬 Message Count')
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${target.user.username}** has sent **${count.toLocaleString()}** messages since the bot came online.`)
      .setColor(0x5865F2).setFooter({ text: 'Only counts messages while bot is online' })] });
  }

  if (command === 'msglb' || command === 'msgleaderboard') {
    const sorted = [...data.msgCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (!sorted.length) return message.reply('💬 No message data yet!');
    const medals = ['🥇','🥈','🥉'];
    const lines = sorted.map(([id, c], i) =>
      `${medals[i] || `**${i+1}.**`} <@${id}> — **${c.toLocaleString()}** messages`
    ).join('\n');
    return message.reply({ embeds: [new EmbedBuilder().setTitle('💬 Chat Leaderboard').setDescription(lines).setColor(0x5865F2)] });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  📊 INFO COMMANDS
  // ══════════════════════════════════════════════════════════════════════════

  if (command === 'userinfo') {
    const target = message.mentions.members.first() || member;
    const msgs = data.msgCount.get(target.id) || 0;
    const s    = getStats(data.inviteCount, target.id);
    const inv  = data.inviterMap.get(target.id);
    return message.reply({ embeds: [new EmbedBuilder()
      .setTitle(`👤 ${target.user.tag}`)
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'ID',           value: target.id,                                                     inline: true },
        { name: 'Nickname',     value: target.nickname || 'None',                                     inline: true },
        { name: 'Joined',       value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`,          inline: true },
        { name: 'Account Age',  value: `<t:${Math.floor(target.user.createdTimestamp / 1000)}:R>`,   inline: true },
        { name: '💬 Messages',  value: `${msgs.toLocaleString()}`,                                    inline: true },
        { name: '📨 Net Invites',value: `${s.regular - s.left}`,                                     inline: true },
        { name: '✉️ Invited By', value: inv ? `<@${inv.inviterId}>` : 'Unknown',                     inline: true },
        { name: 'Roles',        value: target.roles.cache.filter(r => r.name !== '@everyone').map(r => `<@&${r.id}>`).join(', ') || 'None' },
      ).setColor(0x5865F2)] });
  }

  if (command === 'serverinfo') {
    const g = guild;
    return message.reply({ embeds: [new EmbedBuilder().setTitle(`🏠 ${g.name}`).setThumbnail(g.iconURL({ dynamic: true }))
      .addFields(
        { name: 'Owner',       value: `<@${g.ownerId}>`,          inline: true },
        { name: 'Members',     value: `${g.memberCount}`,          inline: true },
        { name: 'Channels',    value: `${g.channels.cache.size}`,  inline: true },
        { name: 'Roles',       value: `${g.roles.cache.size}`,     inline: true },
        { name: 'Boost Level', value: `Level ${g.premiumTier}`,    inline: true },
        { name: 'Boosters',    value: `${g.premiumSubscriptionCount}`, inline: true },
        { name: 'Created',     value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`, inline: true },
      ).setColor(0x57F287)] });
  }

  if (command === 'avatar') {
    const t = message.mentions.users.first() || author;
    return message.reply({ embeds: [new EmbedBuilder().setTitle(`🖼️ ${t.username}'s Avatar`).setImage(t.displayAvatarURL({ dynamic: true, size: 1024 })).setColor(0x5865F2)] });
  }

  if (command === 'banner') {
    const t = await (message.mentions.users.first() || author).fetch();
    const url = t.bannerURL({ dynamic: true, size: 1024 });
    if (!url) return message.reply('❌ No banner found.');
    return message.reply({ embeds: [new EmbedBuilder().setTitle(`🎨 ${t.username}'s Banner`).setImage(url).setColor(0x5865F2)] });
  }

  if (command === 'membercount')  return message.reply(`👥 **Members:** ${guild.memberCount}`);
  if (command === 'uptime')       return message.reply(`⏱️ Online since <t:${Math.floor((Date.now() - message.client.uptime) / 1000)}:R>`);
  if (command === 'boosts')       return message.reply(`🚀 **Boosts:** ${guild.premiumSubscriptionCount} | Level ${guild.premiumTier}`);
  if (command === 'emojis')       return message.reply(`😀 ${guild.emojis.cache.map(e => `${e}`).slice(0, 30).join(' ') || 'None'}`);
  if (command === 'stickers')     return message.reply(`🎨 **Stickers:** ${guild.stickers.cache.size}`);
  if (command === 'created')      { const t = message.mentions.users.first() || author; return message.reply(`📅 **${t.username}** created account <t:${Math.floor(t.createdTimestamp / 1000)}:R>`); }
  if (command === 'joined')       { const t = message.mentions.members.first() || member; return message.reply(`📅 **${t.user.username}** joined <t:${Math.floor(t.joinedTimestamp / 1000)}:R>`); }
  if (command === 'timestamp')    { const now = Math.floor(Date.now() / 1000); return message.reply(`🕐 Unix: \`${now}\` → <t:${now}:F>`); }
  if (command === 'servericon')   { const icon = guild.iconURL({ dynamic: true, size: 1024 }); if (!icon) return message.reply('❌ No icon.'); return message.reply({ embeds: [new EmbedBuilder().setTitle(`🖼️ ${guild.name}`).setImage(icon).setColor(0x5865F2)] }); }
  if (command === 'vanity')       return message.reply(`🔗 Put \`${cfg.SERVER_VANITY}\` in your status to earn the **${cfg.REPPED_ROLE}** role!`);
  if (command === 'partners')     { return message.reply({ embeds: [new EmbedBuilder().setTitle('🤝 Partners').addFields({ name: 'TheHB', value: cfg.THEHB_INVITE }).setColor(0x5865F2)] }); }
  if (command === 'rules')        { return message.reply({ embeds: [new EmbedBuilder().setTitle('📜 Server Rules').setDescription('1. Be respectful\n2. No spam\n3. No NSFW\n4. Follow Discord ToS\n5. Listen to staff').setColor(0xED4245)] }); }
  if (command === 'ticket')       { return message.reply({ embeds: [new EmbedBuilder().setTitle('🎟️ Support Ticket').setDescription('A staff member will assist you shortly.').setColor(0x5865F2).setTimestamp()] }); }
  if (command === 'apply')        return message.reply('📝 Check announcements for staff application info!');

  if (command === 'botinfo') {
    return message.reply({ embeds: [new EmbedBuilder().setTitle('🤖 Bot Info')
      .setThumbnail(message.client.user.displayAvatarURL())
      .addFields(
        { name: 'Tag',     value: message.client.user.tag,                                          inline: true },
        { name: 'Servers', value: `${message.client.guilds.cache.size}`,                            inline: true },
        { name: 'Uptime',  value: `<t:${Math.floor((Date.now() - message.client.uptime) / 1000)}:R>`, inline: true },
      ).setColor(0x5865F2)] });
  }

  if (command === 'stats') {
    return message.reply({ embeds: [new EmbedBuilder().setTitle('📊 Server Stats')
      .addFields(
        { name: 'Members',  value: `${guild.memberCount}`,              inline: true },
        { name: 'Channels', value: `${guild.channels.cache.size}`,      inline: true },
        { name: 'Roles',    value: `${guild.roles.cache.size}`,         inline: true },
        { name: 'Emojis',   value: `${guild.emojis.cache.size}`,        inline: true },
        { name: 'Boosts',   value: `${guild.premiumSubscriptionCount}`, inline: true },
      ).setColor(0x5865F2)] });
  }

  if (command === 'whois') {
    const target = message.mentions.members.first() || member;
    const inv = data.inviterMap.get(target.id);
    return message.reply({ embeds: [new EmbedBuilder().setTitle(`🔍 ${target.user.username}`)
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Tag',         value: target.user.tag,                                              inline: true },
        { name: 'ID',          value: target.id,                                                    inline: true },
        { name: 'Bot?',        value: target.user.bot ? 'Yes' : 'No',                              inline: true },
        { name: 'Joined',      value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`,         inline: true },
        { name: 'Created',     value: `<t:${Math.floor(target.user.createdTimestamp / 1000)}:R>`,   inline: true },
        { name: '✉️ Invited By',value: inv ? `<@${inv.inviterId}>` : 'Unknown',                    inline: true },
      ).setColor(0x5865F2)] });
  }

  if (command === 'roleinfo') {
    const role = message.mentions.roles.first() || guild.roles.cache.find(r => r.name.toLowerCase() === args.join(' ').toLowerCase());
    if (!role) return message.reply('❌ Role not found. Mention the role or type its exact name.');
    return message.reply({ embeds: [new EmbedBuilder().setTitle(`🎭 ${role.name}`)
      .addFields(
        { name: 'ID',          value: role.id,                               inline: true },
        { name: 'Color',       value: role.hexColor,                         inline: true },
        { name: 'Members',     value: `${role.members.size}`,                inline: true },
        { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No',       inline: true },
        { name: 'Hoisted',     value: role.hoist ? 'Yes' : 'No',             inline: true },
      ).setColor(role.color)] });
  }

  if (command === 'channelinfo') {
    const chan = message.mentions.channels.first() || channel;
    return message.reply({ embeds: [new EmbedBuilder().setTitle(`#${chan.name}`)
      .addFields(
        { name: 'ID',      value: chan.id,                                               inline: true },
        { name: 'Type',    value: `${chan.type}`,                                         inline: true },
        { name: 'Created', value: `<t:${Math.floor(chan.createdTimestamp / 1000)}:R>`,   inline: true },
        { name: 'Topic',   value: chan.topic || 'None' },
      ).setColor(0x5865F2)] });
  }

  if (command === 'stafflist') {
    const staffRole = guild.roles.cache.find(r => r.name === cfg.STAFF_ROLE);
    if (!staffRole) return message.reply('❌ Staff role not found.');
    const list = staffRole.members.map(m => m.user.tag).join('\n') || 'None';
    return message.reply({ embeds: [new EmbedBuilder().setTitle('🛡️ Staff Members').setDescription(list).setColor(0x5865F2)] });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  🎭 FUN COMMANDS
  // ══════════════════════════════════════════════════════════════════════════

  if (command === '8ball') {
    const responses = ['Yes!','No!','Maybe...','Absolutely!','Definitely not.','Ask again later.','Without a doubt!','Very doubtful.','Signs point to yes.','My sources say no.','It is certain.','Don\'t count on it.'];
    const q = args.join(' ');
    if (!q) return message.reply('❌ Ask a question! `.8ball [question]`');
    return message.reply(`🎱 **Q:** ${q}\n**A:** ${pick(responses)}`);
  }

  if (command === 'coinflip') return message.reply(`🪙 **${Math.random() < 0.5 ? 'Heads' : 'Tails'}!**`);

  if (command === 'roll') {
    const sides = parseInt(args[0]) || 6;
    return message.reply(`🎲 You rolled **${Math.floor(Math.random() * sides) + 1}** (d${sides})`);
  }

  if (command === 'rps') {
    const choices = ['rock','paper','scissors'];
    const userChoice = args[0]?.toLowerCase();
    if (!choices.includes(userChoice)) return message.reply('❌ Choose: `rock`, `paper`, or `scissors`.');
    const botChoice = pick(choices);
    const wins = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
    const result = userChoice === botChoice ? '🤝 Tie!' : wins[userChoice] === botChoice ? '🏆 You win!' : '🤖 Bot wins!';
    return message.reply(`You chose **${userChoice}** | Bot chose **${botChoice}** — ${result}`);
  }

  if (command === 'joke') {
    const jokes = [
      "Why don't scientists trust atoms? They make up everything!",
      "I told my wife she was drawing her eyebrows too high. She looked surprised.",
      "What do you call a fish with no eyes? A fsh!",
      "Why can't your nose be 12 inches long? Because then it'd be a foot!",
      "I used to hate facial hair, but then it grew on me.",
      "I only know 25 letters of the alphabet. I don't know y.",
      "What do you call a factory that makes okay products? A satisfactory.",
    ];
    return message.reply(`😂 ${pick(jokes)}`);
  }

  if (command === 'roast') {
    const target = message.mentions.users.first() || author;
    const roasts = [
      `${target} you're like a cloud — when you disappear, it's a beautiful day. ☁️`,
      `${target} I'd roast you, but my mom said I'm not allowed to burn trash. 🗑️`,
      `${target} you're not stupid; you just have bad luck thinking. 🧠`,
      `${target} even your dog waves at the neighbours more than you. 🐕`,
      `${target} you're the reason the gene pool needs a lifeguard. 🏊`,
    ];
    return message.reply(pick(roasts));
  }

  if (command === 'compliment') {
    const target = message.mentions.users.first() || author;
    const compliments = [
      `${target}, you light up every room you walk into! ✨`,
      `${target}, you are an absolute legend! 👑`,
      `${target}, the world is genuinely better with you in it. 🌟`,
      `${target}, your vibe is immaculate. 💯`,
    ];
    return message.reply(pick(compliments));
  }

  if (command === 'quote') {
    const quotes = [
      '"The only way to do great work is to love what you do." — Steve Jobs',
      '"In the middle of difficulty lies opportunity." — Albert Einstein',
      '"Success is not final, failure is not fatal." — Winston Churchill',
      '"Dream big and dare to fail." — Norman Vaughan',
      '"Be yourself; everyone else is already taken." — Oscar Wilde',
    ];
    return message.reply(`💬 ${pick(quotes)}`);
  }

  if (command === 'fact') {
    const facts = [
      'Honey never spoils — 3000-year-old honey was found in Egyptian tombs.',
      'A group of flamingos is called a "flamboyance."',
      'Octopuses have three hearts and blue blood.',
      'Bananas are technically berries, but strawberries are not.',
      'The human nose can detect over 1 trillion scents.',
      'A day on Venus is longer than a year on Venus.',
    ];
    return message.reply(`📚 **Fact:** ${pick(facts)}`);
  }

  if (command === 'trivia') {
    const questions = [
      { q: 'Closest planet to the Sun?', a: 'Mercury' },
      { q: 'How many sides does a hexagon have?', a: '6' },
      { q: 'Capital of France?', a: 'Paris' },
      { q: 'What is H2O commonly known as?', a: 'Water' },
      { q: 'How many legs does a spider have?', a: '8' },
    ];
    const picked = pick(questions);
    await message.reply(`❓ **Trivia:** ${picked.q}\n*(Answer revealed in 10 seconds!)*`);
    setTimeout(() => channel.send(`✅ **Answer:** ${picked.a}`), 10000);
    return;
  }

  if (command === 'wouldyourather') {
    const opts = [['fly','be invisible'],['live in the ocean','live in space'],['always be hot','always be cold'],['lose your phone','lose your wallet']];
    const [a, b] = pick(opts);
    return message.reply(`🤔 **Would you rather:** ${a} **OR** ${b}?`);
  }

  if (command === 'truth') {
    const truths = ['What is your biggest fear?','Have you ever lied to a close friend?','What is your most embarrassing moment?','What is something you have never told anyone?'];
    return message.reply(`🤍 **Truth:** ${pick(truths)}`);
  }

  if (command === 'dare') {
    const dares = ['Send a voice message in your best opera voice.','Change your nickname to "Potato Lord" for 10 mins.','Send a GIF of a dancing cat.','Type your next 5 messages with your eyes closed.'];
    return message.reply(`🔥 **Dare:** ${pick(dares)}`);
  }

  if (command === 'ship') {
    const u1 = message.mentions.users.first();
    const u2 = message.mentions.users.at(1) || author;
    const pct = Math.floor(Math.random() * 101);
    const bar = '💗'.repeat(Math.floor(pct / 10)) + '🖤'.repeat(10 - Math.floor(pct / 10));
    return message.reply(`💘 **${u1?.username || '???'} & ${u2.username}**\n${bar} **${pct}%** compatible!`);
  }

  if (command === 'rate') {
    const thing = args.join(' ') || 'yourself';
    return message.reply(`⭐ I rate **${thing}** a **${Math.floor(Math.random() * 11)}/10**!`);
  }

  if (command === 'mock')    { const t = args.join(' '); if (!t) return message.reply('❌ Provide text.'); return message.reply(`🤪 ${t.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join('')}`); }
  if (command === 'reverse') { const t = args.join(' '); if (!t) return message.reply('❌ Provide text.'); return message.reply(`🔄 ${t.split('').reverse().join('')}`); }
  if (command === 'clap')    { const t = args.join(' '); if (!t) return message.reply('❌ Provide text.'); return message.reply(`👏 ${t.split(' ').join(' 👏 ')} 👏`); }

  if (command === 'color') {
    const hex = args[0];
    if (!hex || !/^#?[0-9A-Fa-f]{6}$/.test(hex)) return message.reply('❌ Provide a valid hex colour (e.g. `#FF5733`)');
    return message.reply({ embeds: [new EmbedBuilder().setTitle(`🎨 Colour: ${hex}`).setColor(parseInt(hex.replace('#', ''), 16)).setDescription('Colour preview!')] });
  }

  if (command === 'qr') {
    const text = args.join(' ');
    if (!text) return message.reply('❌ Usage: `.qr [text or URL]`');
    return message.reply({ embeds: [new EmbedBuilder().setTitle('📱 QR Code').setImage(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(text)}`).setColor(0x5865F2)] });
  }

  if (command === 'remind') {
    const mins = parseInt(args[0]);
    const reminder = args.slice(1).join(' ');
    if (isNaN(mins) || !reminder) return message.reply('❌ Usage: `.remind [minutes] [reminder text]`');
    message.reply(`⏰ I'll remind you in **${mins}** minute(s): **${reminder}**`);
    setTimeout(() => author.send(`⏰ Reminder: **${reminder}**`).catch(() => channel.send(`${author} ⏰ **${reminder}**`)), mins * 60000);
    return;
  }

  if (command === 'afk') {
    const reason = args.join(' ') || 'AFK';
    data.afkUsers.set(author.id, { reason, time: Date.now() });
    return message.reply(`😴 You are now AFK: **${reason}**`);
  }

  if (command === 'snipe') {
    const d = data.sniped.get(channel.id);
    if (!d) return message.reply('❌ Nothing to snipe!');
    return message.reply({ embeds: [new EmbedBuilder().setAuthor({ name: d.author, iconURL: d.avatar }).setDescription(d.content).setColor(0x5865F2).setTimestamp(d.time).setFooter({ text: 'Deleted message' })] });
  }

  if (command === 'calc') {
    try {
      const expr = args.join(' ');
      const safe = expr.replace(/[^0-9+\-*/().%^ ]/g, '');
      // eslint-disable-next-line no-eval
      const result = eval(safe);
      return message.reply(`🧮 **${expr} = ${result}**`);
    } catch { return message.reply('❌ Invalid expression.'); }
  }

  if (command === 'poll') {
    const text = args.join(' ');
    if (!text) return message.reply('❌ Usage: `.poll [question]`');
    const embed = new EmbedBuilder().setTitle('📊 Poll').setDescription(text).setColor(0x5865F2).setFooter({ text: `Poll by ${author.tag}` });
    const msg = await channel.send({ embeds: [embed] });
    await msg.react('✅');
    await msg.react('❌');
    return;
  }

  if (command === 'report') {
    const target = message.mentions.users.first();
    const reason = args.slice(1).join(' ') || 'No reason';
    if (!target) return message.reply('❌ Usage: `.report @user [reason]`');
    const staffChan = guild.channels.cache.find(c => c.name.toLowerCase().includes('staff') || c.name.toLowerCase().includes('mod-log'));
    const embed = new EmbedBuilder().setTitle('🚨 Report').addFields(
      { name: 'Reported User', value: target.tag, inline: true },
      { name: 'Reported By', value: author.tag, inline: true },
      { name: 'Reason', value: reason },
    ).setColor(0xFF0000).setTimestamp();
    if (staffChan) await staffChan.send({ embeds: [embed] });
    return message.reply('✅ Report submitted to staff!');
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  💕 SOCIAL ACTIONS
  // ══════════════════════════════════════════════════════════════════════════

  const socials = { hug:'🤗 hugs', pat:'🫶 pats', slap:'👋 slapped', poke:'👉 poked', highfive:'🙌 high-fived', cuddle:'🥰 cuddled', wave:'👋 waves at', bonk:'🔨 bonked', wink:'😉 winked at', stare:'👀 stares at' };
  if (socials[command]) {
    const t = message.mentions.users.first() || author;
    const [emoji, ...rest] = socials[command].split(' ');
    return message.reply(`${emoji} **${author.username}** ${rest.join(' ')} **${t.username}**!`);
  }
  if (command === 'facepalm') { const t = message.mentions.users.first(); return message.reply(`🤦 ${t ? `**${t.username}**...` : '**Bruh...**'}`); }
  if (command === 'cry')   return message.reply(`😢 **${author.username}** is crying... someone give them a hug!`);
  if (command === 'laugh') return message.reply(`😂 **${author.username}** is dying of laughter!`);
  if (command === 'dance') return message.reply(`💃 **${author.username}** is dancing! 🕺`);

  // ══════════════════════════════════════════════════════════════════════════
  //  🏆 ECONOMY
  // ══════════════════════════════════════════════════════════════════════════

  if (command === 'balance') return message.reply(`💰 **${author.username}'s** balance: **${data.economy.get(author.id) || 0} coins**`);
  if (command === 'daily')   { const b = data.economy.get(author.id) || 0; data.economy.set(author.id, b + 100); return message.reply(`💸 Claimed **100 coins**! New balance: **${b + 100}**`); }
  if (command === 'weekly')  { const b = data.economy.get(author.id) || 0; data.economy.set(author.id, b + 500); return message.reply(`💰 Claimed **500 coins**! New balance: **${b + 500}**`); }
  if (command === 'work')    { const earned = Math.floor(Math.random() * 50) + 10; const b = data.economy.get(author.id) || 0; data.economy.set(author.id, b + earned); const jobs = ['delivering pizza','fixing bugs','mowing lawns','teaching cats to sing']; return message.reply(`💼 You worked ${pick(jobs)} and earned **${earned} coins**!`); }
  if (command === 'rob')     { const t = message.mentions.members.first(); if (!t) return message.reply('❌ Mention someone to rob.'); return message.reply(Math.random() < 0.5 ? `🔒 Caught! You lost **${Math.floor(Math.random() * 30)} coins** as a fine.` : `💰 You stole **${Math.floor(Math.random() * 50) + 5} coins** from ${t}!`); }
  if (command === 'give')    { const t = message.mentions.members.first(); const amt = parseInt(args[1]); if (!t || isNaN(amt) || amt < 1) return message.reply('❌ Usage: `.give @user [amount]`'); return message.reply(`💸 Gave **${amt} coins** to ${t}!`); }
  if (command === 'leaderboard' || command === 'lb') return message.reply('🏆 Economy leaderboard — earn coins with `.work` and `.daily`!');
  if (command === 'inventory' || command === 'inv') return message.reply(`🎒 **${author.username}'s** inventory is empty — visit the shop!`);
  if (command === 'shop')    return message.reply({ embeds: [new EmbedBuilder().setTitle('🛒 Shop').setDescription('Coming soon! Items will be added here.').setColor(0x57F287)] });

  // ══════════════════════════════════════════════════════════════════════════
  //  🎮 GAMES
  // ══════════════════════════════════════════════════════════════════════════

  if (command === 'slots') {
    const sym = ['🍒','🍋','🍊','🍇','⭐','💎'];
    const s = () => pick(sym);
    const [a, b, c] = [s(), s(), s()];
    return message.reply(`🎰 | ${a} | ${b} | ${c} |\n${a === b && b === c ? '🎉 **JACKPOT! You win!**' : '😔 Better luck next time!'}`);
  }

  if (command === 'blackjack' || command === 'bj') {
    const card = () => pick([2,3,4,5,6,7,8,9,10,'J','Q','K','A']);
    const val  = c => (['J','Q','K'].includes(c) ? 10 : c === 'A' ? 11 : c);
    const [p1, p2, d1] = [card(), card(), card()];
    return message.reply(`🃏 **Blackjack!**\nYour hand: **${p1}, ${p2}** (${val(p1) + val(p2)})\nDealer shows: **${d1}**`);
  }

  if (command === 'hangman') {
    const words = ['discord','giveaway','server','community','moderator','booster'];
    const word = pick(words);
    return message.reply(`🪢 **Hangman!** Guess the word:\n${word.split('').map(() => '\\_').join(' ')}\n*(${word.length} letters)*`);
  }

  if (command === 'tictactoe' || command === 'ttt') {
    const t = message.mentions.members.first();
    if (!t || t.user.bot) return message.reply('❌ Mention a valid member to play against.');
    return message.reply(`🎮 **Tic-Tac-Toe!** ${author} vs ${t} — Full interactive game requires a dedicated game bot.`);
  }

  if (command === 'guess') {
    const num = Math.floor(Math.random() * 10) + 1;
    await message.reply('🔢 Guess a number between **1 and 10**! You have 15 seconds.');
    const collected = await channel.awaitMessages({ filter: m => m.author.id === author.id && !isNaN(m.content), max: 1, time: 15000 }).catch(() => null);
    if (!collected?.size) return channel.send('⏰ Time\'s up!');
    return channel.send(parseInt(collected.first().content) === num ? `🎉 **Correct!** It was **${num}**!` : `❌ **Wrong!** It was **${num}**.`);
  }
};
