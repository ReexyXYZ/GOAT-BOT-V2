module.exports = {
  config: {
    name: "tag",
    version: "1.6.9",
    author: "Nazrul",
    countDown: 5,
    role: 0,
    description: "Tag users via reply, name search, or self-tag with a custom message.",
    category: "tag",
    guide: { en: "{pn} [name] [message] (reply to tag, self-tag, or tag by name in an arranged format)" }
  },

  onStart: async ({ message, event, api, args, usersData }) => {
    const senderID = event.senderID;
    const { messageReply } = event;
    const threadInfo = await api.getThreadInfo(event.threadID);
    const participants = threadInfo.participantIDs;

    let targets = [];
    let customMessage = args.join(" ");

    if (messageReply) {
      const user = await usersData.get(messageReply.senderID);
      targets.push({ id: messageReply.senderID, name: user?.name || "Darling" });

      if (!customMessage) customMessage = "";
    }
    else if (args.length > 0) {
      const searchName = args[0].toLowerCase();
      customMessage = args.slice(1).join(" ") || "";

      for (const id of participants) {
        const user = await usersData.get(id);
        if (user?.name?.toLowerCase().includes(searchName)) {
          targets.push({ id, name: user.name });
        }
      }

      targets.sort((a, b) => a.name.localeCompare(b.name));

      if (targets.length === 0) {
        return message.reply(`No user found with the name "${args[0]}"!`);
      }
    }

    else {
      const user = await usersData.get(senderID);
      targets.push({ id: senderID, name: user?.name || "Darling" });

      if (!customMessage) customMessage = "";
    }

    const mentions = targets.map(user => ({ id: user.id, tag: user.name }));
    const output = targets
      .map(user => `${user.name} ${customMessage}`.trim())
      .join("\n");

    return message.reply({
      body: output,
      mentions
    });
  }
};
