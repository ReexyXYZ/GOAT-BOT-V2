const { findUid } = global.utils;
const regExCheckURL = /^(http|https):\/\/(www\.)?facebook\.com\/[^ "]+$/;

module.exports = {
	config: {
		name: "uid",
		version: "1.6.9",
		author: "Nazrul",
		countDown: 5,
		role: 0,
		description: { en: "View facebook user id of user" },
		category: "info",
		guide: {
			en: "{pn}: view your uid\n{pn} @tag: view uid of tagged user\n{pn} <profile link>: view uid from link\nReply to a message to get uid"
		}
	},

	langs: {
		en: { syntaxError: "Please tag the person you want to view uid or leave it blank to view your own uid" }
	},

	onStart: async function ({ message, event, args, api }) {
		try {
			if (event.messageReply) return message.reply(event.messageReply.senderID.toString());
			if (args[0] && args[0].match(regExCheckURL)) {
				let results = [];
				for (const link of args) {
					try {
						let uid = api?.getUID ? await api.getUID(link) : await findUid(link);
						results.push(uid);
					} catch {
						results.push(`ERROR: ${link}`);
					}
				}
				return message.reply(results.join("\n"));
			}
			const { mentions } = event;
			if (mentions && Object.keys(mentions).length > 0) return message.reply(Object.keys(mentions).join("\n"));
			return message.reply(event.senderID.toString());
		} catch { }
	}
};
