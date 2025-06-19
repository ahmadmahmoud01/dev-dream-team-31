const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const Groq = require('groq-sdk');

const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Configure multer for multiple file uploads
const multipleUpload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5 // Maximum 5 files
  }
});

// PRD Generation endpoint for multiple files
app.post('/api/generate-prd-multiple', multipleUpload.array('requirements', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No requirements files uploaded' });
    }

    console.log(`Processing ${req.files.length} files`);

    // Read all uploaded files
    const allRequirements = [];
    const fileNames = [];

    for (const file of req.files) {
      try {
        const content = fs.readFileSync(file.path, 'utf8');
        allRequirements.push({
          filename: file.originalname,
          content: content
        });
        fileNames.push(file.originalname);
      } catch (readError) {
        console.error(`Error reading file ${file.originalname}:`, readError);
        // Continue with other files
      }
    }

    if (allRequirements.length === 0) {
      return res.status(400).json({ error: 'No readable files found' });
    }

    // Generate PRD content using Groq with multiple files
    const prdData = await generatePRDContentFromMultipleFiles(allRequirements);

    // Generate Word document
    const documentBuffer = await generateWordDocument(prdData);

    // Clean up uploaded files
    req.files.forEach(file => {
      try {
        fs.unlinkSync(file.path);
      } catch (cleanupError) {
        console.error(`Error cleaning up file ${file.path}:`, cleanupError);
      }
    });

    // Send document
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="PRD_MultipleFiles_${new Date().toISOString().split('T')[0]}.docx"`);
    res.send(documentBuffer);

  } catch (error) {
    console.error('Error generating PRD from multiple files:', error);
    
    // Clean up files on error
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (cleanupError) {
          console.error(`Error cleaning up file ${file.path}:`, cleanupError);
        }
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Generate PRD content using Groq from multiple files
async function generatePRDContentFromMultipleFiles(requirements) {
  const systemPrompt = `You are an expert Product Manager. You will receive requirements from multiple files. 
  Analyze and consolidate all requirements to generate a comprehensive, unified PRD in JSON format with these exact fields:
  - projectName: string (unified project name)
  - generatedFrom: string (list of source files)
  - date: string
  - overview: string (consolidated overview, 3-4 paragraphs)
  - objectives: array of strings (consolidated objectives, max 8)
  - keyFeatures: array of objects with {title: string, priority: string, description: string} (consolidated features, max 10)
  - userStories: array of objects with {as: string, want: string, so: string} (consolidated user stories, max 8)
  
  Combine and prioritize requirements from all sources. Eliminate duplicates and create a unified vision.`;

  // Combine all file contents
  const combinedContent = requirements.map(req => 
    `=== FROM FILE: ${req.filename} ===\n${req.content}\n\n`
  ).join('');

  const fileList = requirements.map(req => req.filename).join(', ');

  const userPrompt = `Based on requirements from multiple files: "${fileList}", generate a unified PRD:
  
  ${combinedContent.substring(0, 25000)} // Truncate to avoid token limits
  
  Consolidate all requirements into a single, comprehensive PRD. Return valid JSON only.`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 6000 // Increased for multiple files
  });

  const content = completion.choices[0]?.message?.content;
  
  try {
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (parseError) {
    console.log('JSON parsing failed, using fallback for multiple files');
  }

  // Fallback structured data for multiple files
  return {
    projectName: `Consolidated Project from ${requirements.length} Files`,
    generatedFrom: fileList,
    date: new Date().toLocaleDateString(),
    overview: `This document consolidates product requirements and specifications from ${requirements.length} source files: ${fileList}. The requirements have been analyzed, prioritized, and unified to create a comprehensive product specification that addresses all stakeholder needs and technical considerations.`,
    objectives: [
      "Consolidate requirements from multiple sources",
      "Define unified product vision and scope",
      "Establish clear development priorities",
      "Ensure stakeholder alignment across all requirements",
      "Create comprehensive technical specifications"
    ],
    keyFeatures: [
      {
        title: "Consolidated Core Functionality",
        priority: "High",
        description: "Essential features identified across all requirement documents"
      },
      {
        title: "Integrated User Experience",
        priority: "High", 
        description: "Unified user experience combining insights from all sources"
      }
    ],
    userStories: [
      {
        as: "a stakeholder",
        want: "to see all requirements consolidated in one document",
        so: "I can understand the complete project scope"
      },
      {
        as: "a developer",
        want: "to have clear, prioritized requirements",
        so: "I can plan and implement features effectively"
      }
    ]
  };
}

// Initialize Groq client
const groq = new Groq({
  apiKey: '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'
});

// Create templates directory
const templatesDir = path.join(__dirname, 'templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir);
}

// PRD Generation endpoint
app.post('/api/generate-prd', upload.single('requirements'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No requirements file uploaded' });
    }

    // Read uploaded file
    const requirementsContent = fs.readFileSync(req.file.path, 'utf8');
    const fileName = req.file.originalname;

    console.log('Processing file:', fileName);

    // Generate PRD content using Groq
    const prdData = await generatePRDContent(requirementsContent, fileName);

    // Generate Word document
    const documentBuffer = await generateWordDocument(prdData);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // Send document
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="PRD_${fileName.replace(/\.[^/.]+$/, "")}_${new Date().toISOString().split('T')[0]}.docx"`);
    res.send(documentBuffer);

  } catch (error) {
    console.error('Error generating PRD:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate PRD content using Groq
async function generatePRDContent(requirements, filename) {
  const systemPrompt = `You are an expert Product Manager. Generate a structured PRD in JSON format with these exact fields:
  - projectName: string
  - generatedFrom: string  
  - date: string
  - overview: string (2-3 paragraphs)
  - objectives: array of strings (max 5)
  - keyFeatures: array of objects with {title: string, priority: string, description: string} (max 6)
  - userStories: array of objects with {as: string, want: string, so: string} (max 4)
  
  Keep responses concise and professional.`;

  const userPrompt = `Based on requirements from "${filename}", generate PRD data:
  
  ${requirements.substring(0, 30000)} // Truncate to avoid token limits
  
  Return valid JSON only.`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant", // Using smaller model to avoid rate limits
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 4000
  });

  const content = completion.choices[0]?.message?.content;
  
  try {
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (parseError) {
    console.log('JSON parsing failed, using fallback');
  }

  // Fallback structured data
  return {
    projectName: `Project from ${filename}`,
    generatedFrom: filename,
    date: new Date().toLocaleDateString(),
    overview: "This document outlines the product requirements and specifications based on the provided requirements file.",
    objectives: [
      "Define clear product requirements",
      "Establish development guidelines", 
      "Ensure stakeholder alignment"
    ],
    keyFeatures: [
      {
        title: "Core Functionality",
        priority: "High",
        description: "Essential features required for the product to function"
      }
    ],
    userStories: [
      {
        as: "a user",
        want: "to access the core functionality", 
        so: "I can accomplish my goals efficiently"
      }
    ]
  };
}

// Generate Word document using template
async function generateWordDocument(data) {
  const templatePath = path.join(__dirname, 'templates', '2p-template.docx');
  
  // Check if template exists
  if (!fs.existsSync(templatePath)) {
    throw new Error('Template file not found. Please add prd-template.docx to backend/templates/');
  }

  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.setData(data);
  
  try {
    doc.render();
  } catch (error) {
    console.error('Template rendering error:', error);
    throw new Error(`Template error: ${error.message}`);
  }

  return doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend server is running!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
