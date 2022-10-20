const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPlaylist } = require('../Services/PlayerController.js');

const name = 'ls';

const def = new SlashCommandBuilder()
  .setName(name)
  .setDescription('List all songs in the queue.')
  .setDMPermission(false);

class Command
{
  async execute(client, itr)
  {
    let list = getPlaylist();
    let msg  = list.length > 0
      ? list.map((x, i) => 
          `${i+1}. ${x.title}`
        ).join('\r\n')
      : 'No songs in the playlist.';

    let embed = new EmbedBuilder()
      .setTitle('Current Playlist')
      .setAuthor({ name: 'KarDJ' })
      .setColor(0xFF3300)
      .setDescription(msg);

    await itr.reply({ embeds: [embed] });
    setTimeout(() => {
      itr.deleteReply();
    }, 15000);
  }
}

module.exports = { name, def, typeClass: Command };

/* TEST

/add  youtube_link:https://www.youtube.com/watch?v=QhLeI31jdAc

*/
