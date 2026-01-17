/**
 * 網路連線測試腳本
 * 功能：
 * 1. 測試 DNS 解析 (1.1.1.1)。
 * 2. 測試對 Google API (generativelanguage.googleapis.com) 的連通性。
 * 用途：用於排查伺服器網路問題，特別是確認是否能連接到境外 AI 服務介面。
 */
const dns = require('dns');

console.log("Testing network connectivity...");

// 1. Test DNS resolution
dns.lookup('generativelanguage.googleapis.com', (err, address, family) => {
    if (err) {
        console.error('❌ DNS Lookup failed:', err);
    } else {
        console.log('✅ DNS Lookup successful:', address);

        // 2. Test Fetch
        console.log('Testing fetch to Google API...');
        fetch('https://generativelanguage.googleapis.com', { method: 'HEAD' })
            .then(res => console.log(`✅ Fetch successful. Status: ${res.status}`))
            .catch(err => {
                console.error('❌ Fetch failed:', err);
                if (err.cause) console.error('Cause:', err.cause);
            });
    }
});
