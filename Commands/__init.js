const { REST, Routes } = require('discord.js');
const fs = require('node:fs');

const commands = [];
const commandFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.command.js'));

for (const file of commandFiles) {
	const command = require(`./${file}`);
	commands.push(command.def.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
	try {
		console.log(`Loading ${commands.length} commands.`);

		const data = await rest.put(
			Routes.applicationCommands(process.env.CLIENT_ID),
			{ body: commands },
		);

	} catch (error) {
		console.error(error);
	}
})();