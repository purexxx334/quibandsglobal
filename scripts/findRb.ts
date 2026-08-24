import https from 'https';

https.get('https://widget-v3.smartsuppcdn.com/assets/shared-BKfXgL7M.js', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    let idx = data.indexOf('Rb=');
    if (idx === -1) idx = data.indexOf('function Rb');
    console.log('Rb function:\n', data.slice(Math.max(0, idx - 50), Math.min(data.length, idx + 400)));
  });
});
