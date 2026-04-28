const { getRole } = require('../helpers');
const { REPPED_ROLE, SERVER_VANITY } = require('../config');

module.exports = async (_old, np) => {
  try {
    const member = np?.member;
    if (!member) return;
    const role = getRole(np.guild, REPPED_ROLE);
    if (!role) return;
    const has = np.activities?.some(a =>
      a.state?.toLowerCase().includes(SERVER_VANITY) ||
      a.name?.toLowerCase().includes(SERVER_VANITY)
    );
    if (has && !member.roles.cache.has(role.id)) {
      await member.roles.add(role);
      np.guild.systemChannel?.send(`💠 ${member} earned **${REPPED_ROLE}** for repping the server!`);
    } else if (!has && member.roles.cache.has(role.id)) {
      await member.roles.remove(role);
    }
  } catch {}
};
