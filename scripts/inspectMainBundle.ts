import https from 'https';

https.get('https://widget-v3.smartsuppcdn.com/assets/main-BI-Moxe0.js', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('main.js length:', data.length);
    console.log('Sample:', data.slice(0, 500));
    
    // Look for chat:open or open or mobile
    const terms = ['chat:open', 'chat:close', 'isMobile', 'mobile', 'render', 'open'];
    terms.forEach(t => {
      let count = 0;
      let pos = 0;
      while ((pos = data.indexOf(t, pos)) !== -1) {
        count++;
        pos += t.length;
      }
      console.log(`Term "${t}": count=${count}`);
    });
  });
});
