const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const cfg  = require('../config');
const data = require('../data');
const { isStaff, getRole, getStats, staffHelpEmbed } = require('../helpers');

module.exports = async (message, command, args) => {
  const { member, guild, channel, author } = message;

  // Guard: all commands here require staff
  if (!isStaff(member)) return message.reply('❌ You need the **Staff** role to use this command.');

  // ── .shelp ──────────────────────────────────────────────────────────────────
  if (command === 'shelp') return message.reply({ embeds: [staffHelpEmbed()] });

  // ── .nuke ───────────────────────────────────────────────────────────────────
  if (command === 'nuke') {
    try {
      const newChan = await channel.clone();
      await channel.delete();
      newChan.send({ embeds: [new EmbedBuilder()
        .setTitle('💥 Channel Nuked')
        .setDescription(`This channel was nuked by **${author.tag}**.`)
        .setColor(0xFF0000).setTimestamp()] });
    } catch { /* channel already deleted */ }
    return;
  }

  // ── .revive ─────────────────────────────────────────────────────────────────
  if (command === 'revive') {
    const role = getRole(guild, cfg.REVIVE_ROLE);
    const ping = role ? `<@&${role.id}>` : '@🔥 Chat Revive';
    return channel.send({ embeds: [new EmbedBuilder()
      .setTitle('🔥 Chat Revive!')
      .setDescription(`${ping} Come chat! Let's get it going! 🎉`)
      .setColor(0xFF4500).setTimestamp()] });
  }

  // ── .purge [n] ──────────────────────────────────────────────────────────────
  if (command === 'purge') {
    const n = parseInt(args[0]);
    if (isNaN(n) || n < 1 || n > 100) return message.reply('❌ Usage: `.purge [1-100]`');
    await channel.bulkDelete(n + 1, true).catch(() => null);
    const m = await channel.send(`🗑️ Deleted **${n}** messages.`);
    setTimeout(() => m.delete().catch(() => {}), 3000);
    return;
  }

  // ── .lock / .unlock ─────────────────────────────────────────────────────────
  if (command === 'lock')   { await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false }); return message.reply('🔒 Channel **locked**.'); }
  if (command === 'unlock') { await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null });  return message.reply('🔓 Channel **unlocked**.'); }

  // ── .slowmode [seconds] ─────────────────────────────────────────────────────
  if (command === 'slowmode') {
    const s = parseInt(args[0]) ?? 0;
    await channel.setRateLimitPerUser(s);
    return message.reply(`⏱️ Slowmode set to **${s}s**.`);
  }

  // ── .kick @user [reason] ────────────────────────────────────────────────────
  if (command === 'kick') {
    const t = message.mentions.members.first();
    if (!t) return message.reply('❌ Usage: `.kick @user [reason]`');
    const reason = args.slice(1).join(' ') || 'No reason provided';
    await t.kick(reason);
    return message.reply({ embeds: [new EmbedBuilder().setTitle('👢 Member Kicked').addFields({ name: 'User', value: t.user.tag, inline: true }, { name: 'By', value: author.tag, inline: true }, { name: 'Reason', value: reason }).setColor(0xFEE75C).setTimestamp()] });
  }

  // ── .ban @user [reason] ─────────────────────────────────────────────────────
  if (command === 'ban') {
    const t = message.mentions.members.first();
    if (!t) return message.reply('❌ Usage: `.ban @user [reason]`');
    const reason = args.slice(1).join(' ') || 'No reason provided';
    await t.ban({ reason });
    return message.reply({ embeds: [new EmbedBuilder().setTitle('🔨 Member Banned').addFields({ name: 'User', value: t.user.tag, inline: true }, { name: 'By', value: author.tag, inline: true }, { name: 'Reason', value: reason }).setColor(0xED4245).setTimestamp()] });
  }

  // ── .unban [userId] ─────────────────────────────────────────────────────────
  if (command === 'unban') {
    const userId = args[0];
    if (!userId) return message.reply('❌ Usage: `.unban [user ID]`');
    await guild.members.unban(userId).catch(() => null);
    return message.reply(`✅ Unbanned user **${userId}**.`);
  }

  // ── .mute @user [minutes] ───────────────────────────────────────────────────
  if (command === 'mute') {
    const t = message.mentions.members.first();
    if (!t) return message.reply('❌ Usage: `.mute @user [minutes]`');
    const mins = parseInt(args[1]) || 10;
    await t.timeout(mins * 60000, `Muted by ${author.tag}`);
    return message.reply(`🔇 **${t.user.tag}** muted for **${mins}** minute(s).`);
  }

  // ── .unmute @user ───────────────────────────────────────────────────────────
  if (command === 'unmute') {
    const t = message.mentions.members.first();
    if (!t) return message.reply('❌ Usage: `.unmute @user`');
    await t.timeout(null);
    return message.reply(`🔊 **${t.user.tag}** has been unmuted.`);
  }

  // ── .timeout @user [minutes] [reason] ─────────────────────────────────────
  if (command === 'timeout') {
    const t = message.mentions.members.first();
    if (!t) return message.reply('❌ Usage: `.timeout @user [minutes] [reason]`');
    const mins = parseInt(args[1]) || 5;
    const reason = args.slice(2).join(' ') || 'No reason';
    await t.timeout(mins * 60000, reason);
    return message.reply(`⏰ **${t.user.tag}** timed out for **${mins}** minute(s). Reason: ${reason}`);
  }

  // ── .untimeout @user ────────────────────────────────────────────────────────
  if (command === 'untimeout') {
    const t = message.mentions.members.first();
    if (!t) return message.reply('❌ Usage: `.untimeout @user`');
    await t.timeout(null);
    return message.reply(`✅ Timeout removed from **${t.user.tag}**.`);
  }

  // ── .warn @user [reason] ────────────────────────────────────────────────────
  if (command === 'warn') {
    const t = message.mentions.members.first();
    if (!t) return message.reply('❌ Usage: `.warn @user [reason]`');
    const reason = args.slice(1).join(' ') || 'No reason';
    if (!data.warnings.has(t.id)) data.warnings.set(t.id, []);
    data.warnings.get(t.id).push({ reason, by: author.tag, time: new Date().toISOString() });
    const count = data.warnings.get(t.id).length;
    return message.reply({ embeds: [new EmbedBuilder().setTitle('⚠️ Warning Issued').addFields({ name: 'User', value: t.user.tag, inline: true }, { name: 'Total Warns', value: `${count}`, inline: true }, { name: 'Reason', value: reason }).setColor(0xFEE75C).setTimestamp()] });
  }

  // ── .warns @user ────────────────────────────────────────────────────────────
  if (command === 'warns') {
    const t = message.mentions.members.first() || member;
    const w = data.warnings.get(t.id) || [];
    if (!w.length) return message.reply(`✅ **${t.user.tag}** has no warnings.`);
    return message.reply({ embeds: [new EmbedBuilder().setTitle(`⚠️ Warnings — ${t.user.tag}`)
      .setDescription(w.map((x, i) => `**${i + 1}.** ${x.reason} — by ${x.by}`).join('\n'))
      .setColor(0xFEE75C).setFooter({ text: `${w.length} warning(s) total` })] });
  }

  // ── .clearwarns @user ───────────────────────────────────────────────────────
  if (command === 'clearwarns') {
    const t = message.mentions.members.first();
    if (!t) return message.reply('❌ Usage: `.clearwarns @user`');
    data.warnings.delete(t.id);
    return message.reply(`✅ All warnings cleared for **${t.user.tag}**.`);
  }

  // ── .role @user [RoleName] ──────────────────────────────────────────────────
  if (command === 'role') {
    const t = message.mentions.members.first();
    const roleName = args.slice(1).join(' ');
    if (!t || !roleName) return message.reply('❌ Usage: `.role @user [Role Name]`');
    const role = guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
    if (!role) return message.reply(`❌ Role **${roleName}** not found.`);
    await t.roles.add(role);
    return message.reply(`✅ Gave **${role.name}** to **${t.user.tag}**.`);
  }

  // ── .removerole @user [RoleName] ────────────────────────────────────────────
  if (command === 'removerole') {
    const t = message.mentions.members.first();
    const roleName = args.slice(1).join(' ');
    if (!t || !roleName) return message.reply('❌ Usage: `.removerole @user [Role Name]`');
    const role = guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
    if (!role) return message.reply(`❌ Role **${roleName}** not found.`);
    await t.roles.remove(role);
    return message.reply(`✅ Removed **${role.name}** from **${t.user.tag}**.`);
  }

  // ── .setnick @user [nickname] ───────────────────────────────────────────────
  if (command === 'setnick') {
    const t = message.mentions.members.first();
    if (!t) return message.reply('❌ Usage: `.setnick @user [nickname]`');
    const nick = args.slice(1).join(' ') || null;
    await t.setNickname(nick);
    return message.reply(`✅ Nickname set for **${t.user.tag}**: ${nick || '*(reset)*'}`);
  }

  // ── .massnick [nickname] ────────────────────────────────────────────────────
  if (command === 'massnick') {
    const nick = args.join(' ');
    if (!nick) return message.reply('❌ Usage: `.massnick [nickname]`');
    await guild.members.fetch();
    let changed = 0;
    for (const m of guild.members.cache.values()) {
      if (!m.manageable) continue;
      await m.setNickname(nick).catch(() => {});
      changed++;
    }
    return message.reply(`✅ Set nickname to **${nick}** for **${changed}** members.`);
  }

  // ── .massrole [RoleName] ────────────────────────────────────────────────────
  if (command === 'massrole') {
    const roleName = args.join(' ');
    if (!roleName) return message.reply('❌ Usage: `.massrole [Role Name]`');
    const role = guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
    if (!role) return message.reply(`❌ Role **${roleName}** not found.`);
    await guild.members.fetch();
    let added = 0;
    for (const m of guild.members.cache.values()) {
      if (m.roles.cache.has(role.id)) continue;
      await m.roles.add(role).catch(() => {});
      added++;
    }
    return message.reply(`✅ Gave **${role.name}** to **${added}** members.`);
  }

  // ── .announce [text] ────────────────────────────────────────────────────────
  if (command === 'announce') {
    const text = args.join(' ');
    if (!text) return message.reply('❌ Usage: `.announce [text]`');
    return channel.send({ embeds: [new EmbedBuilder().setTitle('📢 Announcement').setDescription(text).setColor(0xEB459E).setTimestamp().setFooter({ text: `Announced by ${author.tag}` })] });
  }

  // ── .say [text] ─────────────────────────────────────────────────────────────
  if (command === 'say') {
    const text = args.join(' ');
    if (!text) return message.reply('❌ Usage: `.say [text]`');
    await message.delete().catch(() => {});
    return channel.send(text);
  }

  // ── .embed [text] ───────────────────────────────────────────────────────────
  if (command === 'embed') {
    const text = args.join(' ');
    if (!text) return message.reply('❌ Usage: `.embed [text]`');
    return channel.send({ embeds: [new EmbedBuilder().setDescription(text).setColor(0x5865F2).setTimestamp()] });
  }

  // ── .dm @user [message] ─────────────────────────────────────────────────────
  if (command === 'dm') {
    const t = message.mentions.users.first();
    const text = args.slice(1).join(' ');
    if (!t || !text) return message.reply('❌ Usage: `.dm @user [message]`');
    await t.send(`📨 Message from **${guild.name}**: ${text}`).catch(() => null);
    return message.reply(`✅ DM sent to **${t.tag}**.`);
  }

  // ── .suggest [text] ─────────────────────────────────────────────────────────
  if (command === 'suggest') {
    const text = args.join(' ');
    if (!text) return message.reply('❌ Usage: `.suggest [text]`');
    const msg = await channel.send({ embeds: [new EmbedBuilder().setTitle('💡 Suggestion').setDescription(text).setColor(0xFEE75C).setFooter({ text: `Suggested by ${author.tag}` }).setTimestamp()] });
    await msg.react('✅');
    await msg.react('❌');
    return;
  }

  // ── .editsnipe ──────────────────────────────────────────────────────────────
  if (command === 'editsnipe') return message.reply('🔍 Edit-snipe requires extra tracking — coming soon!');

  // ── .invitelist ─────────────────────────────────────────────────────────────
  if (command === 'invitelist') {
    try {
      const invites = await guild.invites.fetch();
      if (!invites.size) return message.reply('❌ No active invites.');
      const list = invites.map(inv =>
        `\`${inv.code}\` — **${inv.inviter?.tag || 'Unknown'}** — **${inv.uses}** uses — expires: ${inv.expiresAt ? `<t:${Math.floor(inv.expiresTimestamp / 1000)}:R>` : 'Never'}`
      ).join('\n').slice(0, 4000);
      return message.reply({ embeds: [new EmbedBuilder().setTitle(`📋 Active Invites (${invites.size})`).setDescription(list).setColor(0x5865F2)] });
    } catch { return message.reply('❌ Missing Manage Guild permission.'); }
  }

  // ── .addinvites @user [n] ───────────────────────────────────────────────────
  if (command === 'addinvites') {
    const t = message.mentions.members.first();
    const n = parseInt(args[1]);
    if (!t || isNaN(n) || n < 1) return message.reply('❌ Usage: `.addinvites @user [amount]`');
    const s = getStats(data.inviteCount, t.id);
    data.inviteCount.set(t.id, { regular: s.regular + n, left: s.left });
    return message.reply(`✅ Added **${n}** invites to **${t.user.tag}**. New total: **${s.regular + n}**.`);
  }

  // ── .removeinvites @user [n] ────────────────────────────────────────────────
  if (command === 'removeinvites') {
    const t = message.mentions.members.first();
    const n = parseInt(args[1]);
    if (!t || isNaN(n) || n < 1) return message.reply('❌ Usage: `.removeinvites @user [amount]`');
    const s = getStats(data.inviteCount, t.id);
    data.inviteCount.set(t.id, { regular: Math.max(0, s.regular - n), left: s.left });
    return message.reply(`✅ Removed **${n}** invites from **${t.user.tag}**.`);
  }

  // ── .resetinvites @user ─────────────────────────────────────────────────────
  if (command === 'resetinvites') {
    const t = message.mentions.members.first();
    if (!t) return message.reply('❌ Usage: `.resetinvites @user`');
    data.inviteCount.set(t.id, { regular: 0, left: 0 });
    return message.reply(`✅ Reset invite count for **${t.user.tag}**.`);
  }

  // ── .resetmsgs @user ────────────────────────────────────────────────────────
  if (command === 'resetmsgs') {
    const t = message.mentions.members.first();
    if (!t) return message.reply('❌ Usage: `.resetmsgs @user`');
    data.msgCount.set(t.id, 0);
    return message.reply(`✅ Reset message count for **${t.user.tag}**.`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  🎉 GIVEAWAY HOSTING
  // ══════════════════════════════════════════════════════════════════════════

  // .gstart [prize] — start a new giveaway
  if (command === 'gstart') {
    if (data.activeGW.has(guild.id)) return message.reply('❌ There is already an active giveaway! End it first with `.gend`.');
    const prize = args.join(' ');
    if (!prize) return message.reply('❌ Usage: `.gstart [prize name]`');
    const gwObj = { prize, hostId: author.id, hostTag: author.tag, type: 'Nreq', winnerCount: 1, messageId: null, entrants: new Set() };
    const embed = new EmbedBuilder()
      .setTitle('🎉 GIVEAWAY!')
      .setDescription(`**Prize:** ${prize}\n\nReact with 🎉 to enter!\n\n**Host:** ${author}\n**Winners:** 1\n**Type:** Nreq`)
      .setColor(0xFFD700)
      .setTimestamp()
      .setFooter({ text: `Hosted by ${author.tag}` });
    const msg = await channel.send({ embeds: [embed] });
    await msg.react('🎉');
    gwObj.messageId = msg.id;
    gwObj.channelId = channel.id;
    data.activeGW.set(guild.id, gwObj);
    return message.reply(`✅ Giveaway started! Prize: **${prize}**`);
  }

  // .greq — change current giveaway type to REQ
  if (command === 'greq') {
    const gw = data.activeGW.get(guild.id);
    if (!gw) return message.reply('❌ No active giveaway.');
    gw.type = 'REQ';
    data.activeGW.set(guild.id, gw);
    return message.reply('✅ Giveaway type set to **REQ**.');
  }

  // .gsetwinners [n] — set winner count
  if (command === 'gsetwinners') {
    const gw = data.activeGW.get(guild.id);
    if (!gw) return message.reply('❌ No active giveaway.');
    const n = parseInt(args[0]);
    if (isNaN(n) || n < 1) return message.reply('❌ Usage: `.gsetwinners [number]`');
    gw.winnerCount = n;
    data.activeGW.set(guild.id, gw);
    return message.reply(`✅ Winner count set to **${n}**.`);
  }

  // .gend — end the giveaway and pick winners
  if (command === 'gend') {
    const gw = data.activeGW.get(guild.id);
    if (!gw) return message.reply('❌ No active giveaway to end.');
    try {
      const gwChan = guild.channels.cache.get(gw.channelId);
      if (gwChan) {
        const gwMsg = await gwChan.messages.fetch(gw.messageId);
        const reaction = gwMsg.reactions.cache.get('🎉');
        const users = await reaction?.users.fetch();
        const eligible = users?.filter(u => !u.bot).map(u => u) || [];
        const winners = [];
        const pool = [...eligible];
        for (let i = 0; i < Math.min(gw.winnerCount, pool.length); i++) {
          const idx = Math.floor(Math.random() * pool.length);
          winners.push(pool.splice(idx, 1)[0]);
        }
        const winnerText = winners.length ? winners.map(u => `<@${u.id}>`).join(', ') : 'No valid entrants.';
        await channel.send({ embeds: [new EmbedBuilder()
          .setTitle('🎉 Giveaway Ended!')
          .addFields(
            { name: '🎁 Prize',   value: gw.prize,      inline: true },
            { name: '🏆 Winners', value: winnerText,     inline: true },
            { name: '📊 Entries', value: `${eligible.length}`, inline: true },
          )
          .setColor(0x57F287).setTimestamp().setFooter({ text: `Hosted by ${gw.hostTag}` })] });
        data.activeGW.delete(guild.id);
      }
    } catch (e) { console.error(e); message.reply('❌ Error ending giveaway — check bot permissions.'); }
    return;
  }

  // .greroll — reroll a winner
  if (command === 'greroll') {
    return message.reply({ embeds: [new EmbedBuilder()
      .setTitle('🎲 Giveaway Reroll')
      .setDescription('To reroll, end the current giveaway and use `.gstart` for a new one, or provide the message ID here.')
      .setColor(0xFFD700)] });
  }

  // .gcancel — cancel the active giveaway without picking winners
  if (command === 'gcancel') {
    const gw = data.activeGW.get(guild.id);
    if (!gw) return message.reply('❌ No active giveaway.');
    data.activeGW.delete(guild.id);
    return message.reply('🗑️ Active giveaway has been **cancelled**.', );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  🔢 .NUMBER GAME  — host hosts, members guess
  // ══════════════════════════════════════════════════════════════════════════

  // .number [n] [hints on|off]
  if (command === 'number') {
    const n = parseInt(args[0]);
    if (isNaN(n)) return message.reply('❌ Usage: `.number [number] [hints on|off]`\nExample: `.number 42 hints on`');
    const hintsArg = args.slice(1).join(' ').toLowerCase();
    const hints = !hintsArg.includes('off'); // hints ON by default
    data.numberGame.set(guild.id, { number: n, hostId: author.id, active: true, hints });
    return channel.send({ embeds: [new EmbedBuilder()
      .setTitle('🔢 Guess The Number Event!')
      .setDescription(`A number has been set by ${author}!\n\n**Type a number in chat to guess!**\n\n${hints ? '💡 Hints enabled (too high / too low)' : '🔕 Hints disabled'}`)
      .setColor(0x5865F2)
      .setTimestamp()
      .setFooter({ text: 'First correct guess wins! DM the host to claim your prize.' })] });
  }

  // .stopnumber — stop an active number game
  if (command === 'stopnumber') {
    const ng = data.numberGame.get(guild.id);
    if (!ng?.active) return message.reply('❌ No active number game.');
    data.numberGame.set(guild.id, { ...ng, active: false });
    return message.reply(`🛑 Number game stopped. The number was **${ng.number}**.`);
  }

  // .setnumber [n] — change the number mid-game
  if (command === 'setnumber') {
    const ng = data.numberGame.get(guild.id);
    if (!ng?.active) return message.reply('❌ No active number game. Start one with `.number [n]`.');
    const n = parseInt(args[0]);
    if (isNaN(n)) return message.reply('❌ Usage: `.setnumber [number]`');
    data.numberGame.set(guild.id, { ...ng, number: n });
    return message.reply(`✅ Number updated silently.`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  🔧 EXTRA STAFF UTILITIES (20 new)
  // ══════════════════════════════════════════════════════════════════════════

  // .staffban @user [reason] — ban + log with embed
  if (command === 'staffban') {
    const t = message.mentions.members.first();
    if (!t) return message.reply('❌ Usage: `.staffban @user [reason]`');
    const reason = args.slice(1).join(' ') || 'Staff action';
    await t.ban({ reason });
    return channel.send({ embeds: [new EmbedBuilder().setTitle('🔨 Staff Ban').addFields({ name: 'User', value: t.user.tag }, { name: 'By', value: author.tag }, { name: 'Reason', value: reason }).setColor(0xED4245).setTimestamp()] });
  }

  // .softban @user [reason] — ban then unban (clears messages)
  if (command === 'softban') {
    const t = message.mentions.members.first();
    if (!t) return message.reply('❌ Usage: `.softban @user [reason]`');
    const reason = args.slice(1).join(' ') || 'Softban';
    await t.ban({ deleteMessageSeconds: 604800, reason });
    await guild.members.unban(t.id).catch(() => {});
    return message.reply(`✅ **${t.user.tag}** soft-banned (messages cleared, user can rejoin).`);
  }

  // .hackban [userId] [reason] — ban someone not in the server
  if (command === 'hackban') {
    const userId = args[0];
    if (!userId) return message.reply('❌ Usage: `.hackban [user ID] [reason]`');
    const reason = args.slice(1).join(' ') || 'Hackban';
    await guild.members.ban(userId, { reason });
    return message.reply(`✅ User **${userId}** has been hackbanned.`);
  }

  // .banlist — show list of banned users
  if (command === 'banlist') {
    const bans = await guild.bans.fetch();
    if (!bans.size) return message.reply('✅ No banned users.');
    const list = bans.map(b => `**${b.user.tag}** — ${b.reason || 'No reason'}`).slice(0, 20).join('\n');
    return message.reply({ embeds: [new EmbedBuilder().setTitle(`🚫 Banned Users (${bans.size})`).setDescription(list).setColor(0xED4245)] });
  }

  // .unbanall — remove all bans (use with caution)
  if (command === 'unbanall') {
    const bans = await guild.bans.fetch();
    let count = 0;
    for (const [id] of bans) { await guild.members.unban(id).catch(() => {}); count++; }
    return message.reply(`✅ Removed **${count}** bans.`);
  }

  // .muteall — mute all non-staff members (for emergencies)
  if (command === 'muteall') {
    await guild.members.fetch();
    let count = 0;
    for (const m of guild.members.cache.values()) {
      if (isStaff(m) || m.user.bot) continue;
      await m.timeout(60 * 60000).catch(() => {});
      count++;
    }
    return message.reply(`🔇 Muted **${count}** members for 60 minutes.`);
  }

  // .unmuteall — remove all timeouts
  if (command === 'unmuteall') {
    await guild.members.fetch();
    let count = 0;
    for (const m of guild.members.cache.values()) {
      if (!m.communicationDisabledUntil) continue;
      await m.timeout(null).catch(() => {});
      count++;
    }
    return message.reply(`🔊 Unmuted **${count}** members.`);
  }

  // .lockall — lock all text channels
  if (command === 'lockall') {
    let count = 0;
    for (const chan of guild.channels.cache.values()) {
      if (chan.type !== 0) continue; // 0 = GUILD_TEXT
      await chan.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false }).catch(() => {});
      count++;
    }
    return message.reply(`🔒 Locked **${count}** text channels.`);
  }

  // .unlockall — unlock all text channels
  if (command === 'unlockall') {
    let count = 0;
    for (const chan of guild.channels.cache.values()) {
      if (chan.type !== 0) continue;
      await chan.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null }).catch(() => {});
      count++;
    }
    return message.reply(`🔓 Unlocked **${count}** text channels.`);
  }

  // .slowall [seconds] — set slowmode in all channels
  if (command === 'slowall') {
    const s = parseInt(args[0]) || 5;
    let count = 0;
    for (const chan of guild.channels.cache.values()) {
      if (chan.type !== 0) continue;
      await chan.setRateLimitPerUser(s).catch(() => {});
      count++;
    }
    return message.reply(`⏱️ Set slowmode to **${s}s** in **${count}** channels.`);
  }

  // .clearchannel — delete and recreate channel without all the message history
  if (command === 'clearchannel') {
    try {
      const newChan = await channel.clone({ name: channel.name });
      await newChan.setPosition(channel.position);
      await channel.delete();
      newChan.send(`✅ Channel cleared by **${author.tag}**.`);
    } catch { message.reply('❌ Missing permissions.'); }
    return;
  }

  // .boostinfo @user — how many times has someone boosted?
  if (command === 'boostinfo') {
    const t = message.mentions.members.first() || member;
    const count = data.boostCounts.get(t.id) || 0;
    const b1 = t.roles.cache.find(r => r.name === cfg.BOOSTER1_ROLE);
    const b2 = t.roles.cache.find(r => r.name === cfg.BOOSTER2_ROLE);
    return message.reply({ embeds: [new EmbedBuilder()
      .setTitle(`🚀 Boost Info — ${t.user.username}`)
      .addFields(
        { name: 'Boost Count', value: `${count}`,                                        inline: true },
        { name: 'Booster Since', value: t.premiumSince ? `<t:${Math.floor(t.premiumSinceTimestamp / 1000)}:R>` : 'Not boosting', inline: true },
        { name: 'Booster Role', value: b2 ? `${cfg.BOOSTER2_ROLE}` : b1 ? `${cfg.BOOSTER1_ROLE}` : 'None', inline: true },
      )
      .setColor(0xFF73FA).setThumbnail(t.user.displayAvatarURL({ dynamic: true }))] });
  }

  // .boostlist — list all current server boosters
  if (command === 'boostlist') {
    await guild.members.fetch();
    const boosters = guild.members.cache.filter(m => m.premiumSince);
    if (!boosters.size) return message.reply('❌ No active boosters.');
    const list = boosters.map(m => `**${m.user.tag}** — since <t:${Math.floor(m.premiumSinceTimestamp / 1000)}:R>`).join('\n').slice(0, 4000);
    return message.reply({ embeds: [new EmbedBuilder().setTitle(`🚀 Server Boosters (${boosters.size})`).setDescription(list).setColor(0xFF73FA)] });
  }

  // .modlog — show recent warnings across all users
  if (command === 'modlog') {
    if (!data.warnings.size) return message.reply('✅ No warnings on record.');
    const lines = [];
    for (const [uid, warns] of data.warnings.entries()) {
      for (const w of warns) lines.push(`<@${uid}> — **${w.reason}** by ${w.by}`);
    }
    return message.reply({ embeds: [new EmbedBuilder().setTitle('📋 Mod Log — All Warnings').setDescription(lines.slice(0, 20).join('\n') || 'None').setColor(0xFEE75C)] });
  }

  // .serverbackup — show server summary (roles, channels, members)
  if (command === 'serverbackup') {
    return message.reply({ embeds: [new EmbedBuilder()
      .setTitle(`💾 Server Summary — ${guild.name}`)
      .addFields(
        { name: 'Members',  value: `${guild.memberCount}`,              inline: true },
        { name: 'Roles',    value: `${guild.roles.cache.size}`,         inline: true },
        { name: 'Channels', value: `${guild.channels.cache.size}`,      inline: true },
        { name: 'Emojis',   value: `${guild.emojis.cache.size}`,        inline: true },
        { name: 'Boosts',   value: `${guild.premiumSubscriptionCount}`, inline: true },
        { name: 'Stickers', value: `${guild.stickers.cache.size}`,      inline: true },
        { name: 'Created',  value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Owner',    value: `<@${guild.ownerId}>`,               inline: true },
      )
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .setColor(0x57F287).setTimestamp()] });
  }

  // .auditlog — show last 10 audit log entries
  if (command === 'auditlog') {
    try {
      const logs = await guild.fetchAuditLogs({ limit: 10 });
      const lines = logs.entries.map(e => `**${e.action}** by **${e.executor?.tag || 'Unknown'}** — <t:${Math.floor(e.createdTimestamp / 1000)}:R>`).join('\n');
      return message.reply({ embeds: [new EmbedBuilder().setTitle('📋 Recent Audit Log').setDescription(lines || 'No entries').setColor(0x5865F2)] });
    } catch { return message.reply('❌ Missing View Audit Log permission.'); }
  }

  // .warnlevel @user — show warning tier
  if (command === 'warnlevel') {
    const t = message.mentions.members.first() || member;
    const w = data.warnings.get(t.id) || [];
    const level = w.length === 0 ? '✅ Clean' : w.length < 3 ? '⚠️ Warned' : w.length < 5 ? '🔶 High Risk' : '🔴 Danger';
    return message.reply(`${level} — **${t.user.tag}** has **${w.length}** warning(s).`);
  }

  // .history @user — all warnings + invite + message info for one user
  if (command === 'history') {
    const t = message.mentions.members.first() || member;
    const w   = data.warnings.get(t.id) || [];
    const s   = getStats(data.inviteCount, t.id);
    const msgs = data.msgCount.get(t.id) || 0;
    const inv  = data.inviterMap.get(t.id);
    return message.reply({ embeds: [new EmbedBuilder()
      .setTitle(`📜 Full History — ${t.user.tag}`)
      .setThumbnail(t.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '⚠️ Warnings',    value: `${w.length}`,                             inline: true },
        { name: '💬 Messages',    value: `${msgs.toLocaleString()}`,                 inline: true },
        { name: '📨 Net Invites', value: `${s.regular - s.left}`,                   inline: true },
        { name: '✉️ Invited By',  value: inv ? `<@${inv.inviterId}>` : 'Unknown',   inline: true },
        { name: 'Joined',         value: `<t:${Math.floor(t.joinedTimestamp / 1000)}:R>`, inline: true },
        { name: 'Account Age',    value: `<t:${Math.floor(t.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: '⚠️ Warn Details', value: w.length ? w.map((x, i) => `${i+1}. ${x.reason} — by ${x.by}`).join('\n') : 'None' },
      )
      .setColor(0x5865F2).setTimestamp()] });
  }
};
