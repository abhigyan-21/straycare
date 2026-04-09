const chatService = require('./chat.service');

/**
 * @desc Handle user chat request with AI chatbot
 * @route POST /api/chat
 * @access Public
 */
const handleChatRequest = async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const reply = await chatService.getChatbotResponse(messages);
    res.json({ reply });
  } catch (error) {
    console.error('Error hitting OpenRouter API:', error.message);
    res.status(500).json({ reply: 'Server busy, try again.' });
  }
};

module.exports = {
  handleChatRequest,
};
