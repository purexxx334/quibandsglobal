import https from 'https';

https.get('https://www.smartsuppchat.com/loader.js?', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    let idx = data.indexOf('renderFrame');
    console.log(data.slice(idx, idx + 1000));
  });
});
