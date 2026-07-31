const https = require('https');
const fs = require('fs');
const path = require('path');

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };

    https.get(url, options, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      } else {
        reject(`Server responded with ${response.statusCode}: ${response.statusMessage}`);
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err.message);
    });
  });
};

async function main() {
  const publicDir = path.join(__dirname, 'public');
  
  const instapayUrl = 'https://upload.wikimedia.org/wikipedia/commons/c/cc/InstaPay_Logo.png';
  const vodafoneUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Vodafone_icon.svg/512px-Vodafone_icon.svg.png';
  
  try {
    console.log('Downloading InstaPay...');
    await download(instapayUrl, path.join(publicDir, 'instapay.png'));
    console.log('Downloaded InstaPay.');
    
    console.log('Downloading Vodafone...');
    await download(vodafoneUrl, path.join(publicDir, 'vodafone-cash.png'));
    console.log('Downloaded Vodafone.');
  } catch (err) {
    console.error('Download failed:', err);
  }
}

main();
