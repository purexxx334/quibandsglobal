import https from 'https';

const key = '3cdeb6680f2bbdf23ceab58462afab7133653b98';

async function scan() {
  console.log('=== SCANNING SMARTSUPP REMOTE CONFIG FOR KEY', key, '===');
  
  const bootstrapUrl = `https://bootstrap.smartsuppchat.com/widget/${key}.json`;
  
  const data: any = await new Promise((resolve) => {
    https.get(bootstrapUrl, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
  });
  
  console.log('\n--- KEY CONFIGURATION VALUES ---');
  console.log('1. hideWidget:', data.hideWidget);
  console.log('2. hideOfflineChat:', data.hideOfflineChat);
  console.log('3. buttonStyle:', data.buttonStyle);
  console.log('4. mobilePopupsEnabled:', data.mobilePopupsEnabled);
  console.log('5. openOnTrigger:', data.openOnTrigger);
  console.log('6. features:', data.features);
  console.log('7. isBlocked:', data.isBlocked);
  console.log('8. allowedDomains:', data.allowedDomains);
  console.log('9. requireLogin:', data.requireLogin);
  console.log('10. packageName:', data.packageName);
  
  console.log('\n--- FULL REMOTE CONFIG OBJECT ---');
  console.log(JSON.stringify(data, null, 2));
}

scan();
