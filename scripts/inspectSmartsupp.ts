import https from 'https';

https.get('https://www.smartsuppchat.com/loader.js?', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const urls = data.match(/https?:\/\/[^\s"'<>)]+/g) || [];
    console.log('Unique URLs found:', [...new Set(urls)]);
    
    // Look for options or flags like mobile, widget, iframe, hideOffline, etc.
    const keywords = ['mobile', 'orientation', 'offset', 'widget', 'iframe', 'options', 'key', 'bundle', 'render', 'chat:open'];
    keywords.forEach(kw => {
      const idx = data.indexOf(kw);
      console.log(`Keyword "${kw}": found=${idx !== -1}`);
    });
  });
});
