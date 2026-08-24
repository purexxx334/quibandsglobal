import https from 'https';

https.get('https://www.smartsuppchat.com/loader.js?', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Find where bootstrap or widget is referenced in the code
    const lines = data.split('\n');
    lines.forEach((line, i) => {
      if (line.includes('bootstrap') || line.includes('widget-v3') || line.includes('smartsuppchat.com')) {
        console.log(`Line ${i}:`, line.slice(0, 1000));
      }
    });
  });
});
