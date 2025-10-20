const puppeteer = require('puppeteer');
const QRCode = require('qrcode');

const generatePDF = async (grievance, outwardNo) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Generate QR code
    const qrCodeUrl = `${process.env.FRONTEND_URL}/grievance/${grievance.ticket_id}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrCodeUrl);
    
    // Create HTML content for the letter
    const htmlContent = generateLetterHTML(grievance, outwardNo, qrCodeDataURL);
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });
    
    await browser.close();
    
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

const generateLetterHTML = (grievance, outwardNo, qrCodeDataURL) => {
  const currentDate = new Date().toLocaleDateString('mr-IN');
  
  return `
    <!DOCTYPE html>
    <html lang="mr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>जनता दरबार पत्र - ${grievance.ticket_id}</title>
      <style>
        body {
          font-family: 'Noto Sans Devanagari', Arial, sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #1e40af;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #1e40af;
          margin: 0;
          font-size: 24px;
        }
        .header h2 {
          color: #374151;
          margin: 5px 0;
          font-size: 18px;
        }
        .letter-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          font-size: 14px;
        }
        .letter-info div {
          flex: 1;
        }
        .content {
          margin-bottom: 30px;
        }
        .content h3 {
          color: #1e40af;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 5px;
        }
        .grievance-details {
          background-color: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .grievance-details table {
          width: 100%;
          border-collapse: collapse;
        }
        .grievance-details td {
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .grievance-details td:first-child {
          font-weight: bold;
          width: 30%;
        }
        .footer {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .signature {
          text-align: center;
        }
        .signature-line {
          border-top: 1px solid #333;
          width: 200px;
          margin: 20px auto 5px;
        }
        .qr-code {
          text-align: center;
        }
        .qr-code img {
          width: 100px;
          height: 100px;
        }
        .qr-code p {
          font-size: 12px;
          margin: 5px 0;
        }
        .urgency {
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          padding: 10px;
          border-radius: 4px;
          margin: 10px 0;
        }
        .critical { background-color: #fee2e2; border-color: #dc2626; }
        .high { background-color: #fed7aa; border-color: #ea580c; }
        .medium { background-color: #fef3c7; border-color: #f59e0b; }
        .low { background-color: #d1fae5; border-color: #059669; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>श्री. शंभू राजा देशाई</h1>
        <h2>जनता दरबार</h2>
        <p>महाराष्ट्र राज्य</p>
      </div>
      
      <div class="letter-info">
        <div>
          <strong>पत्र क्रमांक:</strong> ${outwardNo}<br>
          <strong>दिनांक:</strong> ${currentDate}
        </div>
        <div>
          <strong>तक्रार क्रमांक:</strong> ${grievance.ticket_id}<br>
          <strong>विभाग:</strong> ${grievance.department_name_marathi || grievance.department_name}
        </div>
      </div>
      
      <div class="content">
        <h3>विषय: जनता दरबार तक्रार - कार्यवाहीसाठी</h3>
        
        <p>प्रिय महोदय/महोदया,</p>
        
        <p>वरील तक्रार क्रमांक ${grievance.ticket_id} अंतर्गत खालील तक्रार मिळाली आहे. कृपया तिची चौकशी करून आवश्यक कार्यवाही करावी.</p>
        
        <div class="grievance-details">
          <h4>तक्रारीची माहिती:</h4>
          <table>
            <tr>
              <td>नागरिकाचे नाव:</td>
              <td>${grievance.citizen_name || 'N/A'}</td>
            </tr>
            <tr>
              <td>मोबाइल क्रमांक:</td>
              <td>${grievance.citizen_phone || 'N/A'}</td>
            </tr>
            <tr>
              <td>विषय:</td>
              <td>${grievance.summary}</td>
            </tr>
            <tr>
              <td>वर्णन:</td>
              <td>${grievance.description}</td>
            </tr>
            <tr>
              <td>श्रेणी:</td>
              <td>${getCategoryInMarathi(grievance.category)}</td>
            </tr>
            <tr>
              <td>गंभीरता:</td>
              <td>${getSeverityInMarathi(grievance.severity)}</td>
            </tr>
            <tr>
              <td>पिनकोड:</td>
              <td>${grievance.pincode || 'N/A'}</td>
            </tr>
            <tr>
              <td>तक्रार दिनांक:</td>
              <td>${new Date(grievance.created_at).toLocaleDateString('mr-IN')}</td>
            </tr>
          </table>
        </div>
        
        <div class="urgency ${grievance.severity}">
          <strong>गंभीरता स्तर:</strong> ${getSeverityInMarathi(grievance.severity)}<br>
          <strong>कार्यवाहीची मुदत:</strong> ${getSLATimeframe(grievance.severity)}
        </div>
        
        <p>कृपया वरील तक्रारीची चौकशी करून आवश्यक कार्यवाही करावी. कार्यवाहीची माहिती जनता दरबार कार्यालयाला कळवावी.</p>
        
        <p>धन्यवाद,<br>
        जनता दरबार कार्यालय</p>
      </div>
      
      <div class="footer">
        <div class="signature">
          <div class="signature-line"></div>
          <p>हस्ताक्षर</p>
          <p>शंभू राजा देशाई</p>
        </div>
        
        <div class="qr-code">
          <img src="${qrCodeDataURL}" alt="QR Code">
          <p>तक्रारीची स्थिती पाहण्यासाठी<br>QR कोड स्कॅन करा</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const getCategoryInMarathi = (category) => {
  const categories = {
    'water': 'जलसंपदा',
    'road': 'रस्ता',
    'electricity': 'वीज',
    'health': 'आरोग्य',
    'sanitation': 'स्वच्छता',
    'women_child': 'महिला व बालविकास',
    'police': 'पोलीस',
    'revenue': 'महसूल',
    'education': 'शिक्षण',
    'other': 'इतर'
  };
  return categories[category] || category;
};

const getSeverityInMarathi = (severity) => {
  const severities = {
    'critical': 'गंभीर',
    'high': 'उच्च',
    'medium': 'मध्यम',
    'low': 'कमी'
  };
  return severities[severity] || severity;
};

const getSLATimeframe = (severity) => {
  const timeframes = {
    'critical': '2 तास',
    'high': '24 तास',
    'medium': '72 तास',
    'low': '7 दिवस'
  };
  return timeframes[severity] || '72 तास';
};

module.exports = {
  generatePDF
};
