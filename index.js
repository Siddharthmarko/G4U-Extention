const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

let currentIndex;
const jsonFilePath = 'sheetData.json';
let jsonData = [];
let barcode = '';

// Function to read the last entry from the update file
function checkLastEntrySync() {
    try {
        const data = fs.readFileSync('update.txt', 'utf-8');
        const lines = data.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        const barcodeMatch = lastLine.match(/(.*?)\s*=/);
        return barcodeMatch ? barcodeMatch[1].trim() : null;
    } catch (error) {
        throw new Error('Error reading update file');
    }
}

// Load the last barcode entry if exists
try {
    barcode = checkLastEntrySync();
    console.log('Last barcode entry:', barcode);
} catch (error) {
    console.error('Error fetching last barcode entry:', error);
}

// Function to read JSON data from file
function readJsonFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        throw new Error('Error reading JSON file');
    }
}

// Load JSON data from file
try {
    jsonData = readJsonFile(jsonFilePath);
    console.log('Data from JSON file:', jsonData[2]);
} catch (error) {
    console.error('An error occurred:', error);
}

// Initialize currentIndex based on last barcode entry
currentIndex = jsonData.findIndex((obj) => obj.barcode === barcode);
console.log(currentIndex);

// Route for the homepage
app.get('/', (req, res) => {
    res.send('Hello World');
});

// Route to get the previous entry
app.get('/prev', async (req, res) => {
    try {
        if (currentIndex === undefined) {
            res.status(500).json({ error: "Error reading from file" });
            return;
        }
        const prevIndex = currentIndex - 1;
        if (prevIndex < 0) {
            res.status(500).json({ error: 'No previous entry available' });
            return;
        }
        currentIndex = prevIndex;
        res.json({ content: jsonData[currentIndex].content });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred' });
    }
});

// Route to get the next entry
app.get('/next', async (req, res) => {
    try {
        if (currentIndex === undefined) {
            res.status(500).json({ error: "Error reading from file" });
            return;
        }
        const nextIndex = currentIndex + 1;
        if (nextIndex >= jsonData.length) {
            res.status(500).json({ error: 'No next entry available' });
            return;
        }
        currentIndex = nextIndex;
        res.json({ content: jsonData[currentIndex].content });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred' });
    }
});

// Route to save the image and update the file
app.post('/save', async (req, res) => {
    const imageUrl = req.body.url;
    if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL is required' });
    }
    console.log('Got an image URL:', imageUrl);

    const folderName = 'images';
    if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName);
    }

    const imageName = `${jsonData[currentIndex].content}.jpg`;
    const imagePath = path.join(__dirname, folderName, imageName);

    try {
        await downloadImage(imageUrl, imagePath);
        console.log('Downloaded', imageName);

        const barCode = jsonData[currentIndex].barcode;
        const update = `${barCode} = True\n`;
        fs.appendFileSync('update.txt', update);
        res.status(200).json({ barcode: barCode, url: imageUrl });
    } catch (err) {
        console.error('Error downloading image:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Function to download an image
const downloadImage = (url, filePath) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => resolve(true));
            });
        }).on('error', (error) => {
            fs.unlinkSync(filePath);
            reject(new Error('Error downloading image'));
        });
    });
};

app.listen(3000, () => console.log('Server is running at port 3000'));
