const { SlashCommandBuilder } = require('discord.js');

const name = 'ping';

const def = new SlashCommandBuilder()
	.setName(name)
	.setDescription('Ping the server status.')
  .setDMPermission(false);

class Command
{
	execute(interaction)
	{
		interaction.reply('Pong!');
	}	
}

module.exports = { name, def, typeClass: Command };
