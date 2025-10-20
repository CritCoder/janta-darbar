const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsapp');
const pool = require('../config/database');
const { createEvent } = require('../utils/events');

// Webhook endpoint for Interakt
router.post('/webhook', async (req, res) => {
  try {
    const payload = req.body;
    
    // Verify webhook signature (in production)
    // const signature = req.headers['x-interakt-signature'];
    // if (!verifyWebhookSignature(payload, signature)) {
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    const result = await whatsappService.handleWebhook(payload);
    
    res.json({ status: 'success', result });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Send message endpoint
router.post('/send', async (req, res) => {
  try {
    const { phone, message, language = 'mr' } = req.body;
    
    if (!phone || !message) {
      return res.status(400).json({ error: 'Phone and message are required' });
    }

    const result = await whatsappService.sendMessage(phone, message, language);
    
    res.json({ status: 'success', result });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Send template message
router.post('/template', async (req, res) => {
  try {
    const { phone, template_name, parameters = {}, language = 'mr' } = req.body;
    
    if (!phone || !template_name) {
      return res.status(400).json({ error: 'Phone and template_name are required' });
    }

    const result = await whatsappService.sendTemplate(phone, template_name, parameters, language);
    
    res.json({ status: 'success', result });
  } catch (error) {
    console.error('Send template error:', error);
    res.status(500).json({ error: 'Failed to send template' });
  }
});

// Send status update to citizen
router.post('/status-update', async (req, res) => {
  try {
    const { grievance_id, status, additional_info = {} } = req.body;
    
    if (!grievance_id || !status) {
      return res.status(400).json({ error: 'Grievance ID and status are required' });
    }

    await whatsappService.sendStatusUpdate(grievance_id, status, additional_info);
    
    res.json({ status: 'success', message: 'Status update sent' });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ error: 'Failed to send status update' });
  }
});

// Send reminder
router.post('/reminder', async (req, res) => {
  try {
    const { grievance_id, reminder_type } = req.body;
    
    if (!grievance_id || !reminder_type) {
      return res.status(400).json({ error: 'Grievance ID and reminder type are required' });
    }

    await whatsappService.sendReminder(grievance_id, reminder_type);
    
    res.json({ status: 'success', message: 'Reminder sent' });
  } catch (error) {
    console.error('Reminder error:', error);
    res.status(500).json({ error: 'Failed to send reminder' });
  }
});

// Get message templates
router.get('/templates', async (req, res) => {
  try {
    const templates = {
      'grievance_created': {
        mr: 'तक्रार क्रमांक {{ticket_id}} मिळाली आहे. आम्ही चौकशी करू.',
        hi: 'शिकायत संख्या {{ticket_id}} प्राप्त हुई है। हम जांच करेंगे।',
        en: 'Complaint {{ticket_id}} received. We will investigate.'
      },
      'status_update': {
        mr: 'तक्रार क्रमांक {{ticket_id}} ची स्थिती: {{status}}',
        hi: 'शिकायत संख्या {{ticket_id}} की स्थिति: {{status}}',
        en: 'Complaint {{ticket_id}} status: {{status}}'
      },
      'resolution': {
        mr: 'तक्रार क्रमांक {{ticket_id}} सोडवली गेली. समाधानी आहात का?',
        hi: 'शिकायत संख्या {{ticket_id}} हल की गई। संतुष्ट हैं?',
        en: 'Complaint {{ticket_id}} resolved. Are you satisfied?'
      }
    };

    res.json({ templates });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to get templates' });
  }
});

// Test endpoint
router.post('/test', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const testMessage = {
      mr: 'नमस्कार! हे एक चाचणी संदेश आहे. 🙏',
      hi: 'नमस्कार! यह एक परीक्षण संदेश है। 🙏',
      en: 'Hello! This is a test message. 🙏'
    };

    await whatsappService.sendMessage(phone, testMessage.mr, 'mr');
    
    res.json({ status: 'success', message: 'Test message sent' });
  } catch (error) {
    console.error('Test message error:', error);
    res.status(500).json({ error: 'Failed to send test message' });
  }
});

module.exports = router;
