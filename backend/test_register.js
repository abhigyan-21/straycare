const axios = require('axios');

async function test() {
  try {
    const randomSuffix = Math.floor(Math.random() * 10000);
    const start = Date.now();
    const res = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Test User',
      email: `testuser_${randomSuffix}@example.com`,
      phone: `99999${String(randomSuffix).padStart(5, '0')}`,
      password: 'StrongPassword123!'
    });
    console.log(`SUCCESS in ${Date.now() - start}ms:`, res.data);
  } catch (error) {
    console.log('ERROR status:', error.response ? error.response.status : 'No response');
    console.log('ERROR data:', error.response ? error.response.data : error.message);
  }
}

test();
