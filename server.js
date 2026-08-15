const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: '/usr/bin/google-chrome-stable', // Point strictly to the Docker-installed binary
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--no-zygote',
            '--single-process', // Crucial to prevent RAM crashes on Render's 512MB limit
            '--disable-gpu'
        ]
    }
});

app.get('/', (req, res) => {
    res.send('WhatsApp Bridge is online and running successfully via Docker!');
});

client.on('qr', (qr) => {
    const encodedQR = encodeURIComponent(qr);
    
    // FIXED: Using standard single quotes and a '+' sign to append the variable safely
    const qrScannerUrl = 'https://qrserver.com' + encodedQR;
    
    console.log('\n==================================================');
    console.log('SCAN THIS LINK WITH YOUR WHATSAPP TO LOG IN:');
    console.log(qrScannerUrl);
    console.log('==================================================\n');
});

client.on('ready', () => {
    console.log('WhatsApp Engine is authenticated and running!');
});

app.post('/send-message', async (req, res) => {
    const { number, message } = req.body;
    if (!number || !message) {
        return res.status(400).json({ error: 'Missing parameters: number or message' });
    }

    try {
        const formattedNumber = number.replace(/[^\d]/g, "") + '@c.us'; 
        await client.sendMessage(formattedNumber, message);
        res.status(200).json({ status: 'success' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

client.initialize();

// Listen dynamically using Render's environmental variables, default to 3000 for local fallback
const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
    console.log(`WhatsApp API microservice is alive on port ${port}`);
});
