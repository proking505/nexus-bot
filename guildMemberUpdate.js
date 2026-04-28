const { EmbedBuilder } = require('discord.js');
const { getRole } = require('../helpers');
const { BOOSTER1_ROLE, BOOSTER2_ROLE } = require('../config');
const data = require('../data');

module.exports = async (oldMember, newMember) => {
  const wasBooster = !!oldMember.premiumSince;
  const isBooster  = !!newMember.premiumSince;
  if (wasBooster || !isBooster) return; // only fires on new boost

  const uid     = newMember.id;
  const current = (data.boostCounts.get(uid) || 0) + 1;
  data.boostCounts.set(uid, current);

  const b1 = getRole(newMember.guild, BOOSTER1_ROLE);
  const b2 = getRole(newMember.guild, BOOSTER2_ROLE);
  const sys = newMember.guild.systemChannel;

  if (current === 1 && b1) {
    await newMember.roles.add(b1).catch(() => {});
    sys?.send({ embeds: [new EmbedBuilder()
      .setTitle('🚀 New Server Booster!')
      .setDescription(`Thank you ${newMember} for boosting! You've earned **${BOOSTER1_ROLE}**! 🎉`)
      .setColor(0xFF73FA)
      .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp()] });
  } else if (current >= 2) {
    if (b1) await newMember.roles.remove(b1).catch(() => {});
    if (b2) await newMember.roles.add(b2).catch(() => {});
    sys?.send({ embeds: [new EmbedBuilder()
      .setTitle('💎 Legend Server Booster!')
      .setDescription(`${newMember} has now boosted **${current} times**! Upgraded to **${BOOSTER2_ROLE}**! You're a legend 👑`)
      .setColor(0xFFD700)
      .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp()] });
  }
};
