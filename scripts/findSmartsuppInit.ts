import https from 'https';

https.get('https://www.smartsuppchat.com/loader.js?', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    let idx = data.indexOf('window._smartsupp');
    if (idx === -1) idx = data.indexOf('_smartsupp');
    console.log('_smartsupp in loader.js:\n', data.slice(Math.max(0, idx - 50), Math.min(data.length, idx + 500)));
  });
});
