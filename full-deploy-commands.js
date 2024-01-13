const { REST, Routes } = require('discord.js');
const { clientId, token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);
const guildCommands = [];

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith('.js'));
  // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if (
      'data' in command &&
      'execute' in command &&
      (command.guildOnly === false || !('guildOnly' in command))
    ) {
      commands.push(command.data.toJSON());
    } else if ('guildOnly' in command && command.guildOnly === true) {
      guildCommands.push(command.data.name);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
}

const rest = new REST().setToken(token);

// deploy commands
(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`,
    );

    // refresh commands wherever your bot is deployed
    const data = await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });

    console.log(
      `Successfully reloaded ${data.length} application (/) command.s in all guilds.`,
    );
    console.log(
      `${guildCommands.length} commands were not refreshed since they are marked as guild commands. please run './guild-deploy-commands.js' to deploy in a specific guild or set 'guildOnly' to false in the commands you wish to deploy globally.`,
    );
  } catch (error) {
    console.error(error);
  }
})();
