import https from 'https';

const key = '3cdeb6680f2bbdf23ceab58462afab7133653b98';
const url = `https://bootstrap.smartsuppchat.com/widget/${key}.json`;

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log('ACCOUNT & WIDGET CONFIG:\n', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('BODY:', data);
    }
  });
});
