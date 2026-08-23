import dotenv from 'dotenv';
dotenv.config();

async function sendTest() {
  try {
    console.log('Sending request to http://localhost:5000/api/security/telemetry ...');
    const res = await fetch('http://localhost:5000/api/security/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail: 'user_login_test@quibands.com',
        eventType: 'login_success',
        status: 'success',
        authMethod: 'email_password',
      }),
    });

    const text = await res.text();
    console.log('HTTP Status:', res.status);
    console.log('Response Body:', text);
  } catch (err: any) {
    console.error('Fetch error:', err);
  }
}

sendTest();
