const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const speech = require('@google-cloud/speech');

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

bot.on('voice', async (msg) => {
  const chatId = msg.chat.id;
  const voiceFileId = msg.voice.file_id;

  // Obter o link para download do arquivo de áudio
  const file = await bot.getFile(voiceFileId);
  const filePath = file.file_path;
  const audioUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`;

  // Baixar o arquivo de áudio
  const response = await axios.get(audioUrl, { responseType: 'arraybuffer' });
  const audioData = Buffer.from(response.data, 'binary');

  // Salvar o áudio como .ogg
  fs.writeFileSync('audio.ogg', audioData);

  // Converter .ogg para .wav
  ffmpeg('audio.ogg')
    .format('wav')
    .on('error', (err) => {
      console.log('Erro na conversão: ' + err.message);
    })
    .on('end', async () => {
      // Transcrição de áudio para texto
      const audioBytes = fs.readFileSync('audio.wav').toString('base64');

      const audio = {
        content: audioBytes,
      };

      const config = {
        encoding: 'LINEAR16',
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
    .save('audio.wav');
});

bot.on('message', async (msg) => {
  if (msg.text && !msg.text.startsWith('/start') && !msg.voice) {
    bot.sendMessage(msg.chat.id, 'Desculpe, eu só posso transcrever mensagens de áudio no momento.');
  }
});
