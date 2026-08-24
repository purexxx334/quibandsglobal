import https from 'https';

https.get('https://www.smartsuppchat.com/loader.js?', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    let idx = 0;
    while ((idx = data.indexOf('open', idx)) !== -1) {
      const snip = data.slice(Math.max(0, idx - 40), Math.min(data.length, idx + 100));
      if (snip.includes('chat') || snip.includes('widget') || snip.includes('messenger')) {
        console.log('Snippet:', snip);
      }
      idx += 4;
    }
  });
});
