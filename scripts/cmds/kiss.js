const DIG = require("discord-image-generation");
const fs = require("fs-extra");

module.exports = {
    config: {
        name: "kiss",
        aliases: ["smooch", "peck"],
        version: "1.0",
        author: "",
        countDown: 5,
        role: 0,
        shortDescription: "💋 Send a virtual kiss!",
        longDescription: "Surprise someone with a virtual kiss and show some love 💕.",
        category: "fun",
        guide: "{pn} @mention"
    },

    onStart: async function ({ api, message, event, args, usersData }) {
        try {
            const mentions = Object.keys(event.mentions);
            if (mentions.length === 0) {
                return message.reply("💌 Please mention someone to send a kiss! 😘");
            }

            let [one, two] = mentions.length === 1
                ? [event.senderID, mentions[0]]
                : [mentions[1], mentions[0]];

            const [avatarURL1, avatarURL2] = await Promise.all([
                usersData.getAvatarUrl(one),
                usersData.getAvatarUrl(two)
            ]);

            const img = await new DIG.Kiss().getImage(avatarURL1, avatarURL2);
            const pathSave = `${__dirname}/tmp/${one}_${two}_kiss.png`;
            await fs.writeFile(pathSave, Buffer.from(img));

            const isSelfKiss = one === two;
            const content = isSelfKiss
                ? "💋 Sending a self-love kiss! 💞"
                : `💏 ${await usersData.getName(one)} just gave ${await usersData.getName(two)} a big smooch! 😘`;

            await message.reply({
                body: content,
                attachment: fs.createReadStream(pathSave)
            });

            fs.unlink(pathSave, err => {
                if (err) console.error("Error deleting temporary file:", err);
            });

        } catch (error) {
            console.error("💔 Error generating kiss image:", error);
            message.reply("❌ Oh no! Something went wrong trying to send the kiss. Try again later.");
        }
    }
};
