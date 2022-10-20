const { EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, StreamType, NoSubscriberBehavior, demuxProbe } = require('@discordjs/voice');
const { google } = require('googleapis');

const GYT = google.youtube({ version: 'v3', auth: process.env.YOUTUBE_APIKEY });
const ytdl = require('ytdl-core');
const spawn = require('child_process').spawn;

//const fs = require('fs');
const { PassThrough } = require('stream');


//------------------------------------------------
let playlist = [];

// ----
let connection;
let subscription;
let player;
let playingEmbed;

// ----
function getConnection(channelInfo)
{
  if (!connection)
  {
    let info = {
      ...channelInfo,
      channelId: channelInfo.vchId
    };
    connection   = joinVoiceChannel(info);
    player       = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
      debug: true
    });
    subscription = connection.subscribe(player);

    player.on('error', error => {
      // console.error('Error:', error.message, 'with track', error.resource.metadata.title);
      console.log('Player Error:');
      console.log(error);
    });
  }
  return connection;
}

function pushPlaylist(client, item)
{
  let requireKickStart = (playlist.length <= 0);
  playlist.push(item);
  if (requireKickStart) playNext(client);
}

async function playNext(client)
{
  console.log('Play next..');
  let item = playlist[0];
  try
  {
    let cnn = getConnection(item.channelInfo);

    // convert google/video stream to webm format
    let ffmpeg = spawn('ffmpeg', [
      '-i', 'pipe:',        // pipe from stdin
      '-vn',                // no video
      '-bufsize', '1920K',  // buffer size
      '-crf', '60',         // constant rate factor
      '-c:a', 'libopus',    // audio encoder
      '-b:a', '192K',       // bit rate
      '-f', 'ogg',          // pipe format
      'pipe:1'              // pipe to stdout
    ]);

    ffmpeg.on('exit', exitCode => {
      if (exitCode != 0) {
        console.log('== FFMPEG ERROR v =======================');
        ffmpeg.stderr.pipe(process.stdout);
        console.log('== FFMPEG ERROR ^ =======================');
        ffmpeg.kill();
      }
      console.log('FFMpeg exit: ' + exitCode);
    });

    ffmpeg.on('close', e => {
      console.log('ffmpeg closed');
    });

    // create buffer
    let buf = new PassThrough({ highWaterMark: 16_777_216 });
    ffmpeg.stdout.pipe(buf);

    // create resource
    let resource = createAudioResource(buf, {
      inputType: StreamType.OggOpus,
      inlineVolume: true
    });

    player.play(resource);

    // start downloading at last
    ytdl(item.link, { filter: 'audioonly' })
      .pipe(ffmpeg.stdin);


    // -------------------------------------
    // send player message
    let channel = client.channels.cache.get(item.channelInfo.tchId);

    if (playingEmbed) { playingEmbed.delete(); }
    playingEmbed = await channel.send({ embeds: [new EmbedBuilder()
      .setColor(0x00FF99)
      .setAuthor({ name: 'KarDJ' })
      .setTitle('Now playing...')
      .setDescription(`>> ${item.title}\r\n${item.duration}`)
    ]});

    // -------------------------------------
    // play next song
    resource.playStream.once('finish', e => {
      playlist.shift(); // remove the played item
      if (playlist.length > 0)
      {
        playNext(client);
      } else {
        // cleanup
        subscription.unsubscribe();
        connection.destroy();
        player = null;
        subscription = null;
        connection = null;
      }
    });

  } catch (ex) {
    console.log('-----------------------------------');
    console.log(ex);
    console.log('-----------------------------------');
    let errMsg = `Failed to start the stream, make sure your YouTube link is correct: ${item.link}`;
    throw errMsg;
  }
}


class PlayerController
{
  search(q)
  {
    GYT.search({
      key: process.env.YOUTUBE_APIKEY,
      q, maxRequest: 5,
    }).then(rslt => {
      if (!rslt) return;
      console.log('Search YouTube: ' + rslt);
    });
  }

  getPlaylist() {
    return [...playlist];
  }

  async add(link, channelInfo, client)
  {
    /**/
    let ytId;
    if (ytdl.validateURL(link))
      ytId = ytdl.getURLVideoID(link);
    else if (ytdl.validateID(link))
      ytId = link;
    else {
      console.log('failed to parse link or vid');
      //return false;
    }


    let item;
    if (ytId)
    {
      let info = await GYT.videos.list({
        part: [ "contentDetails", "snippet" ],
        "id": [ ytId ]
      }).then(resp => {
        if (resp.status === 200) return resp.data.items[0];
        let errMsg = 'Error: Failed to query from Google API.'
        console.log(errMsg);
        itr.reply(errMsg);
      });

      item = {
        channelInfo, link, ytId,
        title: info.snippet.title,
        duration: info.contentDetails.duration,
      };
    } else {
      let rlist = [
        {
          link: 'https://www.youtube.com/watch?v=WY5j3Kt1ZQ8',
          ytId: 'WY5j3Kt1ZQ8',
          title: '張敬軒 Hins Cheung - 餘震',
          duration: 'PH3M40S',
        },
        {
          link: 'https://www.youtube.com/watch?v=ywyOCTLnLOU',
          ytId: 'ywyOCTLnLOU',
          title: '春秋',
          duration: 'PH4M19S',
        },
        {
          link: 'https://www.youtube.com/watch?v=Q-kkdN8QCbI',
          ytId: 'Q-kkdN8QCbI',
          title: '富士山下 - 李克勤, 容祖兒李克勤演唱會2015',
          duration: 'PH2M51S',
        },
        {
          link: 'https://www.youtube.com/watch?v=XhBHvy2jV6U',
          ytId: 'XhBHvy2jV6U',
          title: '黃耀明 彭羚 漩渦 concert yy',
          duration: 'PH3M54S',
        },
        {
          link: 'https://www.youtube.com/watch?v=vGRop9iCX7k',
          ytId: 'vGRop9iCX7k',
          title: '《Concert YY 黃偉文作品展演唱會》楊千嬅 - 勇 LIVE HD 1080P',
          duration: 'PH3M36S',
        },
        {
          link: 'https://www.youtube.com/watch?v=WY5j3Kt1ZQ8',
          ytId: '',
          title: '張敬軒 Hins Cheung - 餘震',
          duration: 'PH3M40S',
        },
        {
          link: 'https://www.youtube.com/watch?v=tLBHU92Gjyw',
          ytId: 'tLBHU92Gjyw',
          title: '《距離》MV｜麗英 LaiYing',
          duration: 'PH4M20S',
        },
        {
          link: 'https://www.youtube.com/watch?v=6G-9VYxH_zk',
          ytId: '6G-9VYxH_zk',
          title: 'Fairy Tail Ending 11 Glitter',
          duration: 'PH3M58S',
        },
        {
          link: 'https://www.youtube.com/watch?v=qlvE_owkBwI',
          ytId: 'qlvE_owkBwI',
          title: '林家謙 Terence Lam《時光倒流一句話》(Official Music Video)',
          duration: 'PH4M37S',
        },
        {
          link: 'https://www.youtube.com/watch?v=Y4nEEZwckuU',
          ytId: 'Y4nEEZwckuU',
          title: 'YOASOBI「群青」Official Music Video',
          duration: 'PH4M22S',
        },
        {
          link: 'https://www.youtube.com/watch?v=XK4tNE6mfko',
          ytId: 'XK4tNE6mfko',
          title: '麻枝 准×やなぎなぎ 「終わりの世界から」',
          duration: 'PH6M05S',
        },
        {
          link: 'https://www.youtube.com/watch?v=FauckqYSUZk',
          ytId: 'FauckqYSUZk',
          title: 'Fumika - その声消えないよ',
          duration: 'PH4M51S',
        },
        {
          link: 'https://www.youtube.com/watch?v=cU0Ubyc6M58',
          ytId: 'cU0Ubyc6M58',
          title: '《時雨》川嶋あい',
          duration: 'PH5M38S',
        },
        {
          link: 'https://www.youtube.com/watch?v=dFQ_n87Rzno',
          ytId: 'dFQ_n87Rzno',
          title: '《Endless Tears feat.日本R＆B歌手》CLIFF EDGE',
          duration: 'PH4M33S',
        },
        {
          link: 'https://www.youtube.com/watch?v=uxVvrjLZJjo',
          ytId: 'uxVvrjLZJjo',
          title: 'Restraint - 秋繪',
          duration: 'PH5M05S',
        },
        {
          link: 'https://www.youtube.com/watch?v=xcwgXULqfpQ',
          ytId: 'xcwgXULqfpQ',
          title: '秋繪 - Lemon (Cover：米津玄師)',
          duration: 'PH2M44S',
        },
        {
          link: 'https://www.youtube.com/watch?v=JcnCYQYl0Eo',
          ytId: 'JcnCYQYl0Eo',
          title: '彼女は旅に出る',
          duration: 'PH4M12S',
        },
        {
          link: 'https://www.youtube.com/watch?v=2CwBFr-Eoxg',
          ytId: '2CwBFr-Eoxg',
          title: 'ゆうゆ feat.初音ミク「深海少女」',
          duration: 'PH3M38S',
        },
        {
          link: 'https://www.youtube.com/watch?v=AvJuhgj09ng',
          ytId: 'AvJuhgj09ng',
          title: '浜崎あゆみ / Moments / 青鳥の虛像',
          duration: 'PH5M38S',
        },
        {
          link: 'https://www.youtube.com/watch?v=enyxp11FSaU',
          ytId: 'enyxp11FSaU',
          title: '只是太愛你 - 港樂x 張敬軒交響音樂會',
          duration: 'PH3M40S',
        },
        {
          link: 'https://www.youtube.com/watch?v=8_EYPzWr26s',
          ytId: '8_EYPzWr26s',
          title: 'Adrenaline!!!',
          duration: 'PH4M30S',
        },
        {
          link: 'https://www.youtube.com/watch?v=jsud2nBRj0g',
          ytId: 'jsud2nBRj0g',
          title: '奏 (かなで) - 高橋李依',
          duration: 'PH3M40S',
        },
        {
          link: 'https://www.youtube.com/watch?v=VKNfLWBNQH0',
          ytId: 'VKNfLWBNQH0',
          title: '【春先】MISIA－逢いたくていま 1080P',
          duration: 'PH5M51S',
        },
        {
          link: 'https://www.youtube.com/watch?v=0IueDUcDmRY',
          ytId: '0IueDUcDmRY',
          title: '手嶌葵「ただいま」Music Video',
          duration: 'PH5M52S',
        }];
        
        item = rlist[Math.floor(Math.random() * rlist.length)];
        item = {...item, channelInfo};
    }
   
    pushPlaylist(client, item);
  }
}

const _instance = new PlayerController();
module.exports = _instance;



