const { SlashCommandBuilder } = require('discord.js');
const PlayerController = require('../Services/PlayerController.js');

const name = 'a';

const def = new SlashCommandBuilder()
  .setName(name)
  .setDescription('Add a youtube link to the playing queue.')
  .setDMPermission(false)
  .addStringOption(option =>
    option
      .setName('youtube_link')
      .setDescription('The HTTP link of your YouTube video')
      .setRequired(true)
	);

class Command
{
  async execute(client, itr)
  {
    let channelInfo = {
      guildId: itr.member.voice.guild.id,
      channelId: itr.member.voice.channelId,
      adapterCreator: itr.guild.voiceAdapterCreator,
    };

    let link = itr.options.getString('youtube_link');
    PlayerController.add(link, channelInfo, client);

    await itr.reply('Added link: ' + link);
    setTimeout(() => {
      itr.deleteReply();
    }, 5000);
  }
}

module.exports = { name, def, typeClass: Command };

/* TEST

/add  youtube_link:https://www.youtube.com/watch?v=QhLeI31jdAc

*/
