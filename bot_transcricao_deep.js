const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { Deepgram } = require('@deepgram/sdk');
const officegen = require('officegen');

// Your Deepgram API Key
const deepgramApiKey = "d05c9fbbd4a3aa8f8c5679c8b739ddda67252d38";

// Initialize the Deepgram SDK
const deepgram = new Deepgram(deepgramApiKey);

const directoryPath = 'C:/Users/trabalho/Documents/bot_divisor_de_videos'; // altere isso para o caminho do seu diretório

fs.readdir(directoryPath, (err, files) => {
  if (err) {
    return console.error('Não foi possível ler o diretório: ' + err);
  }

  files.forEach((file) => {
    if (path.extname(file) === '.mp3') {
      let filePath = path.join(directoryPath, file);
      let wavFilePath = path.join(directoryPath, file.replace('.mp3', '.wav'));

      try {
        // Converter .mp3 para .wav e converter para mono
        ffmpeg(filePath)
          .audioChannels(1) // Isto converte o áudio para mono
          .format('wav')
          .on('error', (err) => {
            console.log('Erro na conversão: ' + err.message);
          })
          .on('end', async () => {
            try {
              // Transcrição de áudio para texto
              const audio = fs.readFileSync(wavFilePath);

              const source = {
                buffer: audio,
                mimetype: "audio/wav",
              };

              deepgram.transcription
              .preRecorded(source, {
                  language: 'pt-BR', 
                  model: "general",
                  tier: "enhanced",
                  smart_format: true,
              })
              .then((response) => {
                  const transcription = response.results.channels[0].alternatives[0].transcript;
          
                  // Criar arquivo Word com transcrição
                  let doc = officegen('docx');
                  doc.on('error', function(err) {
                      console.log(err);
                  });
          
                  let pObj = doc.createP();
                  pObj.addText(transcription);
          
                  // Salvar cada transcrição em um arquivo separado
                  let out = fs.createWriteStream(filePath.replace('.mp3', '.docx'));
                  out.on('error', function(err) {
                      console.log(err);
                  });
          
                  doc.generate(out);
              })
              .catch((err) => {
                  console.log(err);
              });

            } catch (err) {
              console.error('Erro na transcrição ou na criação do arquivo Word: ' + err);
            }
          })
          .save(wavFilePath);
      } catch (err) {
        console.error('Erro ao converter o arquivo de áudio: ' + err);
      }
    }
  });
});
