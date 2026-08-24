import https from 'https';

const key = '3cdeb6680f2bbdf23ceab58462afab7133653b98';

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

async function testBootstrap() {
  console.log('Testing bootstrap for key...');
  const res1: any = await get(`https://bootstrap.smartsuppchat.com/v3/${key}.json`);
  console.log('v3 json status:', res1.status, 'body:', res1.body?.slice(0, 500));
  
  const res2: any = await get(`https://bootstrap.smartsuppchat.com/${key}.json`);
  console.log('root json status:', res2.status, 'body:', res2.body?.slice(0, 500));
  
  const res3: any = await get(`https://api.smartsuppchat.com/v3/widget/${key}`);
  console.log('api widget status:', res3.status, 'body:', res3.body?.slice(0, 500));
}

testBootstrap();
