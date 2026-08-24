import https from 'https';

https.get('https://www.smartsuppchat.com/loader.js?', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    let idx = 0;
    while ((idx = data.indexOf('prototype.render', idx)) !== -1) {
      console.log('Match prototype.render at', idx, ':\n', data.slice(Math.max(0, idx - 100), Math.min(data.length, idx + 500)));
      idx += 16;
    }
  });
});
