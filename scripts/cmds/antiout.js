module.exports = {
  config: {
    name: "antiout",
    version: "1.0",
    author: "Nazrul",
    countDown: 5,
    role: 1,
    shortDescription: "Toggle antiout system",
    longDescription: "Enable or disable antiout for group",
    category: "boxchat",
    guide: "{pn} [on | off]",
    envConfig: {
      deltaNext: 5
    }
  },
  onStart: async function({ message, event, threadsData, args }) {
    let antiout = await threadsData.get(event.threadID, "settings.antiout");
    if (antiout === undefined) {
      await threadsData.set(event.threadID, true, "settings.antiout");
      antiout = true;
    }
    if (!["on", "off"].includes((args[0] || "").toLowerCase())) {
      return message.reply("• Usage: /antiout on | off");
    }
    const status = args[0].toLowerCase() === "on";
    await threadsData.set(event.threadID, status, "settings.antiout");
    return message.reply(`✅ Antiout is now ${status ? "activated" : "deactivated"}.`);
  },
  onEvent: async function({ api, event, threadsData }) {
    const antiout = await threadsData.get(event.threadID, "settings.antiout");
    if (antiout && event.logMessageData && event.logMessageData.leftParticipantFbId) {
      const userId = event.logMessageData.leftParticipantFbId;
      const threadInfo = await api.getThreadInfo(event.threadID);
      if (!threadInfo.participantIDs.includes(userId)) {
        try {
          await api.addUserToGroup(userId, event.threadID);
          console.log(`✅ User ${userId} has been re-added to the group.`);
        } catch {
          console.log(`❌ Failed to re-add user ${userId} to the group.`);
        }
      }
    }
  }
};
