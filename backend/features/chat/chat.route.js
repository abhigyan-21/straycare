const express = require('express');
const router = express.Router();
const chatController = require('./chat.controller');

router.post('/', chatController.handleChatRequest);

module.exports = router;
