import https from 'https';

https.get('https://docs.smartsupp.com/chat-box/javascript-api/events/', res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Events text:\n', body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
  });
});
