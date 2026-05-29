const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Abhigyan Dutta',
      email: 'abhigyandutta@yahoo.com',
      phone: '9797585571',
      password: 'StrongPassword123!' // Make sure password meets strength requirements
    });
    console.log('SUCCESS:', res.data);
  } catch (error) {
    console.log('ERROR status:', error.response ? error.response.status : 'No response');
    console.log('ERROR data:', error.response ? error.response.data : error.message);
  }
}

test();
