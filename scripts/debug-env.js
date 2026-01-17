
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const envLocalPath = path.resolve(__dirname, '../.env.local');
const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envLocalPath)) {
    console.log('Loading .env.local');
    dotenv.config({ path: envLocalPath });
} else {
    console.log('Loading .env');
    dotenv.config({ path: envPath });
}

console.log('DATABASE_URL=' + process.env.DATABASE_URL);
