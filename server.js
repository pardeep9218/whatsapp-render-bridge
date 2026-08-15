const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Initialize WhatsApp Web Client with performance-tuned flags for Render's free tier
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
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

// Render outputs terminal logs as plain text lines. We generate a URL to scan instead of ASCII art.
client.on('qr', (qr) => {
    const encodedQR = encodeURIComponent(qr);
    const qrScannerUrl = `https://qrserver.com{encodedQR}`;
    
    console.log('\n==================================================');
    console.log('SCAN THIS LINK WITH YOUR WHATSAPP TO LOG IN:');
    console.log(qrScannerUrl);
    console.log('==================================================\n');
});

client.on('ready', () => {
    console.log('WhatsApp Engine is authenticated and running!');
});

// Endpoint that your CodeIgniter site will communicate with via cURL
app.post('/send-message', async (req, res) => {
    const { number, message } = req.body;
    if (!number || !message) {
        return res.status(400).json({ error: 'Missing standard number or message targets' });
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

// Listen dynamically using Render's structural system variables
const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
    console.log(`WhatsApp API microservice is alive on port ${port}`);
});
