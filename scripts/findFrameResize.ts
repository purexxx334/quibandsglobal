import https from 'https';

https.get('https://widget-v3.smartsuppcdn.com/assets/shared-BKfXgL7M.js', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    let idx = 0;
    while ((idx = data.indexOf('style.width', idx)) !== -1) {
      console.log('style.width snippet:\n', data.slice(Math.max(0, idx - 80), Math.min(data.length, idx + 250)));
      idx += 11;
    }
  });
});
