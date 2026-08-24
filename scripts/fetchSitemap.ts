import https from 'https';

https.get('https://docs.smartsupp.com/sitemap.xml', res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Sitemap status:', res.statusCode);
    const urls = body.match(/<loc>(.*?)<\/loc>/g);
    if (urls) {
      console.log('URLs in sitemap:\n', urls.map(u => u.replace(/<\/?loc>/g, '')).join('\n'));
    }
  });
});
