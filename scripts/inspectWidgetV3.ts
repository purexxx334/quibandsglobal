import https from 'https';

function get(url: string) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    }).on('error', (err) => resolve({ error: err.message }));
  });
}

async function testWidgetV3() {
  const res: any = await get('https://widget-v3.smartsuppcdn.com/asset-manifest.json');
  console.log('Manifest status:', res.status, 'body:', res.body);
  
  const res2: any = await get('https://widget-v3.smartsuppcdn.com/index.html');
  console.log('index.html status:', res2.status, 'body:', res2.body?.slice(0, 300));
}

testWidgetV3();
