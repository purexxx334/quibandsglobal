import https from 'https';

https.get('https://widget-v3.smartsuppcdn.com/manifest.json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('MANIFEST:\n', data);
  });
});
