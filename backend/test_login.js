const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'abhigyandutta@yahoo.com',
      password: 'StrongPassword123!'
    });
    console.log('SUCCESS:', res.data);
  } catch (error) {
    console.log('ERROR status:', error.response ? error.response.status : 'No response');
    console.log('ERROR data:', error.response ? error.response.data : error.message);
  }
}

test();
