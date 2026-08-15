const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Initialize Client with performance tuning for low-RAM containers
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: '/usr/bin/google-chrome-stable',
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

// Render Log terminal configuration
client.on('qr', (qr) => {
    console.log('\n=================== SCAN THIS CODE TO LOG IN ===================\n');
    
    // CRITICAL FOR RENDER: small must be false so the lines do not collapse in the cloud logs layout
    qrcode.generate(qr, { small: true, scale: 1, margin: 2 });
    
    console.log('\n================================================================\n');
});

client.on('ready', () => {
    console.log('Client is ready to dispatch OTP messages!');
});

// Dedicated HTTP Endpoint to process OTP targets from CodeIgniter
app.post('/send-otp', async (req, res) => {
    const { number, otp } = req.body;

    if (!number || !otp) {
        return res.status(400).json({ status: 'error', error: 'Missing parameters: number or otp' });
    }

    try {
        // Strip symbols (+, -, spaces) and attach standard WhatsApp individual chat routing suffix
        const formattedNumber = number.replace(/[^\d]/g, "") + '@c.us'; 
        
        // Build the localized template message body text
        const messageBody = `Your Verification Code is: ${otp}. Please do not share this code with anyone.`;
        
        // Dispatch via headless browser backend
        await client.sendMessage(formattedNumber, messageBody);
        
        res.status(200).json({ status: 'success', message: 'OTP sent successfully.' });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

client.initialize();

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
    console.log(`OTP API server active on port ${port}`);
});
