const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const speech = require('@google-cloud/speech');
const officegen = require('officegen');

const client = new speech.SpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const directoryPath = ''; // altere isso para o caminho do seu diretório

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
              const audioBytes = fs.readFileSync(wavFilePath).toString('base64');

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
