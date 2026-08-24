import https from 'https';

https.get('https://widget-v3.smartsuppcdn.com/assets/shared-BKfXgL7M.js', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('shared.js length:', data.length);
    let idx = 0;
    while ((idx = data.indexOf('chat:open', idx)) !== -1) {
      console.log('Found chat:open at', idx, ':\n', data.slice(Math.max(0, idx - 80), Math.min(data.length, idx + 150)));
      idx += 9;
    }
  });
});
