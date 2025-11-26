const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

module.exports = {
	config: {
		name: "help",
		aliases: ["hellp"],
		version: "2.0",
		author: "Rexy",
		countDown: 5,
		role: 0,
		shortDescription: "Show all bot commands beautifully",
		longDescription: "Display a categorized list of all available commands with a nice formatted style like Ayda bot menu.",
		category: "general",
		guide: {
			en: "{pn} — show command menu\n{pn} <cmd> — show info for a specific command\n{pn} search <keyword> — search commands by keyword\n{pn} category <category> — show commands of specific category"
		}
	},

	onStart: async function({ message, args, event, threadsData }) {
		const prefix = getPrefix(event.threadID);

		// Make a map of categories
		const cmds = Array.from(commands.values());
		const categories = {};
		cmds.forEach(cmd => {
			const cat = cmd.config.category?.toUpperCase() || "OTHER";
			if (!categories[cat]) categories[cat] = [];
			categories[cat].push(cmd.config.name);
		});

		// Handle specific command info
		if (args[0] && args[0] !== "search" && args[0] !== "category") {
			const name = args[0].toLowerCase();
			const command = commands.get(name) || aliases.get(name);
			if (!command)
				return message.reply(`❌ Command '${name}' not found.`);
			const info = command.config;
			return message.reply(
				`🌌 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗜𝗡𝗙𝗢 🌌\n\n` +
				`📜 Name: ${info.name}\n` +
				`🧠 Author: ${info.author || "Unknown"}\n` +
				`⚙️ Version: ${info.version || "1.0"}\n` +
				`📂 Category: ${info.category || "Uncategorized"}\n` +
				`⏳ Cooldown: ${info.countDown || 0}s\n` +
				`💬 Description: ${info.shortDescription || "No description"}\n\n` +
				`💡 Usage:\n${info.guide?.en || "No guide available"}`
			);
		}

		// Handle search
		if (args[0] === "search" && args[1]) {
			const keyword = args.slice(1).join(" ").toLowerCase();
			const matched = cmds.filter(cmd =>
				cmd.config.name.toLowerCase().includes(keyword) ||
				cmd.config.shortDescription?.toLowerCase().includes(keyword)
			);
			if (!matched.length)
				return message.reply(`❌ No commands found for '${keyword}'.`);
			return message.reply(
				`🔍 𝗦𝗘𝗔𝗥𝗖𝗛 𝗥𝗘𝗦𝗨𝗟𝗧𝗦 (${matched.length})\n\n❯ ${matched.map(c => c.config.name).join(", ")}`
			);
		}

		// Handle category filter
		if (args[0] === "category" && args[1]) {
			const catName = args[1].toUpperCase();
			const catCmds = categories[catName];
			if (!catCmds)
				return message.reply(`❌ Category '${catName}' not found.`);
			return message.reply(
				`📂 ${catName} [${catCmds.length}]\n❯ ${catCmds.join(", ")}`
			);
		}

		// Build full menu (Ayda style)
		let msg = "🌌 𝗕𝗢𝗧 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗠𝗘𝗡𝗨 🌌\n\n";
		const catOrder = Object.keys(categories).sort();
		let totalCmds = 0;

		for (const cat of catOrder) {
			const cmdsList = categories[cat];
			totalCmds += cmdsList.length;
			msg += `📂 ${cat} [${cmdsList.length}]\n❯ ${cmdsList.join(", ")}\n\n`;
		}

		msg += `⚙️ Total Commands: ${totalCmds}\n`;
		msg += `💫 Prefix: ${prefix}\n`;
		msg += `👑 Owner: Mohammad Rexy\n\n`;
		msg += `💡 Use: ${prefix}help <cmd>\n`;
		msg += `💡 Search: ${prefix}help search <word>\n`;
		msg += `💡 Category: ${prefix}help category <name>\n`;
		msg += `💡 Author: ${prefix}help author <name>\n`;

		message.reply(msg);
	}
};