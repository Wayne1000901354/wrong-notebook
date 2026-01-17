
const fs = require('fs');
const path = require('path');

console.log('Raw process.env.DATABASE_URL:', process.env.DATABASE_URL);

const envPath = path.resolve(__dirname, '../.env');
try {
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('Content of .env:');
    console.log(content);
} catch (e) {
    console.log('Could not read .env:', e.message);
}
