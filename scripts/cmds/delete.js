module.exports = {
  config: {
    name: "delete",
    aliases: ["del","d"],
    author: "Nazrul",
    role: 2,
    category: "system"
  },

  onStart: async function ({ api, event, args }) {
    const fs = require('fs');
    const path = require('path');

    let fileName = args[0];

    if (!fileName) {
      api.sendMessage("Please provide a file name to delete.", event.threadID);
      return;
    }

    // Automatically append ".js" if not provided
    if (!fileName.endsWith('.js')) {
      fileName += '.js';
    }

    const filePath = path.join(__dirname, fileName);

    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(err);
        api.sendMessage(`❎ | Failed to delete ${fileName}.`, event.threadID);
        return;
      }
      api.sendMessage(`✅ ( ${fileName} ) Deleted successfully!`, event.threadID);
    });
  }
};
