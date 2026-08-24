import https from 'https';

async function searchDocs(term: string) {
  const url = `https://docs.smartsupp.com/search/?q=${encodeURIComponent(term)}`;
  console.log('Searching docs for:', term);
  https.get(url, (res) => {
    let html = '';
    res.on('data', chunk => html += chunk);
    res.on('end', () => {
      console.log('Result length:', html.length);
    });
  });
}

// Let's also check common pages
const pages = [
  'https://docs.smartsupp.com/chat-box/options/',
  'https://docs.smartsupp.com/chat-box/api/',
  'https://docs.smartsupp.com/chat-box/custom-button/'
];

pages.forEach(p => {
  https.get(p, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log(`Page ${p} status: ${res.statusCode}`);
      if (body.includes('mobile') || body.includes('Mobile')) {
        console.log(`--- Mentions of mobile in ${p} ---`);
        let idx = 0;
        while ((idx = body.indexOf('mobile', idx)) !== -1) {
          console.log(body.slice(Math.max(0, idx - 40), Math.min(body.length, idx + 100)).replace(/<[^>]+>/g, ''));
          idx += 6;
        }
      }
    });
  });
});
