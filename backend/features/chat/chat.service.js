const axios = require('axios');

class ChatService {
  async getChatbotResponse(messages) {
    const systemPrompt = {
      role: 'system',
      content: `You are Furzo AI, an expert animal welfare assistant for the Furzo platform (India-focused).
Your role: Help users with stray animal care, rescue, first aid, adoption, vaccinations, NGO contact, and emergencies.

Response rules:
- Keep answers under 150 words
- Use simple, warm language (non-technical)
- Use bullet points or numbered steps when giving instructions
- For emergencies, always start with "⚠️ Emergency:"
- For first aid, always give numbered steps
- End with a helpful tip or next action when relevant
- If unsure, say so and recommend consulting a local vet or NGO

Context: Users are Indian citizens, may be reporting stray animals on the street, seeking adoption help, or dealing with injured/sick animals.`
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
