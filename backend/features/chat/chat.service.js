const axios = require('axios');

class ChatService {
  async getChatbotResponse(messages) {
    const systemPrompt = {
      role: 'system',
      content: 'You are StrayCare AI. Help users with stray animal care, rescue steps, adoption, and emergencies. Give short, practical answers.'
    };

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openrouter/free',
        messages: [systemPrompt, ...messages],
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'StrayCare',
        }
      }
    );

    return response.data.choices[0].message.content;
  }
}

module.exports = new ChatService();
