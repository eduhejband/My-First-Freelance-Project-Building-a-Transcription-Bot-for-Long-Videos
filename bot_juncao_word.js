const fs = require('fs');
const path = require('path');
const officegen = require('officegen');
const mammoth = require('mammoth');

const directoryPath = 'C:/Users/trabalho/Documents/bot_divisor_de_videos';

fs.readdir(directoryPath, async (err, files) => {
  if (err) {
    console.error('Não foi possível ler o diretório: ' + err);
    return;
  }

  files = files.filter(file => path.extname(file) === '.docx').sort();
  
  let allText = '';

  for (let file of files) {
    let filePath = path.join(directoryPath, file);
    let { value: text } = await mammoth.extractRawText({ path: filePath });
    allText += text + '\n\n';
  }

  let doc = officegen('docx');
  let pObj = doc.createP();
  pObj.addText(allText);
  let out = fs.createWriteStream(path.join(directoryPath, 'newFile.docx'));
  doc.generate(out);
});
