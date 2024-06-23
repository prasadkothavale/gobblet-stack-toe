const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('Downloading brain.js...')
https.get('https://unpkg.com/brain.js@2.0.0-beta.23/dist/browser.js', async (response) => {
    if (response.statusCode !== 200) {
        console.error(`Failed to download brain.js. Status code: ${response.statusCode}`);
        return;
    }
    const filePath = path.join(__dirname, 'lib', 'brain.js');

    fs.rm(filePath, { force: true }, (err) => {
        if (err) {
            console.error(`Failed to delete existing brain.js. Error: ${err.message}`);
        } else {
            console.log(`Deleted existing brain.js.`);
        }
    });

    await fs.promises.mkdir(path.join(__dirname, 'lib'), { recursive: true });
    const fileStream = fs.createWriteStream(filePath);

    response.pipe(fileStream);

    fileStream.on('finish', () => {
        console.log(`Downloaded brain.js and saved it to ${filePath}`);
    });

    fileStream.on('error', (err) => {
        console.error(`Failed to save brain.js to ${filePath}. Error: ${err.message}`);
    });
}).on('error', (err) => {
    console.error(`Failed to download brain.js. Error: ${err.message}`);
});