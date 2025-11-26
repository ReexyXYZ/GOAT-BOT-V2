module.exports = {
  config: {
    name: "spam",
    aliases: ["s","spamming","sp"],
    author:"",
    role: 2,
    description: "Use for spamming Message",
    category: "admin",
    guide: "{pn} <limit> <message>"
  },

  onStart: async function ({ api, event, args }) {
	const amount = parseInt(args[0]);
	const message = args.slice(1).join(" ");

	if (isNaN(amount) || !message) {
		return api.sendMessage("❌ Use: /spam <limit> <message>", event.threadID);
	}

	for (let i = 0; i < amount; i++) {
		api.sendMessage(message, event.threadID);
	}
  },
};
