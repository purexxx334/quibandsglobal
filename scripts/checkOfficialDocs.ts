import https from 'https';

async function fetchDocs() {
  const url = 'https://docs.smartsupp.com/chat-box/installation/';
  console.log('Fetching:', url);
  https.get(url, (res) => {
    let html = '';
    res.on('data', chunk => html += chunk);
    res.on('end', () => {
      console.log('Docs status:', res.statusCode);
      // Find code blocks
      const codeRegex = /<code[^>]*>([\s\S]*?)<\/code>/gi;
      let match;
      while ((match = codeRegex.exec(html)) !== null) {
        if (match[1].includes('smartsupp')) {
          console.log('Found Smartsupp snippet in docs:\n', match[1].replace(/<[^>]+>/g, ''));
        }
      }
    });
  });
}

fetchDocs();
