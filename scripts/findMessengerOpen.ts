import https from 'https';

https.get('https://widget-v3.smartsuppcdn.com/assets/shared-BKfXgL7M.js', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Search for where smartsupp opens messenger on mobile
    const idx = data.indexOf('IsMessengerFrameOpened');
    console.log('IsMessengerFrameOpened snippet:\n', data.slice(Math.max(0, idx - 100), Math.min(data.length, idx + 500)));
  });
});
