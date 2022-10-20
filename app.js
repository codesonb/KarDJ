require('dotenv').config();

/** /
const fs = require('fs');
const ytdl = require('ytdl-core');
const stream = require('stream');
const Speaker = require('speaker');
const spawn = require('child_process').spawn;

let speaker = new Speaker();
let ffmpeg = spawn('ffmpeg', [
  '-i', 'pipe:',
  '-f', 's16le',
  '-acodec', 'pcm_s16le',
  'pipe:1']);

ffmpeg.stdout.pipe(speaker);

let link = 'https://www.youtube.com/watch?v=TBsUK7Q3voo';
ytdl(link, { filter: 'audioonly' })
   .pipe(ffmpeg.stdin)

/*/
require('./Commands/__init.js');

const { Client, GatewayIntentBits} = require('discord.js');
const { CommandFactory } = require('./Commands/__factory.js');

// show link
const intents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildIntegrations,
  GatewayIntentBits.GuildWebhooks,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildMessageReactions,
  GatewayIntentBits.MessageContent,
];

const link = `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=${process.env.PERMISSION_FLAG}&scope=bot%20applications.commands`;
console.log(`Invitation Link: ${link}`);

// build bot
const bot = new Client({ intents });

bot.once('ready', () => {
	console.log('Ready!');
});

bot.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand())
    CommandFactory.process(bot, interaction);
});

// safe exit
function exitHandler(options, exitCode)
{
  bot.destroy();
  if (options.cleanup) console.log('KarDJ bot is exiting');
  if (exitCode || exitCode === 0) console.log('Exit code: ' + exitCode);
  if (options.exit) process.exit();
}
process.on('exit', exitHandler.bind(null,{cleanup:true}));  // normal exit
process.on('SIGINT', exitHandler.bind(null, {exit:true}));  // catches ctrl+c event
process.on('SIGUSR1', exitHandler.bind(null, {exit:true})); // catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR2', exitHandler.bind(null, {exit:true})); // catches "kill pid" (for example: nodemon restart)

//catches uncaught exceptions
// process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

// login
bot.login(process.env.DISCORD_TOKEN);


/**/