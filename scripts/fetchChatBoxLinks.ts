import https from 'https';

https.get('https://docs.smartsupp.com/chat-box/', res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const links = body.match(/href="([^"]+)"/g);
    if (links) {
      const unique = [...new Set(links.map(l => l.replace(/href="|"/g, '')))];
      console.log('Chat-box links:\n', unique.join('\n'));
    }
  });
});
