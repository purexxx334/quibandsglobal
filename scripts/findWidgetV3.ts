import https from 'https';

https.get('https://www.smartsuppchat.com/loader.js?', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    let idx = 0;
    while ((idx = data.indexOf('widgetV3Url', idx)) !== -1) {
      console.log('Match widgetV3Url at', idx, ':', data.slice(Math.max(0, idx - 50), Math.min(data.length, idx + 250)));
      idx += 11;
    }
  });
});
