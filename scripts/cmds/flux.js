const fApi = async () => {
  const a = await require("axios").get("https://raw.githubusercontent.com/nazrul4x/Noobs/main/Apis.json");
  return a.data.api2;
};

module.exports.config = {
  name: "flux",
  aliases: ["fx"],
  version: "1.6.9",
  author: "Nazrul",
  role: 0,
  description: "Generate Flux image",
  category: "image",
  countDown: 3,
  guide: {
    en: "{pn} write a prompt"
  }
};

module.exports.onStart = async ({ api, event, args }) => {
  const prompt = args.join(" ");
  if (!prompt) {
    return api.sendMessage("Provide a prompt", event.threadID, event.messageID);
  }

  const startTime = Date.now();

  try {
    const res = await require("axios").get(`${await fApi()}/flux?prompt=${encodeURIComponent(prompt)}`, { responseType: 'stream' });

    const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);

    await api.sendMessage({
      body: `✅ Here's Your Generated image!\n• Prompt: ${prompt} \n• Time: ${timeTaken} (s)\n`,
      attachment: res.data }, event.threadID, event.messageID);

  } catch (error) {
    await api.sendMessage(`Error: ${error.message}`, event.threadID, event.messageID);
  }
};
