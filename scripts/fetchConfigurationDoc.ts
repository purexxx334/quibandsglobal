import https from 'https';

https.get('https://docs.smartsupp.com/chat-box/configuration/', res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Configuration text:\n', body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
  });
});
