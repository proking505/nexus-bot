const cfg = require('./config');
const { EmbedBuilder } = require('discord.js');

const isStaff  = m => m.roles.cache.some(r => r.name === cfg.STAFF_ROLE);
const getRole  = (guild, name) => guild.roles.cache.find(r => r.name === name);
const getStats = (inviteCount, id) => inviteCount.get(id) || { regular: 0, left: 0 };

const fmtMs = ms => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  return `${String(h).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}.${String(ms % 1000).padStart(3,'0')}`;
};

const fmtSec = s => {
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  return `${String(h).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
};

function claimEmbed() {
  return new EmbedBuilder()
    .setTitle('🎉 Giveaway Claim Form')
    .setDescription('Please answer **all** of the following to claim your prize:')
    .addFields(
      { name: '1️⃣ Host',       value: 'Who is the giveaway host?' },
      { name: '2️⃣ Type',       value: 'Was it **Nreq** or **REQ**?' },
      { name: '3️⃣ Prize',      value: 'What prize do you want?' },
      { name: '4️⃣ Screenshot', value: 'Send a screenshot showing you won.' },
      { name: '5️⃣ REQ Only',   value: 'If REQ, also send your `/inviter` screenshot.' },
    )
    .setColor(0xFFD700)
    .setTimestamp()
    .setFooter({ text: 'Fill out ALL steps — incomplete claims will be ignored.' });
}

function memberHelpEmbed() {
  return new EmbedBuilder()
    .setTitle('📋 Member Commands')
    .setColor(0x5865F2)
    .addFields(
      { name: '🔗 Server Links',      value: '`.thepl` `.thehb`' },
      { name: '🎉 Giveaways',         value: '`.claim` `.gw`' },
      { name: '📨 Invite Tracking',   value: '`.inviter [@user]` `.invites [@user]` `.inviters` `.myinvite` `.inviteinfo [code]`' },
      { name: '💬 Messages',          value: '`.messages [@user]` `.msglb`' },
      { name: '⏱️ Timer',             value: '`.timer [mins] [label]` `.canceltimer` `.checktimer`' },
      { name: '⏱️ Stopwatch',         value: '`.sw start` `.sw stop` `.sw lap` `.sw reset` `.sw status`' },
      { name: '📊 Info',              value: '`.userinfo` `.serverinfo` `.avatar` `.banner` `.membercount` `.botinfo` `.uptime` `.stats` `.roleinfo` `.channelinfo` `.whois` `.created` `.joined` `.servericon` `.emojis` `.boosts` `.stafflist`' },
      { name: '🎭 Fun',               value: '`.8ball` `.coinflip` `.roll` `.rps` `.joke` `.roast` `.compliment` `.quote` `.fact` `.trivia` `.wouldyourather` `.truth` `.dare` `.ship` `.rate` `.mock` `.reverse` `.clap` `.color`' },
      { name: '💕 Social',            value: '`.hug` `.pat` `.slap` `.poke` `.highfive` `.facepalm` `.cuddle` `.wave` `.bonk` `.wink` `.stare` `.cry` `.laugh` `.dance`' },
      { name: '🏆 Economy',           value: '`.balance` `.daily` `.weekly` `.work` `.rob` `.give` `.leaderboard` `.inventory` `.shop`' },
      { name: '🎮 Games',             value: '`.slots` `.blackjack` `.guess` `.hangman` `.tictactoe`' },
      { name: '⚙️ Utility',           value: '`.poll` `.remind` `.afk` `.snipe` `.calc` `.timestamp` `.qr` `.report` `.ticket` `.rules` `.vanity` `.partners` `.ping`' },
    )
    .setFooter({ text: 'Staff: use .shelp for all commands | Prefix: .' });
}

function staffHelpEmbed() {
  return new EmbedBuilder()
    .setTitle('🛡️ Full Staff Command List')
    .setColor(0xED4245)
    .addFields(
      { name: '📨 Invite Mgmt',        value: '`.invitelist` `.addinvites` `.removeinvites` `.resetinvites`' },
      { name: '💬 Message Mgmt',       value: '`.resetmsgs [@user]`' },
      { name: '🎉 Giveaway Hosting',   value: '`.gstart [prize]` `.gend` `.greroll` `.gaddwinner` `.gsetping` `.gcancel`' },
      { name: '🔢 Number Game',        value: '`.number [n] [hints on/off]` `.stopsumber` `.setnumber`' },
      { name: '🔨 Moderation',         value: '`.ban` `.unban` `.kick` `.mute` `.unmute` `.warn` `.warns` `.clearwarns` `.timeout` `.untimeout`' },
      { name: '🧹 Channel Control',    value: '`.nuke` `.purge [n]` `.lock` `.unlock` `.slowmode [s]`' },
      { name: '📢 Communication',      value: '`.revive` `.announce` `.dm` `.embed` `.say` `.edit`' },
      { name: '👤 Member Mgmt',        value: '`.role` `.removerole` `.setnick` `.resetroles` `.massrole` `.massnick`' },
      { name: '⚙️ Server Mgmt',        value: '`.setprefix` `.setwelcome` `.setlog` `.setgwchan` `.staffban` `.staffkick`' },
      { name: '📋 Logs & Audit',       value: '`.auditlog` `.modlog` `.boostlog` `.serverbackup`' },
      { name: '🔧 Utility (Staff)',     value: '`.suggest` `.invitelist` `.poll` `.snipe` `.editsnipe`' },
      { name: '📊 Info (Staff)',        value: '`.shelp` `.userinfo` `.whois` `.membercount` `.stats` `.boosts`' },
      { name: '💡 All Member Cmds',    value: 'Staff have access to ALL member commands too.' },
    )
    .setFooter({ text: 'Staff-only | Requires 🏛️ ✧ Staff ✧ 🏛️ role' });
}

module.exports = { isStaff, getRole, getStats, fmtMs, fmtSec, claimEmbed, memberHelpEmbed, staffHelpEmbed };
