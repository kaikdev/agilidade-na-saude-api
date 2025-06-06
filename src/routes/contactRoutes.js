const express = require('express');
const router = express.Router();

const ContactController = require('../controllers/ContactController');

router.post('/contato', ContactController.sendContactEmail);

module.exports = router;