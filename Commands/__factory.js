
const fs = require('node:fs');

const commands = new Map();
const commandFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.command.js'));

for (const file of commandFiles) {
	const command = require(`./${file}`);
	commands.set(command.name, command.typeClass);
}

class CommandFactory
{
	process(client, itr)
	{
		let cmd = commands.get(itr.commandName);
		if (!cmd)
		{ console.log(`# Error: Command not found [${itr.commandName }]`); }
		else
		{ new cmd().execute(client, itr); }
	}
}

const _instance = new CommandFactory();
module.exports = { CommandFactory: _instance };

