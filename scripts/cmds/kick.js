module.exports = {
	config: {
		name: "kick",
		version: "1.3",
		author: "NTKhang",
		countDown: 5,
		role: 1,
		description: {
			en: "Kick member out of chat box"
		},
		category: "box chat",
		guide: {
			en: "   {pn} @tags: use to kick members who are tagged\n   {pn} (uid): use to kick a member by UID"
		}
	},

	langs: {
		en: {
			needAdmin: "⚠️ Please add admin for bot before using this feature",
			cannotKickSelf: "👶 you cannot kick yourself!",
			cannotKickProtected: "⚠ Shut up nonsense, I can't kick my owner!"
		}
	},

	onStart: async function ({ message, event, args, threadsData, api, getLang }) {
		const adminIDs = await threadsData.get(event.threadID, "adminIDs");
		const botID = api.getCurrentUserID();
		const senderID = event.senderID;
		const protectedUIDs = ["100049220893428", "100000975454984", "100007806468843"]; // Add multiple protected user IDs here

		// Check if the bot is admin in the thread
		if (!adminIDs.includes(botID)) return message.reply(getLang("needAdmin"));

		// Function to check and kick user, with UID protection
		async function kickAndCheckError(uid) {
			if (uid === botID) {
				message.reply(getLang("cannotKickSelf"));
				return "ERROR";
			}
			if (uid === senderID) {
				message.reply(getLang("cannotKickSelf"));
				return "ERROR";
			}
			if (protectedUIDs.includes(uid)) {
				message.reply(getLang("cannotKickProtected"));
				return "ERROR";
			}
			try {
				await api.removeUserFromGroup(uid, event.threadID);
			} catch (e) {
				message.reply(getLang("needAdmin"));
				return "ERROR";
			}
		}

		if (args[0] && !isNaN(args[0])) {
			const uid = args[0];
			if (await kickAndCheckError(uid) === "ERROR") return;
		} else {
			// If there's a mention or a reply
			if (!args[0]) {
				if (!event.messageReply) return message.SyntaxError();
				await kickAndCheckError(event.messageReply.senderID);
			} else {
				const uids = Object.keys(event.mentions);
				if (uids.length === 0) return message.SyntaxError();
				if (await kickAndCheckError(uids.shift()) === "ERROR") return;
				for (const uid of uids)
					api.removeUserFromGroup(uid, event.threadID);
			}
		}
	}
};
