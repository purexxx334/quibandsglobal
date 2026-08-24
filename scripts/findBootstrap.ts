import https from 'https';

https.get('https://www.smartsuppchat.com/loader.js?', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    let idx = 0;
    while ((idx = data.indexOf('bootstrap', idx)) !== -1) {
      console.log('Match at', idx, ':', data.slice(Math.max(0, idx - 100), Math.min(data.length, idx + 200)));
      idx += 9;
    }
  });
});
