const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const speech = require('@google-cloud/speech');
const { execSync } = require('child_process');
const TELEGRAM_TOKEN = '5858987957:AAHMOb0kPoLRX9py1jxbTSdsWeTXj_wKumk'; // Substitua pelo seu token
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

 // Cliente Google Cloud Speech-to-Text

const client = new speech.SpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Oi! Sou um bot do GPT-3. Como posso ajudá-lo hoje?');
});

bot.on('video', async (msg) => {
  const chatId = msg.chat.id;
  const videoFileId = msg.video.file_id;

  // Obter o link para download do arquivo de vídeo
  const file = await bot.getFile(videoFileId);
  const filePath = file.file_path;
  const videoUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`;

  // Baixar o arquivo de vídeo
  const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
  const videoData = Buffer.from(response.data, 'binary');

  // Salvar o vídeo como .mp4
  fs.writeFileSync('video.mp4', videoData);

  // Extrair a trilha de áudio do vídeo
  ffmpeg('video.mp4')
    .output('audio.wav')
    .noVideo()
    .on('error', (err) => {
      console.log('Erro na extração de áudio: ' + err.message);
    })
    .on('end', async () => {
      // Converter taxa de amostragem para 48000 Hz usando o sox
      execSync('sox audio.wav -r 48000 audio_converted.wav');

      // Transcrição de áudio para texto
      const audioBytes = fs.readFileSync('audio_converted.wav').toString('base64');

      const audio = {
        content: audioBytes,
      };

      const config = {
        encoding: 'LINEAR16',
        sampleRateHertz: 48000,
        languageCode: 'pt-BR',
      };

      const request = {
        audio: audio,
        config: config,
      };

      const [response] = await client.recognize(request);
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');

      // Enviar transcrição de volta para o usuário
      bot.sendMessage(chatId, transcription);
    })
    .run();
});

bot.on('message', async (msg) => {
  if (msg.text && !msg.text.startsWith('/start') && !msg.voice) {
    bot.sendMessage(msg.chat.id, 'Desculpe, eu só posso transcrever mensagens de áudio ou vídeos no momento.');
  }
});
