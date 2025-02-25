// server.js - Complete Express.js implementation for VirusTotal file uploads

// Required dependencies
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const os = require('os');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir()); // Store files in system temp directory
  },
  filename: (req, file, cb) => {
    // Preserve original filename
    cb(null, file.originalname);
  }
});

// Create multer upload middleware
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limit file size to 10MB
  },
  fileFilter: (req, file, cb) => {
    // Optional: Add file type validation here if needed
    cb(null, true);
  }
});

// Use environment variable for API key (with fallback for development)
const VIRUS_TOTAL_API_KEY = process.env.VIRUS_TOTAL_API_KEY || 'b226d2bbf0c1d23104c99e14c2c6cb7ec8edf6c03253d40ea77b6701fcd2585f';

// Middleware for basic request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Create route for file uploads
app.post('/upload', upload.single('email'), async (req, res) => {
  // Set response type to JSON
  res.setHeader('Content-Type', 'application/json');
  
  // Check if file was uploaded
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  
  const uploadedFile = req.file;
  const fileName = uploadedFile.originalname || 'default_email.eml';
  const filePath = uploadedFile.path;
  
  try {
    // Validate that the file exists
    if (!fs.existsSync(filePath)) {
      return res.status(500).json({ error: 'File upload failed.' });
    }
    
    // Create form data for VirusTotal API
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath), {
      filename: fileName,
      contentType: 'application/octet-stream'
    });
    
    console.log(`Scanning file: ${fileName}`);
    
    // Send file to VirusTotal
    const virusTotalResponse = await axios({
      method: 'post',
      url: 'https://www.virustotal.com/api/v3/files',
      headers: {
        'x-apikey': VIRUS_TOTAL_API_KEY,
        ...formData.getHeaders()
      },
      data: formData,
      timeout: 30000 // 30 second timeout
    });
    
    // Return the VirusTotal response
    console.log(`VirusTotal scan completed for: ${fileName}`);
    res.json(virusTotalResponse.data);
  } catch (error) {
    // Handle errors
    console.error(`Error during VirusTotal scan for ${fileName}:`, error.message);
    
    // Provide more detailed error messages based on error type
    if (error.response) {
      // VirusTotal API responded with an error
      return res.status(error.response.status).json({ 
        error: `VirusTotal API error: ${error.response.status}`,
        details: error.response.data
      });
    } else if (error.request) {
      // No response received from VirusTotal
      return res.status(503).json({ 
        error: 'Unable to connect to VirusTotal API'
      });
    } else {
      // Something else went wrong
      return res.status(500).json({ 
        error: 'An error occurred during the scan.',
        message: error.message
      });
    }
  } finally {
    // Delete temporary file
    try {
      fs.unlinkSync(filePath);
      console.log(`Temporary file deleted: ${fileName}`);
    } catch (err) {
      console.error(`Error deleting temporary file ${fileName}:`, err.message);
    }
  }
});

// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Server error', message: err.message });
});

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Upload endpoint available at: http://localhost:${port}/upload`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Shutting down gracefully.');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received. Shutting down gracefully.');
  process.exit(0);
});