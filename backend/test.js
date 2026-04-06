const chatService = require('./services/chat.service');
const axios = require('axios');
require('dotenv').config();

async function run() {
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'mistralai/mistral-7b-instruct',
        messages: [{ role: 'user', content: 'hello' }],
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log("SUCCESS:", response.data.choices[0].message);
  } catch (e) {
    console.log("ERROR:", e.response ? JSON.stringify(e.response.data) : e.message);
  }
}
run();
