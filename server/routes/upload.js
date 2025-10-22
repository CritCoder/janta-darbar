const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const { authenticateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const { processGrievanceDocument } = require('../services/ocrService');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and documents
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

// Upload single file
router.post('/single', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { grievance_id, type = 'image' } = req.body;
    const file = req.file;
    
    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    let processedBuffer = file.buffer;
    let fileType = type;

    // Process image files
    if (file.mimetype.startsWith('image/')) {
      try {
        // Resize and optimize image
        processedBuffer = await sharp(file.buffer)
          .resize(1920, 1080, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .jpeg({ quality: 85 })
          .toBuffer();
        
        fileType = 'image';
      } catch (error) {
        console.error('Image processing error:', error);
        // Use original buffer if processing fails
        processedBuffer = file.buffer;
      }
    }

    // Upload to storage (implement your storage service)
    const fileUrl = await uploadToStorage(processedBuffer, fileName, fileType);
    
    // Save to database if grievance_id provided
    if (grievance_id) {
      const pool = require('../config/database');
      await pool.query(
        'INSERT INTO media (grievance_id, url, type, uploaded_by) VALUES ($1, $2, $3, $4)',
        [grievance_id, fileUrl, fileType, req.user.id]
      );
    }

    res.json({
      message: 'File uploaded successfully',
      file: {
        url: fileUrl,
        type: fileType,
        size: processedBuffer.length,
        original_name: file.originalname
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Upload multiple files
router.post('/multiple', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { grievance_id } = req.body;
    const files = req.files;
    const uploadedFiles = [];

    for (const file of files) {
      try {
        // Generate unique filename
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        
        let processedBuffer = file.buffer;
        let fileType = 'image';

        // Process image files
        if (file.mimetype.startsWith('image/')) {
          try {
            processedBuffer = await sharp(file.buffer)
              .resize(1920, 1080, { 
                fit: 'inside',
                withoutEnlargement: true 
              })
              .jpeg({ quality: 85 })
              .toBuffer();
          } catch (error) {
            console.error('Image processing error:', error);
            processedBuffer = file.buffer;
          }
        } else {
          fileType = 'document';
        }

        // Upload to storage
        const fileUrl = await uploadToStorage(processedBuffer, fileName, fileType);
        
        // Save to database if grievance_id provided
        if (grievance_id) {
          const pool = require('../config/database');
          await pool.query(
            'INSERT INTO media (grievance_id, url, type, uploaded_by) VALUES ($1, $2, $3, $4)',
            [grievance_id, fileUrl, fileType, req.user.id]
          );
        }

        uploadedFiles.push({
          url: fileUrl,
          type: fileType,
          size: processedBuffer.length,
          original_name: file.originalname
        });
      } catch (error) {
        console.error('Error processing file:', file.originalname, error);
        // Continue with other files
      }
    }

    res.json({
      message: `${uploadedFiles.length} files uploaded successfully`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Get uploaded files for a grievance
router.get('/grievance/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = require('../config/database');
    
    const result = await pool.query(
      'SELECT * FROM media WHERE grievance_id = $1 ORDER BY created_at ASC',
      [id]
    );
    
    res.json({ files: result.rows });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Delete uploaded file
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = require('../config/database');
    
    // Get file details
    const fileResult = await pool.query(
      'SELECT * FROM media WHERE id = $1',
      [id]
    );
    
    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const file = fileResult.rows[0];
    
    // Delete from storage
    await deleteFromStorage(file.url);
    
    // Delete from database
    await pool.query('DELETE FROM media WHERE id = $1', [id]);
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

/**
 * Upload and process grievance document with OCR (for public citizens)
 * POST /api/upload/ocr-grievance
 * No authentication required for public submissions
 */
router.post('/ocr-grievance', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;

    // Generate unique filename and save temporarily for OCR
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const uploadDir = path.join(__dirname, '../uploads/temp');
    await fs.mkdir(uploadDir, { recursive: true });

    const tempFilePath = path.join(uploadDir, fileName);
    await fs.writeFile(tempFilePath, file.buffer);

    // Process with OCR using Gemini
    console.log('Processing file with OCR:', fileName);
    const ocrResult = await processGrievanceDocument(tempFilePath, fileExtension);

    // Upload to permanent storage
    let fileUrl;
    try {
      fileUrl = await uploadToStorage(file.buffer, fileName, 'document');
    } catch (error) {
      console.error('Storage upload error:', error);
      // Fallback to local storage
      const publicDir = path.join(__dirname, '../uploads/public');
      await fs.mkdir(publicDir, { recursive: true });
      const publicPath = path.join(publicDir, fileName);
      await fs.copyFile(tempFilePath, publicPath);
      fileUrl = `/uploads/public/${fileName}`;
    }

    // Clean up temp file
    try {
      await fs.unlink(tempFilePath);
    } catch (error) {
      console.error('Error deleting temp file:', error);
    }

    if (!ocrResult.success) {
      return res.status(200).json({
        message: 'File uploaded but OCR processing failed',
        file_url: fileUrl,
        file_info: {
          filename: fileName,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        },
        ocr_data: null,
        ocr_error: ocrResult.error
      });
    }

    // Return file info and extracted data
    res.status(200).json({
      message: 'File uploaded and processed successfully',
      file_url: fileUrl,
      file_info: {
        filename: fileName,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      },
      ocr_data: ocrResult.data
    });

  } catch (error) {
    console.error('OCR upload error:', error);
    res.status(500).json({
      error: 'File upload and OCR processing failed',
      message: error.message
    });
  }
});

// Helper functions (implement based on your storage solution)
async function uploadToStorage(buffer, fileName, fileType) {
  // Implement your storage upload logic (AWS S3, Google Cloud Storage, etc.)
  // For now, save to local uploads directory
  const uploadDir = path.join(__dirname, '../uploads/public');
  await fs.mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, fileName);
  await fs.writeFile(filePath, buffer);
  return `/uploads/public/${fileName}`;
}

async function deleteFromStorage(fileUrl) {
  // Implement your storage delete logic
  try {
    if (fileUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', fileUrl);
      await fs.unlink(filePath);
    }
  } catch (error) {
    console.error('Delete error:', error);
  }
}

module.exports = router;
