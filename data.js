module.exports = {
  sniped:      new Map(), // channelId → { content, author, avatar, time }
  afkUsers:    new Map(), // userId   → { reason, time }
  warnings:    new Map(), // userId   → [{ reason, by, time }]
  economy:     new Map(), // userId   → coins (number)
  msgCount:    new Map(), // userId   → total messages
  inviteCache: new Map(), // code     → { uses, inviterId, inviterTag }
  inviterMap:  new Map(), // memberId → { inviterId, inviterTag, code }
  inviteCount: new Map(), // userId   → { regular, left }
  timers:      new Map(), // userId   → { intervalId, label }
  stopwatches: new Map(), // userId   → { startTime, lapTimes[] }
  activeGW:    new Map(), // guildId  → giveaway object
  numberGame:  new Map(), // guildId  → { number, hostId, active, hints }
  boostCounts: new Map(), // userId   → boost count
};
