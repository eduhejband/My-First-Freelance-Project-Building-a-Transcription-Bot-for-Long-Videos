ffmpeg(videoPath)
  .outputOptions('-f', 'segment')
  .outputOptions('-segment_time', segmentDuration)
  .outputOptions('-reset_timestamps', '1')
  .outputOptions('-map', '0')
  .outputOptions('-segment_format', 'mp4')
  .output('segment_%03d.mp4')
  .on('end', () => {
    console.log('Vídeo dividido em partes menores.');

    // Converter segmentos em arquivos de áudio
    convertSegmentsToAudio();
  })
  .on('error', (err) => {
    console.error('Erro ao dividir o vídeo:', err);
  })
  .run();

function convertSegmentsToAudio() {
  // Obter lista de segmentos de vídeo
  const segmentFiles = fs.readdirSync('.').filter(file => file.startsWith('segment_'));

  // Converter cada segmento para arquivo de áudio
  segmentFiles.forEach(segmentFile => {
    const audioFile = segmentFile.replace('.mp4', '.mp3');

    ffmpeg(`./${segmentFile}`)
      .output(audioFile)
      .noVideo()
      .on('end', () => {
        console.log(`Segmento convertido para áudio: ${audioFile}`);
      })
      .on('error', (err) => {
        console.error(`Erro ao converter segmento para áudio: ${segmentFile}`, err);
      })
      .run();
  });
}
