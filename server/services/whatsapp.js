const axios = require('axios');
const { createEvent } = require('../utils/events');

class WhatsAppService {
  constructor() {
    this.apiKey = process.env.INTERAKT_API_KEY;
    this.baseURL = 'https://api.interakt.ai/v1';
    this.webhookSecret = process.env.INTERAKT_WEBHOOK_SECRET;
  }

  // Send text message
  async sendMessage(phone, message, language = 'mr') {
    try {
      const response = await axios.post(`${this.baseURL}/message/send`, {
        phone: phone,
        message: message,
        language: language
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  // Send template message
  async sendTemplate(phone, templateName, parameters = {}, language = 'mr') {
    try {
      const response = await axios.post(`${this.baseURL}/message/template`, {
        phone: phone,
        template_name: templateName,
        parameters: parameters,
        language: language
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp template:', error);
      throw error;
    }
  }

  // Send media message
  async sendMedia(phone, mediaUrl, mediaType, caption = '', language = 'mr') {
    try {
      const response = await axios.post(`${this.baseURL}/message/media`, {
        phone: phone,
        media_url: mediaUrl,
        media_type: mediaType,
        caption: caption,
        language: language
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp media:', error);
      throw error;
    }
  }

  // Handle incoming webhook
  async handleWebhook(payload) {
    try {
      const { type, data } = payload;

      switch (type) {
        case 'message_received':
          return await this.handleIncomingMessage(data);
        case 'message_delivered':
          return await this.handleMessageDelivered(data);
        case 'message_read':
          return await this.handleMessageRead(data);
        default:
          console.log('Unknown webhook type:', type);
          return { status: 'ignored' };
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  // Handle incoming message
  async handleIncomingMessage(data) {
    const { phone, message, media, location } = data;
    
    // Check if this is a new grievance or update to existing one
    const existingUser = await this.findUserByPhone(phone);
    
    if (existingUser && existingUser.activeGrievance) {
      // Handle update to existing grievance
      return await this.handleGrievanceUpdate(existingUser.activeGrievance, data);
    } else {
      // Handle new grievance
      return await this.handleNewGrievance(data);
    }
  }

  // Handle new grievance submission
  async handleNewGrievance(data) {
    const { phone, message, media, location } = data;
    
    // Extract information from message
    const extractedInfo = await this.extractGrievanceInfo(message, phone);
    
    // Send confirmation message
    const confirmationMessage = this.getConfirmationMessage(extractedInfo, 'mr');
    await this.sendMessage(phone, confirmationMessage, 'mr');
    
    // Create grievance in database
    const grievance = await this.createGrievanceFromWhatsApp(extractedInfo, data);
    
    return {
      status: 'success',
      grievance_id: grievance.id,
      ticket_id: grievance.ticket_id
    };
  }

  // Extract grievance information from message
  async extractGrievanceInfo(message, phone) {
    // Simple keyword extraction (in production, use NLP)
    const categories = {
      'पाणी': 'water',
      'रस्ता': 'road',
      'वीज': 'electricity',
      'आरोग्य': 'health',
      'स्वच्छता': 'sanitation',
      'पोलीस': 'police',
      'महसूल': 'revenue',
      'शिक्षण': 'education'
    };

    let category = 'other';
    let severity = 'medium';

    // Check for category keywords
    for (const [keyword, cat] of Object.entries(categories)) {
      if (message.includes(keyword)) {
        category = cat;
        break;
      }
    }

    // Check for severity indicators
    if (message.includes('तातडीचे') || message.includes('जरुरी')) {
      severity = 'high';
    } else if (message.includes('क्रिटिकल') || message.includes('आपत्कालीन')) {
      severity = 'critical';
    }

    return {
      phone,
      message,
      category,
      severity,
      language: 'mr'
    };
  }

  // Get confirmation message in Marathi
  getConfirmationMessage(info, language) {
    const messages = {
      mr: `नमस्कार! आपली तक्रार मिळाली आहे. 
      
तक्रार क्रमांक: ${info.ticket_id || 'JD-MH-XXXX-XXX'}
विषय: ${info.category}
गंभीरता: ${info.severity}

आम्ही आपल्या तक्रारीची चौकशी करून लवकरच कारवाई करू. आपल्याला प्रत्येक टप्प्यावर अपडेट मिळत राहील.

धन्यवाद! 🙏`,
      
      hi: `नमस्कार! आपकी शिकायत प्राप्त हुई है।
      
शिकायत संख्या: ${info.ticket_id || 'JD-MH-XXXX-XXX'}
विषय: ${info.category}
गंभीरता: ${info.severity}

हम आपकी शिकायत की जांच करके जल्द कार्रवाई करेंगे। आपको हर चरण पर अपडेट मिलता रहेगा।

धन्यवाद! 🙏`,
      
      en: `Hello! We have received your complaint.
      
Complaint Number: ${info.ticket_id || 'JD-MH-XXXX-XXX'}
Category: ${info.category}
Severity: ${info.severity}

We will investigate your complaint and take action soon. You will receive updates at every stage.

Thank you! 🙏`
    };

    return messages[language] || messages.mr;
  }

  // Send status update to citizen
  async sendStatusUpdate(grievanceId, status, additionalInfo = {}) {
    try {
      const grievance = await this.getGrievanceDetails(grievanceId);
      if (!grievance) return;

      const message = this.getStatusUpdateMessage(grievance, status, additionalInfo);
      await this.sendMessage(grievance.citizen_phone, message, grievance.citizen_language);

      // Log the notification
      await createEvent(null, grievanceId, 'WHATSAPP_NOTIFICATION_SENT', {
        status,
        message,
        additional_info: additionalInfo
      }, null, 'system');

    } catch (error) {
      console.error('Error sending status update:', error);
    }
  }

  // Get status update message
  getStatusUpdateMessage(grievance, status, additionalInfo) {
    const statusMessages = {
      'INTAKE': {
        mr: `तक्रार क्रमांक ${grievance.ticket_id} ची चौकशी सुरू आहे. आमची टीम आपल्या तक्रारीची तपासणी करत आहे.`,
        hi: `शिकायत संख्या ${grievance.ticket_id} की जांच शुरू है। हमारी टीम आपकी शिकायत की जांच कर रही है।`,
        en: `Complaint ${grievance.ticket_id} is under review. Our team is investigating your complaint.`
      },
      'APPROVED': {
        mr: `तक्रार क्रमांक ${grievance.ticket_id} मंजूर झाली आहे. संबंधित विभागाकडे पत्र पाठवले जात आहे.`,
        hi: `शिकायत संख्या ${grievance.ticket_id} स्वीकृत है। संबंधित विभाग को पत्र भेजा जा रहा है।`,
        en: `Complaint ${grievance.ticket_id} has been approved. Letter is being sent to the concerned department.`
      },
      'DISPATCHED': {
        mr: `तक्रार क्रमांक ${grievance.ticket_id} संबंधित विभागाकडे पाठवली गेली आहे. पत्र क्रमांक: ${additionalInfo.outward_no || 'N/A'}`,
        hi: `शिकायत संख्या ${grievance.ticket_id} संबंधित विभाग को भेजी गई है। पत्र संख्या: ${additionalInfo.outward_no || 'N/A'}`,
        en: `Complaint ${grievance.ticket_id} has been sent to the concerned department. Letter No: ${additionalInfo.outward_no || 'N/A'}`
      },
      'ACKNOWLEDGED': {
        mr: `तक्रार क्रमांक ${grievance.ticket_id} विभागाने स्वीकारली आहे. कार्य सुरू आहे.`,
        hi: `शिकायत संख्या ${grievance.ticket_id} विभाग द्वारा स्वीकार की गई है। कार्य शुरू है।`,
        en: `Complaint ${grievance.ticket_id} has been acknowledged by the department. Work has started.`
      },
      'RESOLVED': {
        mr: `तक्रार क्रमांक ${grievance.ticket_id} सोडवली गेली आहे. आपण समाधानी आहात का? 👍/👎`,
        hi: `शिकायत संख्या ${grievance.ticket_id} हल की गई है। क्या आप संतुष्ट हैं? 👍/👎`,
        en: `Complaint ${grievance.ticket_id} has been resolved. Are you satisfied? 👍/👎`
      }
    };

    const messages = statusMessages[status];
    if (!messages) return '';

    return messages[grievance.citizen_language] || messages.mr;
  }

  // Send reminder message
  async sendReminder(grievanceId, reminderType) {
    try {
      const grievance = await this.getGrievanceDetails(grievanceId);
      if (!grievance) return;

      const message = this.getReminderMessage(grievance, reminderType);
      await this.sendMessage(grievance.citizen_phone, message, grievance.citizen_language);

    } catch (error) {
      console.error('Error sending reminder:', error);
    }
  }

  // Get reminder message
  getReminderMessage(grievance, reminderType) {
    const reminderMessages = {
      'acknowledgment': {
        mr: `तक्रार क्रमांक ${grievance.ticket_id} साठी विभागाकडून अद्याप पुष्टी मिळाली नाही. आम्ही पुन्हा संपर्क करत आहोत.`,
        hi: `शिकायत संख्या ${grievance.ticket_id} के लिए विभाग से अभी तक पुष्टि नहीं मिली है। हम फिर से संपर्क कर रहे हैं।`,
        en: `No acknowledgment received yet for complaint ${grievance.ticket_id}. We are following up.`
      },
      'resolution': {
        mr: `तक्रार क्रमांक ${grievance.ticket_id} साठी अद्याप कार्य पूर्ण झाले नाही. आम्ही निरीक्षण करत आहोत.`,
        hi: `शिकायत संख्या ${grievance.ticket_id} के लिए अभी तक कार्य पूरा नहीं हुआ है। हम निगरानी कर रहे हैं।`,
        en: `Work not completed yet for complaint ${grievance.ticket_id}. We are monitoring.`
      }
    };

    const messages = reminderMessages[reminderType];
    if (!messages) return '';

    return messages[grievance.citizen_language] || messages.mr;
  }

  // Helper methods
  async findUserByPhone(phone) {
    // Implementation to find user by phone
    // This would query your database
    return null;
  }

  async createGrievanceFromWhatsApp(info, data) {
    // Implementation to create grievance from WhatsApp data
    // This would use your grievance creation logic
    return null;
  }

  async getGrievanceDetails(grievanceId) {
    // Implementation to get grievance details
    // This would query your database
    return null;
  }
}

module.exports = new WhatsAppService();
