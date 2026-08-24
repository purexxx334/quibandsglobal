import https from 'https';

https.get('https://docs.smartsupp.com/chat-box/javascript-api/methods/', res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Methods text:\n', body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
  });
});
