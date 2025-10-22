const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const pool = require('../config/database');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

/**
 * ELON MODE: AI Auto-Assignment
 * Analyzes complaint and automatically suggests best officer
 */
async function suggestOfficerAssignment(complaintData) {
  try {
    const { category, severity, location, description } = complaintData;

    // Get all officers with their departments and past performance
    const officersQuery = await pool.query(`
      SELECT
        o.id, o.name, o.role, o.whatsapp,
        d.name as department_name, d.name_marathi,
        COUNT(CASE WHEN g.status = 'CLOSED' THEN 1 END) as resolved_count,
        COUNT(g.id) as total_assigned,
        AVG(CASE WHEN g.status = 'CLOSED' THEN
          EXTRACT(EPOCH FROM (g.updated_at - g.created_at))/3600
        END) as avg_resolution_hours,
        COUNT(CASE WHEN g.status = 'IN_PROGRESS' THEN 1 END) as current_workload
      FROM officers o
      LEFT JOIN departments d ON o.department_id = d.id
      LEFT JOIN grievances g ON g.assigned_officer_id = o.id
      WHERE o.active = true AND d.active = true
      GROUP BY o.id, o.name, o.role, o.whatsapp, d.name, d.name_marathi
      ORDER BY current_workload ASC, avg_resolution_hours ASC
    `);

    if (officersQuery.rows.length === 0) {
      return { success: false, error: 'No officers available' };
    }

    // Use AI to select best officer
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an AI assignment system for Maharashtra Government.

Analyze this complaint and select THE SINGLE BEST officer from the list:

COMPLAINT:
- Category: ${category}
- Severity: ${severity}
- Location: ${location || 'Not specified'}
- Description: ${description}

AVAILABLE OFFICERS:
${officersQuery.rows.map((o, i) => `
${i + 1}. ${o.name} (${o.role})
   Department: ${o.department_name_marathi || o.department_name}
   Performance: ${o.resolved_count}/${o.total_assigned} resolved
   Avg Resolution: ${o.avg_resolution_hours ? Math.round(o.avg_resolution_hours) + 'h' : 'N/A'}
   Current Workload: ${o.current_workload} active cases
`).join('\n')}

Select ONE officer who is:
1. Most relevant to this category
2. Has capacity (lower workload)
3. Good performance history

Return ONLY a JSON object with: officer_id (the number from list), reason

No markdown, just JSON.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const suggestion = JSON.parse(cleanText);

    const selectedOfficer = officersQuery.rows[suggestion.officer_id - 1];

    return {
      success: true,
      officer: selectedOfficer,
      reason: suggestion.reason,
      confidence: 'high'
    };

  } catch (error) {
    console.error('Auto-assignment error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process image/PDF with OCR and extract grievance details using Gemini
 */
async function processGrievanceDocument(filePath, fileType) {
  try {
    // Read file as base64
    const fileBuffer = await fs.readFile(filePath);
    const base64Data = fileBuffer.toString('base64');

    // Determine mime type
    const mimeTypeMap = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'pdf': 'application/pdf'
    };
    const mimeType = mimeTypeMap[fileType.toLowerCase()] || 'image/jpeg';

    // Initialize Gemini Pro Vision model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Construct prompt for intelligent extraction
    const prompt = `You are an AI assistant for Maharashtra's Grievance Management System (जनता दरबार).

Extract the following information from this complaint document/image in Marathi or English:

1. **Summary**: Brief one-line summary of the complaint (in original language)
2. **Description**: Detailed description of the issue (extract all text)
3. **Category**: Classify into one of these: water, road, electricity, health, sanitation, police, revenue, education, agriculture, housing, employment, pension, transport, environment, other
4. **Severity**: Classify as: low, medium, high, or critical (based on urgency and impact)
5. **Location**: Extract any location/address mentioned (area, landmark, village, city)
6. **Pincode**: Extract pincode if mentioned
7. **Citizen Name**: Extract complainant's name if mentioned
8. **Phone**: Extract phone number if mentioned
9. **Department**: Suggest which department should handle this (from: Water Resources, Public Works, Electricity, Health, Sanitation, Police, Revenue, Education, Agriculture, Rural Development, Urban Development, Transport, Social Welfare, Women & Child Development, Labour, Environment, Tourism)

If any field is not found in the document, return null for that field.

Return ONLY a valid JSON object with these exact keys: summary, description, category, severity, location, pincode, citizen_name, phone, suggested_department

Do not include any markdown formatting or code blocks, just the raw JSON.`;

    // Generate content with image
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    let extractedData;
    try {
      // Clean the response - remove markdown code blocks if present
      const cleanText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      extractedData = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Error parsing Gemini response:', text);
      throw new Error('Failed to parse OCR response. The AI response was not valid JSON.');
    }

    // Validate and return extracted data
    return {
      success: true,
      data: {
        summary: extractedData.summary || null,
        description: extractedData.description || null,
        category: extractedData.category || 'other',
        severity: extractedData.severity || 'medium',
        location: extractedData.location || null,
        pincode: extractedData.pincode || null,
        citizen_name: extractedData.citizen_name || null,
        phone: extractedData.phone || null,
        suggested_department: extractedData.suggested_department || null,
        raw_text: text,
        processed_at: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('OCR Processing Error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

/**
 * Process plain text grievance and suggest categorization
 */
async function processTextGrievance(summary, description) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an AI assistant for Maharashtra's Grievance Management System.

Based on this grievance, suggest appropriate categorization:

Summary: ${summary}
Description: ${description}

Analyze and return:
1. **Category**: Choose one: water, road, electricity, health, sanitation, police, revenue, education, agriculture, housing, employment, pension, transport, environment, other
2. **Severity**: Choose one: low, medium, high, critical
3. **Department**: Suggest which department: Water Resources, Public Works, Electricity, Health, Sanitation, Police, Revenue, Education, Agriculture, Rural Development, Urban Development, Transport, Social Welfare, Women & Child Development, Labour, Environment, Tourism

Return ONLY a valid JSON object with keys: category, severity, suggested_department

Do not include markdown or code blocks.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const suggestions = JSON.parse(cleanText);

    return {
      success: true,
      suggestions: {
        category: suggestions.category || 'other',
        severity: suggestions.severity || 'medium',
        suggested_department: suggestions.suggested_department || null
      }
    };

  } catch (error) {
    console.error('Text Analysis Error:', error);
    return {
      success: false,
      error: error.message,
      suggestions: {
        category: 'other',
        severity: 'medium',
        suggested_department: null
      }
    };
  }
}

/**
 * ELON MODE: Complete Auto-Processing Pipeline
 * Upload → OCR → Auto-Assign → Notify - ALL AUTOMATIC
 */
async function completeAutoProcessing(filePath, fileType) {
  try {
    // Step 1: Extract data with OCR
    const ocrResult = await processGrievanceDocument(filePath, fileType);

    if (!ocrResult.success) {
      return { success: false, error: ocrResult.error };
    }

    // Step 2: Auto-suggest officer assignment
    const assignmentSuggestion = await suggestOfficerAssignment(ocrResult.data);

    return {
      success: true,
      ocr_data: ocrResult.data,
      suggested_officer: assignmentSuggestion.officer || null,
      assignment_reason: assignmentSuggestion.reason || null,
      ready_to_assign: assignmentSuggestion.success
    };

  } catch (error) {
    console.error('Auto-processing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  processGrievanceDocument,
  processTextGrievance,
  suggestOfficerAssignment,
  completeAutoProcessing
};
