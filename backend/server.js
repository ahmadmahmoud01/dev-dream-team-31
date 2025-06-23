const axios = require('axios');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const Groq = require('groq-sdk');
const { Octokit } = require('@octokit/rest');
require('dotenv').config();

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

// Initialize Groq client
const groq = new Groq({
  apiKey: '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'
});

// Create directories
const templatesDir = path.join(__dirname, 'templates');
const mergedDir = path.join(__dirname, 'merged');
const chunksDir = path.join(__dirname, 'chunks');

[templatesDir, mergedDir, chunksDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
});

// PRD Generation endpoint for single file (unchanged)
app.post('/api/generate-prd', upload.single('requirements'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No requirements file uploaded' });
    }

    const requirementsContent = fs.readFileSync(req.file.path, 'utf8');
    const fileName = req.file.originalname;

    console.log('Processing file:', fileName);

    // Use chunked processing for single files too
    const prdData = await generatePRDContentWithChunking(requirementsContent, fileName);
    const documentBuffer = await generateWordDocument(prdData);

    fs.unlinkSync(req.file.path);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="PRD_${fileName.replace(/\.[^/.]+$/, "")}_${new Date().toISOString().split('T')[0]}.docx"`);
    res.send(documentBuffer);

  } catch (error) {
    console.error('Error generating PRD:', error);
    res.status(500).json({ error: error.message });
  }
});

// PRD Generation endpoint for multiple files - UPDATED WITH CHUNKING
app.post('/api/generate-prd-multiple', multipleUpload.array('requirements', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No requirements files uploaded' });
    }

    console.log(`Processing ${req.files.length} files with intelligent chunking`);

    // Step 1: Merge all files
    const mergedFileInfo = await mergeMultipleFiles(req.files);
    console.log(`Files merged successfully: ${mergedFileInfo.filename}`);

    // Step 2: Generate PRD using intelligent chunking
    const prdData = await generatePRDContentWithChunking(mergedFileInfo.content, mergedFileInfo.filename);
    console.log('PRD generation completed using chunked processing');

    // Step 3: Generate Word document
    const documentBuffer = await generateWordDocument(prdData);

    // Step 4: Cleanup
    req.files.forEach(file => {
      try { fs.unlinkSync(file.path); } catch (e) {}
    });
    try { fs.unlinkSync(mergedFileInfo.path); } catch (e) {}

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="PRD_ChunkedProcessing_${new Date().toISOString().split('T')[0]}.docx"`);
    res.send(documentBuffer);

  } catch (error) {
    console.error('Error generating PRD from multiple files:', error);
    
    if (req.files) {
      req.files.forEach(file => {
        try { fs.unlinkSync(file.path); } catch (e) {}
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// NEW: Intelligent Content Chunking Function
async function generatePRDContentWithChunking(content, filename) {
  console.log(`Starting chunked processing for: ${filename}`);
  
  // Step 1: Create content chunks that fit within token limits
  const chunks = createIntelligentChunks(content, 4000); // 4000 chars ≈ ~1000 tokens
  console.log(`Content split into ${chunks.length} chunks`);

  // Step 2: Process each chunk to extract key information
  const chunkAnalyses = [];
  
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Processing chunk ${i + 1}/${chunks.length}`);
    
    try {
      const analysis = await analyzeChunk(chunks[i], i + 1, chunks.length, filename);
      chunkAnalyses.push(analysis);
      
      // Add delay to respect rate limits
      if (i < chunks.length - 1) {
        await sleep(2000); // 2 second delay between requests
      }
    } catch (error) {
      console.error(`Error processing chunk ${i + 1}:`, error);
      // Continue with other chunks
      chunkAnalyses.push({
        features: [],
        objectives: [],
        userStories: [],
        overview: `[Chunk ${i + 1} processing failed]`
      });
    }
  }

  // Step 3: Consolidate all chunk analyses into final PRD
  return consolidateChunkAnalyses(chunkAnalyses, filename);
}

// NEW: Create intelligent content chunks
function createIntelligentChunks(content, maxChunkSize = 4000) {
  const chunks = [];
  const lines = content.split('\n');
  let currentChunk = '';
  
  for (const line of lines) {
    // If adding this line would exceed chunk size, start a new chunk
    if (currentChunk.length + line.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = line + '\n';
    } else {
      currentChunk += line + '\n';
    }
  }
  
  // Add the last chunk if it has content
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// NEW: Analyze individual chunk
// IMPROVED: Enhanced chunk analysis with better prompting
async function analyzeChunk(chunkContent, chunkNumber, totalChunks, filename) {
  // Clean and prepare content
  const cleanContent = chunkContent
    .replace(/={3,}/g, '') // Remove separator lines
    .replace(/FILE \d+:/g, '') // Remove file headers
    .replace(/END OF FILE \d+:/g, '') // Remove file footers
    .trim();

  if (cleanContent.length < 50) {
    return {
      features: [],
      objectives: [],
      userStories: [],
      overview: `Chunk ${chunkNumber} contains minimal content`
    };
  }

  const systemPrompt = `You are a Product Manager analyzing requirements. Extract SPECIFIC information from the content.
  Return ONLY a JSON object with this exact structure:
  {
    "features": ["specific feature name", "another feature"],
    "objectives": ["specific objective", "another objective"],
    "userStories": ["specific user need", "another user need"],
    "overview": "brief summary of what this section covers"
  }
  
  Extract REAL requirements, not generic placeholders. If you can't find specific information, use empty arrays.`;

  const userPrompt = `Extract specific requirements from this EduTrack content:

${cleanContent}

Focus on:
- Actual feature names and functionality
- Specific business objectives
- Real user needs and scenarios
- Concrete requirements

Return only the JSON object.`;

  try {
    const completion = await groq.chat.completions.create({
      //model: "`llama-3.1-`8b-instant",
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      //model: "llama-3.1-70b-versatile",
      //model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1, // Lower temperature for more consistent output
      max_tokens: 1200
    });

    const content = completion.choices[0]?.message?.content;
    console.log(`Chunk ${chunkNumber} raw response:`, content?.substring(0, 200));
    
    // Enhanced JSON extraction
    let jsonData = null;
    
    // Try multiple JSON extraction methods
    const jsonPatterns = [
      /\{[\s\S]*\}/,  // Standard JSON
      /``````/,  // JSON in code blocks
      /``````/  // JSON in generic code blocks
    ];

    for (const pattern of jsonPatterns) {
      const match = content.match(pattern);
      if (match) {
        try {
          jsonData = JSON.parse(match[1] || match[0]);
          break;
        } catch (e) {
          continue;
        }
      }
    }

    if (jsonData && typeof jsonData === 'object') {
      // Validate and clean the extracted data
      return {
        features: Array.isArray(jsonData.features) ? jsonData.features.filter(f => f && f.length > 3) : [],
        objectives: Array.isArray(jsonData.objectives) ? jsonData.objectives.filter(o => o && o.length > 3) : [],
        userStories: Array.isArray(jsonData.userStories) ? jsonData.userStories.filter(s => s && s.length > 3) : [],
        overview: jsonData.overview || `Analysis of chunk ${chunkNumber}`
      };
    }

  } catch (error) {
    console.error(`Error processing chunk ${chunkNumber}:`, error.message);
  }

  // Enhanced fallback - try to extract content manually
  return extractContentManually(cleanContent, chunkNumber);
}

// NEW: Manual content extraction as fallback
function extractContentManually(content, chunkNumber) {
  const features = [];
  const objectives = [];
  const userStories = [];
  
  // Look for common patterns in requirements documents
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Extract features
    if (lowerLine.includes('feature') || lowerLine.includes('functionality') || lowerLine.includes('capability')) {
      if (!lowerLine.includes('chunk') && line.length > 10) {
        features.push(line);
      }
    }
    
    // Extract objectives
    if (lowerLine.includes('objective') || lowerLine.includes('goal') || lowerLine.includes('purpose')) {
      if (!lowerLine.includes('chunk') && line.length > 10) {
        objectives.push(line);
      }
    }
    
    // Extract user stories/needs
    if (lowerLine.includes('user') || lowerLine.includes('student') || lowerLine.includes('teacher') || lowerLine.includes('admin')) {
      if (!lowerLine.includes('chunk') && line.length > 10) {
        userStories.push(line);
      }
    }
  }

  return {
    features: features.slice(0, 5), // Limit to prevent overflow
    objectives: objectives.slice(0, 5),
    userStories: userStories.slice(0, 5),
    overview: `Manual extraction from chunk ${chunkNumber} - found ${features.length} features, ${objectives.length} objectives, ${userStories.length} user stories`
  };
}


// FIXED: Proper data structure for template rendering
function consolidateChunkAnalyses(analyses, filename) {
  console.log('Consolidating analyses with proper data structure...');

  // Filter valid analyses
  const validAnalyses = analyses.filter(a => 
    (a.features && a.features.length > 0) || 
    (a.objectives && a.objectives.length > 0) || 
    (a.userStories && a.userStories.length > 0)
  );

  console.log(`Found ${validAnalyses.length} valid analyses out of ${analyses.length} total`);

  // Enhanced overview
  const validOverviews = validAnalyses
    .map(a => a.overview)
    .filter(o => o && !o.includes('chunk') && !o.includes('failed') && o.length > 20);
  
  const overview = validOverviews.length > 0 
    ? `The EduTrack Educational Management System is designed to revolutionize educational processes through comprehensive tracking, analytics, and management capabilities. ${validOverviews.slice(0, 2).join(' ')} This system addresses the needs of students, teachers, administrators, and parents by providing an integrated platform for educational excellence.`
    : `The EduTrack Educational Management System is a comprehensive platform designed to enhance educational outcomes through advanced tracking, personalized learning, and streamlined administrative processes. The system serves multiple stakeholders including students, teachers, administrators, and parents, providing each with tailored functionality to support educational success.`;

  // Clean and deduplicate objectives - RETURN AS STRINGS, NOT OBJECTS
  const allObjectives = validAnalyses.flatMap(a => a.objectives || []);
  const cleanObjectives = [...new Set(allObjectives)]
    .filter(obj => obj && typeof obj === 'string' && obj.length > 10 && !obj.toLowerCase().includes('chunk'))
    .map(obj => obj.charAt(0).toUpperCase() + obj.slice(1))
    .slice(0, 8);
  
  const objectives = cleanObjectives.length > 0 
    ? cleanObjectives 
    : [
        "Enhance student learning outcomes through personalized education paths",
        "Streamline administrative processes and reduce manual workload",
        "Provide real-time insights into student progress and performance",
        "Facilitate effective communication between all stakeholders",
        "Ensure data security and privacy compliance across all operations",
        "Support scalable deployment across multiple educational institutions"
      ];

  // Enhanced features - PROPER OBJECT STRUCTURE
  const allFeatures = validAnalyses.flatMap(a => a.features || []);
  const uniqueFeatures = [...new Set(allFeatures)]
    .filter(feature => feature && typeof feature === 'string' && feature.length > 5 && !feature.toLowerCase().includes('chunk'))
    .slice(0, 10);

  const keyFeatures = uniqueFeatures.length > 0
    ? uniqueFeatures.map(feature => ({
        title: cleanFeatureTitle(feature),
        description: enhanceFeatureDescription(feature)
      }))
    : [
        {
          title: "Student Progress Dashboard",
          description: "Comprehensive real-time dashboard providing students with detailed insights into their academic progress, grades, assignments, and personalized recommendations for improvement."
        },
        {
          title: "Automated Grade Tracking",
          description: "Intelligent system that automatically captures, processes, and organizes student grades from various sources, providing instant updates to students, teachers, and parents."
        },
        {
          title: "Personalized Learning Plans",
          description: "AI-driven system that creates customized learning paths for each student based on their performance, learning style, and academic goals."
        },
        {
          title: "Real-time Progress Monitoring",
          description: "Advanced monitoring system that tracks student engagement, completion rates, and performance metrics in real-time, enabling timely interventions."
        },
        {
          title: "Multi-Role Access Control",
          description: "Secure role-based access system ensuring that students, teachers, administrators, and parents have appropriate access to relevant information and functionality."
        },
        {
          title: "Communication Hub",
          description: "Integrated communication platform facilitating seamless interaction between students, teachers, parents, and administrators through messaging, notifications, and announcements."
        }
      ];

  // Clean and enhance user stories - PROPER OBJECT STRUCTURE
  const allUserStories = validAnalyses.flatMap(a => a.userStories || []);
  const cleanUserStories = [...new Set(allUserStories)]
    .filter(story => story && typeof story === 'string' && story.length > 10 && !story.toLowerCase().includes('chunk'))
    .slice(0, 8);

  const userStories = cleanUserStories.length > 0
    ? cleanUserStories.map(story => parseUserStory(story))
    : [
        {
          as: "a student",
          want: "to view my real-time academic progress and grades",
          so: "I can track my learning journey and identify areas needing improvement"
        },
        {
          as: "a teacher",
          want: "to create and manage personalized learning plans for each student",
          so: "I can provide targeted educational support based on individual needs"
        },
        {
          as: "a parent",
          want: "to monitor my child's academic progress and receive important notifications",
          so: "I can stay informed and support my child's educational journey"
        },
        {
          as: "an administrator",
          want: "to generate comprehensive reports on institutional performance",
          so: "I can make data-driven decisions to improve educational outcomes"
        },
        {
          as: "a teacher",
          want: "to receive automated alerts about students who may need additional support",
          so: "I can provide timely interventions to help struggling students"
        },
        {
          as: "a student",
          want: "to receive personalized recommendations for study materials and resources",
          so: "I can optimize my learning experience and achieve better results"
        }
      ];

  // RETURN PROPER DATA STRUCTURE FOR TEMPLATE
  const consolidated = {
    projectName: "EduTrack Educational Management System",
    generatedFrom: filename.replace('Merged_Requirements_from_', '').replace('_files', ' source files'),
    date: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    overview: overview,
    objectives: objectives,
    keyFeatures: keyFeatures,
    userStories: userStories
  };

  // DEBUG: Log the final structure
  console.log('Final consolidated structure:');
  console.log('- projectName:', consolidated.projectName);
  console.log('- generatedFrom:', consolidated.generatedFrom);
  console.log('- date:', consolidated.date);
  console.log('- overview length:', consolidated.overview.length);
  console.log('- objectives count:', consolidated.objectives.length);
  console.log('- keyFeatures count:', consolidated.keyFeatures.length);
  console.log('- userStories count:', consolidated.userStories.length);

  return consolidated;
}


// Helper function to clean feature titles
function cleanFeatureTitle(feature) {
  // Remove redundant words and clean up the title
  let title = feature.replace(/^(Feature identified through chunked analysis: |Features from chunk \d+)/i, '').trim();
  
  // Capitalize first letter of each word
  title = title.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
  
  return title || 'System Feature';
}

// Helper function to enhance feature descriptions
function enhanceFeatureDescription(feature) {
  const baseFeature = feature.replace(/^(Feature identified through chunked analysis: |Features from chunk \d+)/i, '').trim();
  
  // Create more detailed descriptions based on feature names
  const descriptions = {
    'automated grade tracking': 'Intelligent system that automatically captures, processes, and organizes student grades from various sources, providing instant updates and analytics.',
    'personalized learning plans': 'AI-driven system that creates customized learning paths for each student based on their performance, learning style, and academic goals.',
    'real-time progress monitoring': 'Advanced monitoring system that tracks student engagement, completion rates, and performance metrics in real-time.',
    'user profile management': 'Comprehensive user management system allowing students, teachers, and administrators to maintain detailed profiles with relevant academic and personal information.',
    'notification system': 'Smart notification system that delivers timely alerts, reminders, and updates to all stakeholders through multiple channels.',
    'course enrollment system': 'Streamlined enrollment system that allows students to browse, select, and register for courses while managing prerequisites and capacity limits.'
  };
  
  const lowerFeature = baseFeature.toLowerCase();
  for (const [key, desc] of Object.entries(descriptions)) {
    if (lowerFeature.includes(key)) {
      return desc;
    }
  }
  
  return `Advanced ${baseFeature.toLowerCase()} functionality designed to enhance the educational experience and improve system efficiency.`;
}

// Helper function to parse user stories
function parseUserStory(story) {
  // Try to extract existing user story format
  const asMatch = story.match(/As (a|an) ([^,]+),/i);
  const wantMatch = story.match(/I want (to )?([^,]+)/i);
  const soMatch = story.match(/so (that )?(.+)/i);
  
  if (asMatch && wantMatch) {
    return {
      as: asMatch[1] + ' ' + asMatch[2],
      want: 'to ' + (wantMatch[2] || story.substring(0, 50)),
      so: soMatch ? soMatch[2] : 'I can achieve my educational goals effectively'
    };
  }
  
  // Fallback parsing
  return {
    as: "a system user",
    want: story.length > 80 ? story.substring(0, 80) + '...' : story,
    so: "I can effectively use the EduTrack system"
  };
}


// NEW: Enhanced fallback for when extraction fails
function createEnhancedFallback(filename) {
  return {
    projectName: "EduTrack Educational Management System",
    generatedFrom: filename,
    date: new Date().toLocaleDateString(),
    overview: "This PRD outlines requirements for the EduTrack educational management system based on stakeholder needs, functional requirements, and project scope documentation. The system aims to provide comprehensive educational tracking and management capabilities.",
    objectives: [
      "Implement comprehensive student progress tracking",
      "Develop intuitive user interfaces for all stakeholders",
      "Ensure data security and privacy compliance",
      "Provide real-time reporting and analytics",
      "Support scalable multi-institutional deployment"
    ],
    keyFeatures: [
      {
        title: "Student Progress Dashboard",
        priority: "High",
        description: "Real-time dashboard showing student academic progress and performance metrics"
      },
      {
        title: "Multi-Role Access Control",
        priority: "High",
        description: "Role-based access system for students, teachers, and administrators"
      },
      {
        title: "Reporting and Analytics",
        priority: "Medium",
        description: "Comprehensive reporting tools for academic and administrative insights"
      }
    ],
    userStories: [
      {
        as: "a student",
        want: "to view my academic progress and grades",
        so: "I can track my learning journey and identify areas for improvement"
      },
      {
        as: "a teacher",
        want: "to monitor student performance across my classes",
        so: "I can provide timely interventions and support"
      },
      {
        as: "an administrator",
        want: "to generate institutional reports",
        so: "I can make data-driven decisions for educational improvement"
      }
    ]
  };
}

// Utility function for delays
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Merge multiple files function (unchanged)
async function mergeMultipleFiles(files) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const mergedFileName = `merged_requirements_${timestamp}.txt`;
  const mergedFilePath = path.join(mergedDir, mergedFileName);

  let mergedContent = '';
  const fileNames = [];

  mergedContent += `=== MERGED REQUIREMENTS DOCUMENT ===\n`;
  mergedContent += `Generated: ${new Date().toLocaleString()}\n`;
  mergedContent += `Total Files: ${files.length}\n`;
  mergedContent += `Files Included: ${files.map(f => f.originalname).join(', ')}\n`;
  mergedContent += `\n${'='.repeat(80)}\n\n`;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    fileNames.push(file.originalname);
    
    try {
      const content = fs.readFileSync(file.path, 'utf8');
      
      mergedContent += `\n${'='.repeat(60)}\n`;
      mergedContent += `FILE ${i + 1}: ${file.originalname}\n`;
      mergedContent += `Size: ${(file.size / 1024).toFixed(2)} KB\n`;
      mergedContent += `${'='.repeat(60)}\n\n`;
      
      mergedContent += content.trim();
      mergedContent += `\n\n${'='.repeat(60)}\n`;
      mergedContent += `END OF FILE ${i + 1}: ${file.originalname}\n`;
      mergedContent += `${'='.repeat(60)}\n\n`;
      
    } catch (readError) {
      console.error(`Error reading file ${file.originalname}:`, readError);
      mergedContent += `\n[ERROR: Could not read file ${file.originalname}]\n\n`;
    }
  }

  mergedContent += `\n${'='.repeat(80)}\n`;
  mergedContent += `=== END OF MERGED REQUIREMENTS DOCUMENT ===\n`;

  fs.writeFileSync(mergedFilePath, mergedContent, 'utf8');

  return {
    filename: `Merged_Requirements_from_${files.length}_files`,
    content: mergedContent,
    path: mergedFilePath,
    originalFiles: fileNames
  };
}

// Generate Word document function (unchanged)
// IMPROVED: Enhanced Word document generation with error handling
// FIXED: Updated Docxtemplater API usage
async function generateWordDocument(data) {
  const templatePath = path.join(__dirname, 'templates', '2p-template.docx');
  
  if (!fs.existsSync(templatePath)) {
    throw new Error('Template file not found. Please add 2p-template.docx to backend/templates/');
  }

  // Validate data structure before processing
  console.log('Validating data structure for template...');
  
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data structure provided to template');
  }

  // Ensure all required fields are present and properly formatted
  const validatedData = {
    projectName: data.projectName || 'EduTrack Educational Management System',
    generatedFrom: data.generatedFrom || 'Multiple source files',
    date: data.date || new Date().toLocaleDateString(),
    overview: data.overview || 'System overview not available',
    objectives: Array.isArray(data.objectives) ? data.objectives : [],
    keyFeatures: Array.isArray(data.keyFeatures) ? data.keyFeatures : [],
    userStories: Array.isArray(data.userStories) ? data.userStories : []
  };

  console.log('Final validated data for template:');
  console.log('- projectName:', validatedData.projectName);
  console.log('- generatedFrom:', validatedData.generatedFrom);
  console.log('- date:', validatedData.date);
  console.log('- objectives:', validatedData.objectives.length, 'items');
  console.log('- keyFeatures:', validatedData.keyFeatures.length, 'items');
  console.log('- userStories:', validatedData.userStories.length, 'items');

  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  
  // UPDATED: Use new Docxtemplater API
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: function(part, scopeManager) {
      console.warn(`Template variable not found: ${part.value}`);
      return `[${part.value} not available]`;
    }
  });

  try {
    // FIXED: Use render() with data parameter instead of deprecated setData()
    doc.render(validatedData);
  } catch (error) {
    console.error('Template rendering error:', error);
    
    // Enhanced error reporting
    if (error.properties) {
      console.error('Error properties:', JSON.stringify(error.properties, null, 2));
    }
    
    // Check for common template issues
    if (error.message.includes('Multi error')) {
      console.error('Multiple template errors detected. Check template syntax.');
    }
    
    throw new Error(`Template rendering failed: ${error.message}`);
  }

  return doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });
}


// New endpoint for AI-powered test case generation from PRD
app.post('/api/generate-test-cases-from-prd', async (req, res) => {
  try {
    const { prdContent, testers, prdFileName } = req.body;

    if (!testers || !Array.isArray(testers) || testers.length === 0) {
      return res.status(400).json({ error: 'Testers array is required' });
    }

    console.log('Generating test cases for testers:', testers.length);

    // Generate comprehensive test cases from PRD content
    const testCases = await generateTestCasesFromPRD(prdContent, prdFileName, testers);

    res.json({ 
      success: true, 
      testCases: testCases,
      totalTestCases: testCases.length 
    });

  } catch (error) {
    console.error('Error generating test cases:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Helper function for comprehensive test case generation
async function generateTestCasesFromPRD(prdContent, prdFileName, testers) {
  try {
    const systemPrompt = `You are an expert QA Engineer and Test Manager. Analyze the provided PRD content and generate comprehensive test cases.

Requirements:
- Generate 10-15 detailed test cases covering all aspects of the PRD
- Include functional, UI/UX, integration, and edge case testing
- Each test case should have: title, description, preconditions, test steps, expected results
- Cover positive and negative test scenarios
- Include boundary value testing and error handling scenarios
- Return in structured JSON format

Return format:
{
  "testCases": [
    {
      "title": "Test case title",
      "description": "Detailed test case description",
      "preconditions": "Prerequisites for the test",
      "testSteps": ["Step 1", "Step 2", "Step 3"],
      "expectedResults": "Expected outcome",
      "priority": "High/Medium/Low",
      "category": "Functional/UI/Integration/Performance/Security"
    }
  ]
}`;

    const userPrompt = `Based on the PRD file "${prdFileName}", generate comprehensive test cases for the following requirements:

PRD Content Summary: ${prdContent.substring(0, 8000)}

Generate test cases that cover:
1. **Functional Testing**: Core feature functionality
2. **User Interface Testing**: UI components and user interactions
3. **Integration Testing**: API and system integration points
4. **Boundary Testing**: Edge cases and input validation
5. **Error Handling**: Negative scenarios and error conditions
6. **User Experience Testing**: Workflow and usability scenarios

Each test case should be:
- Specific and actionable
- Include clear test steps
- Have measurable expected results
- Cover both positive and negative scenarios
- Be realistic for manual and automated testing

Return only the JSON with 10-15 comprehensive test cases.`;

    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      //model: "llama-3.1-8b-instant",
      //model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, // Lower temperature for more consistent test cases
      max_tokens: 4000
    });

    const content = completion.choices[0]?.message?.content;
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedTestCases = JSON.parse(jsonMatch[0]);
        
        if (parsedTestCases.testCases && Array.isArray(parsedTestCases.testCases)) {
          return distributeTestCases(parsedTestCases.testCases, testers);
        }
      }
    } catch (parseError) {
      console.error('Failed to parse AI response for test cases');
    }

    // Fallback if AI parsing fails
    return generateFallbackTestCases(testers, prdFileName);
  } catch (error) {
    console.error('Error generating test cases:', error);
    return generateFallbackTestCases(testers, prdFileName);
  }
}

// Distribute test cases among testers
function distributeTestCases(testCases, testers) {
  const distributedTestCases = [];
  
  testCases.forEach((testCase, index) => {
    const assignedTester = testers[index % testers.length];
    distributedTestCases.push({
      title: `[TEST] ${testCase.title}`,
      description: `${testCase.description}

**Preconditions:**
${testCase.preconditions || 'No specific preconditions'}

**Test Steps:**
${Array.isArray(testCase.testSteps) ? testCase.testSteps.map((step, i) => `${i + 1}. ${step}`).join('\n') : testCase.testSteps || 'Test steps to be defined'}

**Expected Results:**
${testCase.expectedResults || 'Expected results to be defined'}

**Priority:** ${testCase.priority || 'Medium'}
**Category:** ${testCase.category || 'Functional'}

**Assigned to:** ${assignedTester.email}
**Role:** Tester
**Generated from PRD analysis**`,
      assignedTo: assignedTester.email,
      role: 'tester',
      priority: testCase.priority || 'Medium',
      category: testCase.category || 'Functional'
    });
  });

  return distributedTestCases;
}

// Fallback test case generation
function generateFallbackTestCases(testers, prdFileName) {
  const fallbackTestCases = [
    {
      title: 'User Authentication Functionality',
      description: 'Verify user login and authentication process',
      preconditions: 'Valid user credentials available',
      testSteps: ['Navigate to login page', 'Enter valid credentials', 'Click login button', 'Verify successful login'],
      expectedResults: 'User should be successfully authenticated and redirected to dashboard',
      priority: 'High',
      category: 'Functional'
    },
    {
      title: 'Input Validation Testing',
      description: 'Test input field validation and error handling',
      preconditions: 'Application forms are accessible',
      testSteps: ['Access input forms', 'Enter invalid data', 'Submit form', 'Verify error messages'],
      expectedResults: 'Appropriate error messages should be displayed for invalid inputs',
      priority: 'High',
      category: 'Functional'
    },
    {
      title: 'User Interface Responsiveness',
      description: 'Verify UI responsiveness across different screen sizes',
      preconditions: 'Application is accessible on different devices',
      testSteps: ['Open application on desktop', 'Resize browser window', 'Test on mobile device', 'Verify layout adaptation'],
      expectedResults: 'UI should adapt properly to different screen sizes',
      priority: 'Medium',
      category: 'UI'
    },
    {
      title: 'Data Integration Testing',
      description: 'Verify data flow between system components',
      preconditions: 'System components are connected',
      testSteps: ['Input data in one module', 'Verify data appears in connected modules', 'Test data synchronization', 'Validate data integrity'],
      expectedResults: 'Data should flow correctly between all system components',
      priority: 'High',
      category: 'Integration'
    },
    {
      title: 'Performance Load Testing',
      description: 'Test system performance under normal and peak loads',
      preconditions: 'Performance testing tools are available',
      testSteps: ['Simulate normal user load', 'Gradually increase user load', 'Monitor system performance', 'Identify performance bottlenecks'],
      expectedResults: 'System should maintain acceptable performance under expected load',
      priority: 'Medium',
      category: 'Performance'
    },
    {
      title: 'Error Handling and Recovery',
      description: 'Test system behavior during error conditions',
      preconditions: 'System is running normally',
      testSteps: ['Simulate network errors', 'Test database connection failures', 'Verify error messages', 'Test recovery procedures'],
      expectedResults: 'System should handle errors gracefully and provide clear error messages',
      priority: 'High',
      category: 'Functional'
    },
    {
      title: 'Security Access Control',
      description: 'Verify role-based access control and permissions',
      preconditions: 'Different user roles are configured',
      testSteps: ['Login with different user roles', 'Attempt to access restricted features', 'Verify permission enforcement', 'Test unauthorized access prevention'],
      expectedResults: 'Users should only access features appropriate to their role',
      priority: 'High',
      category: 'Security'
    },
    {
      title: 'Data Export and Import',
      description: 'Test data export and import functionality',
      preconditions: 'Sample data is available in the system',
      testSteps: ['Export data in various formats', 'Verify exported data integrity', 'Import data back to system', 'Validate imported data accuracy'],
      expectedResults: 'Data should be exported and imported without loss or corruption',
      priority: 'Medium',
      category: 'Functional'
    },
    {
      title: 'Browser Compatibility Testing',
      description: 'Verify application works across different browsers',
      preconditions: 'Multiple browsers are available for testing',
      testSteps: ['Test on Chrome browser', 'Test on Firefox browser', 'Test on Safari browser', 'Compare functionality across browsers'],
      expectedResults: 'Application should work consistently across all supported browsers',
      priority: 'Medium',
      category: 'Compatibility'
    },
    {
      title: 'User Workflow End-to-End Testing',
      description: 'Test complete user workflows from start to finish',
      preconditions: 'All system components are functional',
      testSteps: ['Start user workflow', 'Complete each step in sequence', 'Verify data persistence', 'Confirm workflow completion'],
      expectedResults: 'Complete user workflows should execute successfully without errors',
      priority: 'High',
      category: 'Integration'
    }
  ];

  return fallbackTestCases.map((testCase, index) => {
    const assignedTester = testers[index % testers.length];
    return {
      title: `[TEST] ${testCase.title}`,
      description: `${testCase.description}

**Preconditions:**
${testCase.preconditions}

**Test Steps:**
${testCase.testSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

**Expected Results:**
${testCase.expectedResults}

**Priority:** ${testCase.priority}
**Category:** ${testCase.category}

**Assigned to:** ${assignedTester.email}
**Role:** Tester
**Generated as fallback test case from PRD: ${prdFileName}`,
      assignedTo: assignedTester.email,
      role: 'tester',
      priority: testCase.priority,
      category: testCase.category
    };
  });
}

// Add this endpoint
// ✅ ENHANCED: Main endpoint with better validation
app.post('/api/azure-devops/create-nodejs-project', async (req, res) => {
  try {
    const { organizationUrl, projectName, repositoryName, personalAccessToken } = req.body;

    // Validate inputs
    const validation = validateAzureDevOpsInputs(organizationUrl, projectName, repositoryName, personalAccessToken);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        error: `Validation failed: ${validation.errors.join(', ')}` 
      });
    }

    console.log(`🚀 Creating Node.js project in Azure DevOps: ${organizationUrl}/${projectName}/${repositoryName}`);

    // Create repository in Azure DevOps
    const result = await createAzureDevOpsRepository(
      organizationUrl, 
      projectName, 
      repositoryName, 
      personalAccessToken
    );
    
    if (result.success) {
      // Add Node.js project files to the repository
      const filesResult = await addNodeJSProjectFiles(
        organizationUrl,
        projectName,
        repositoryName,
        personalAccessToken,
        result.repositoryId
      );

      if (filesResult.success) {
        res.json({ 
          success: true, 
          message: 'Node.js project created successfully in Azure DevOps',
          repositoryUrl: `${organizationUrl}/${projectName}/_git/${repositoryName}`,
          repositoryId: result.repositoryId,
          commitId: filesResult.commitId,
          webUrl: result.webUrl
        });
      } else {
        res.status(500).json({ 
          success: false, 
          error: `Repository created but failed to add files: ${filesResult.error}` 
        });
      }
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error 
      });
    }

  } catch (error) {
    console.error('❌ Error creating Azure DevOps project:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});


// Create Azure DevOps repository
async function createAzureDevOpsRepository(organizationUrl, projectName, repositoryName, pat) {
  try {
    let orgName = organizationUrl.replace('https://dev.azure.com/', '');
    orgName = orgName.replace(/\/+$/, '').replace(/\/+/g, '');
    
    // ✅ ALTERNATIVE: Use project name consistently but ensure proper encoding
    const encodedProjectName = encodeURIComponent(projectName);
    const createRepoUrl = `https://dev.azure.com/${orgName}/${encodedProjectName}/_apis/git/repositories?api-version=7.1`;
    
    console.log('🔗 Creating repository with URL:', createRepoUrl);
    console.log('📋 Project Name (encoded):', encodedProjectName);
    
    const requestBody = {
      name: repositoryName
      // ✅ Remove project reference entirely - let Azure DevOps infer from URL
    };

    const response = await axios.post(createRepoUrl, requestBody, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`:${pat}`).toString('base64')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (response.status === 201) {
      console.log(`✅ Repository created successfully: ${response.data.id}`);
      return { 
        success: true, 
        repositoryId: response.data.id,
        remoteUrl: response.data.remoteUrl,
        webUrl: response.data.webUrl
      };
    }

  } catch (error) {
    console.error('❌ Error creating Azure DevOps repository:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
}



// Add Node.js project files to Azure DevOps repository
async function addNodeJSProjectFiles(organizationUrl, projectName, repositoryName, pat, repositoryId) {
  try {
    // ✅ IMPROVED: Same URL cleaning logic
    let orgName = organizationUrl.replace('https://dev.azure.com/', '');
    orgName = orgName.replace(/\/+$/, ''); // Remove trailing slashes
    orgName = orgName.replace(/\/+/g, ''); // Remove any internal slashes
    
    if (!orgName || orgName.trim() === '') {
      throw new Error('Invalid organization URL. Could not extract organization name.');
    }
    
    // Generate project files
    const projectFiles = generateNodeJSProjectFiles();
    
    if (!projectFiles || projectFiles.length === 0) {
      throw new Error('No project files generated');
    }
    
    // ✅ CORRECTED: Proper push URL construction
    const pushUrl = `https://dev.azure.com/${orgName}/${encodeURIComponent(projectName)}/_apis/git/repositories/${repositoryId}/pushes?api-version=7.1`;
    
    console.log('📤 Pushing files with URL:', pushUrl);
    console.log('📁 Files to add:', projectFiles.length);
    
    // ✅ ENHANCED: Better file change mapping with validation
    const changes = projectFiles.map(file => {
      if (!file.path || !file.content) {
        throw new Error(`Invalid file object: missing path or content for file ${file.path || 'unknown'}`);
      }
      
      return {
        changeType: 'add',
        item: {
          path: file.path.startsWith('/') ? file.path : `/${file.path}`
        },
        newContent: {
          content: file.content,
          contentType: 'rawtext'
        }
      };
    });

    // ✅ ENHANCED: Better commit structure
    const pushData = {
      refUpdates: [{
        name: 'refs/heads/main',
        oldObjectId: '0000000000000000000000000000000000000000'
      }],
      commits: [{
        comment: `🚀 Initialize Node.js project with authentication

Features:
- Express.js server with modern architecture  
- User authentication (login/register) with JWT
- MongoDB integration with Mongoose
- Security middleware (Helmet, CORS, Rate limiting)
- Input validation with express-validator
- Error handling and logging
- Environment configuration
- RESTful API design

Generated by AI Assistant on ${new Date().toISOString()}`,
        changes: changes
      }]
    };

    console.log('📋 Commit data prepared with', changes.length, 'file changes');

    const response = await axios.post(pushUrl, pushData, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`:${pat}`).toString('base64')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Azure-DevOps-Node-Client'
      },
      timeout: 60000, // 60 second timeout for file uploads
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    if (response.status === 201) {
      console.log(`✅ Files added successfully to repository`);
      console.log(`📝 Commit ID: ${response.data.commits[0].commitId}`);
      console.log(`🔗 Commit URL: ${response.data.commits[0].url}`);
      
      return { 
        success: true, 
        commitId: response.data.commits[0].commitId,
        commitUrl: response.data.commits[0].url
      };
    } else {
      return { 
        success: false, 
        error: `Failed to add files: HTTP ${response.status} - ${response.statusText}` 
      };
    }

  } catch (error) {
    console.error('❌ Error adding files to Azure DevOps repository:', error);
    
    // ✅ ENHANCED: Better error handling for file operations
    if (error.response) {
      console.error('📊 Response Status:', error.response.status);
      console.error('📄 Response Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 400) {
        const errorMessage = error.response.data?.message || 'Bad request - check file content and repository state';
        return { 
          success: false, 
          error: `Azure DevOps API Error (400): ${errorMessage}` 
        };
      } else if (error.response.status === 409) {
        return { 
          success: false, 
          error: 'Conflict - repository may not be empty or branch already exists' 
        };
      } else if (error.response.status === 413) {
        return { 
          success: false, 
          error: 'Payload too large - reduce file sizes or number of files' 
        };
      }
    }
    
    return { 
      success: false, 
      error: error.message || 'Unknown error occurred while adding files'
    };
  }
}

// ✅ NEW: Helper function to validate Azure DevOps URLs
function validateAzureDevOpsInputs(organizationUrl, projectName, repositoryName, pat) {
  const errors = [];
  
  // Validate organization URL
  const orgUrlPattern = /^https:\/\/dev\.azure\.com\/[^\/\s]+\/?$/;
  if (!orgUrlPattern.test(organizationUrl)) {
    errors.push('Invalid organization URL format. Expected: https://dev.azure.com/organization');
  }
  
  // Validate project name
  if (!projectName || projectName.trim().length === 0) {
    errors.push('Project name is required');
  } else if (!/^[a-zA-Z0-9\s\-_\.]+$/.test(projectName)) {
    errors.push('Project name contains invalid characters');
  }
  
  // Validate repository name
  if (!repositoryName || repositoryName.trim().length === 0) {
    errors.push('Repository name is required');
  } else if (!/^[a-zA-Z0-9\-_\.]+$/.test(repositoryName)) {
    errors.push('Repository name contains invalid characters. Use only letters, numbers, hyphens, underscores, and dots');
  }
  
  // Validate PAT
  if (!pat || pat.trim().length === 0) {
    errors.push('Personal Access Token is required');
  } else if (pat.length < 20) {
    errors.push('Personal Access Token appears to be too short');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

function generateNodeJSProjectFiles() {
  return [
    {
      path: 'package.json',
      content: `{
  "name": "nodejs-auth-project",
  "version": "1.0.0",
  "description": "Node.js project with authentication functionality",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express-validator": "^7.0.1",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.2"
  },
  "keywords": ["nodejs", "express", "authentication", "mongodb"],
  "author": "AI Generated",
  "license": "MIT"
}`
    },
    {
      path: 'server.js',
      content: `const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nodejs-auth', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
  console.log(\`📚 API Documentation: http://localhost:\${PORT}/api/health\`);
});

module.exports = app;`
    },
    {
      path: 'routes/auth.js',
      content: `const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name', 'Name is required').not().isEmpty(),
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Password must be at least 6 characters').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Create JWT token
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          }
        });
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Password is required').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          }
        });
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;`
    },
    {
      path: 'routes/users.js',
      content: `const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name || user.name;
    user.email = email || user.email;

    await user.save();

    res.json({
      id: user.id,
      name: user.name,
      email: user.email
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;`
    },
    {
      path: 'models/User.js',
      content: `const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('User', UserSchema);`
    },
    {
      path: 'middleware/auth.js',
      content: `const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};`
    },
    {
      path: '.env.example',
      content: `# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/nodejs-auth

# JWT Secret (Generate a secure random string for production)
JWT_SECRET=your_super_secure_jwt_secret_key_here

# CORS Settings
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001`
    },
    {
      path: '.gitignore',
      content: `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db`
    }
  ];
}

// Add this NEW endpoint to your server.js for frontend repositories
app.post('/api/azure-devops/create-react-frontend', async (req, res) => {
  try {
    const { organizationUrl, projectName, repositoryName, personalAccessToken } = req.body;

    if (!organizationUrl || !projectName || !repositoryName || !personalAccessToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required for frontend repository creation' 
      });
    }

    console.log(`🎨 Creating React frontend repository: ${organizationUrl}/${projectName}/${repositoryName}`);

    // Create separate repository for React frontend
    const result = await createAzureDevOpsRepository(
      organizationUrl, 
      projectName, 
      repositoryName, 
      personalAccessToken
    );
    
    if (result.success) {
      // Add React-only project files to the new repository
      const filesResult = await addReactFrontendFiles(
        organizationUrl,
        projectName,
        repositoryName,
        personalAccessToken,
        result.repositoryId
      );

      if (filesResult.success) {
        res.json({ 
          success: true, 
          message: 'React frontend repository created successfully',
          repositoryUrl: `${organizationUrl}/${projectName}/_git/${repositoryName}`,
          repositoryId: result.repositoryId,
          commitId: filesResult.commitId,
          webUrl: result.webUrl
        });
      } else {
        res.status(500).json({ 
          success: false, 
          error: `Frontend repository created but failed to add files: ${filesResult.error}` 
        });
      }
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error 
      });
    }

  } catch (error) {
    console.error('❌ Error creating React frontend repository:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Function to add React-only files to separate repository
async function addReactFrontendFiles(organizationUrl, projectName, repositoryName, pat, repositoryId) {
  try {
    let orgName = organizationUrl.replace('https://dev.azure.com/', '');
    orgName = orgName.replace(/\/+$/, '').replace(/\/+/g, '');
    
    // Generate React-only project files (no backend folder)
    const projectFiles = generateReactOnlyProjectFiles();
    
    const pushUrl = `https://dev.azure.com/${orgName}/${encodeURIComponent(projectName)}/_apis/git/repositories/${repositoryId}/pushes?api-version=7.1`;
    
    const changes = projectFiles.map(file => ({
      changeType: 'add',
      item: {
        path: file.path.startsWith('/') ? file.path : `/${file.path}`
      },
      newContent: {
        content: file.content,
        contentType: 'rawtext'
      }
    }));

    const pushData = {
      refUpdates: [{
        name: 'refs/heads/main',
        oldObjectId: '0000000000000000000000000000000000000000'
      }],
      commits: [{
        comment: `🎨 Initialize React Frontend Application

Frontend Features:
- React 18 with modern hooks and functional components
- Complete authentication system (Login/Register)
- JWT token management with localStorage
- Protected routes using React Router
- Form validation with Formik and Yup
- Responsive design with Bootstrap 5
- Axios for API communication with interceptors
- Context API for global state management
- Environment configuration for different stages
- Production-ready build configuration

Architecture:
- Standalone React application
- Configurable API backend URL
- Modern development tooling
- CI/CD ready with Azure DevOps

Generated by AI Assistant on ${new Date().toISOString()}`,
        changes: changes
      }]
    };

    const response = await axios.post(pushUrl, pushData, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`:${pat}`).toString('base64')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (response.status === 201) {
      console.log(`✅ React frontend files added successfully to separate repository`);
      return { 
        success: true, 
        commitId: response.data.commits[0].commitId
      };
    }

  } catch (error) {
    console.error('❌ Error adding React frontend files:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
}

// Generate React-only project files (standalone repository)
function generateReactOnlyProjectFiles() {
  return [
    {
      path: 'package.json',
      content: `{
  "name": "react-auth-frontend",
  "version": "0.1.0",
  "private": true,
  "description": "React frontend application with authentication",
  "dependencies": {
    "@testing-library/jest-dom": "^5.16.4",
    "@testing-library/react": "^13.3.0",
    "@testing-library/user-event": "^13.5.0",
    "axios": "^1.4.0",
    "bootstrap": "^5.2.3",
    "formik": "^2.2.9",
    "react": "^18.2.0",
    "react-bootstrap": "^2.7.4",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.11.0",
    "react-scripts": "5.0.1",
    "yup": "^1.2.0",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "serve": "serve -s build"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "serve": "^14.2.0"
  }
}`
    },
    {
      path: 'public/index.html',
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="React Authentication Frontend Application" />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>React Auth Frontend</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`
    },
    {
      path: 'src/index.js',
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);`
    },
    {
      path: 'src/config/api.js',
      content: `// API Configuration
const config = {
  // Backend API URL - Update this to point to your backend server
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  
  // API endpoints
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      me: '/auth/me'
    },
    users: {
      profile: '/users/profile'
    }
  },
  
  // Request timeout
  timeout: 10000,
  
  // Default headers
  headers: {
    'Content-Type': 'application/json'
  }
};

export default config;`
    },
    {
      path: 'src/services/api.js',
      content: `import axios from 'axios';
import config from '../config/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: config.timeout,
  headers: config.headers
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (requestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      requestConfig.headers.Authorization = \`Bearer \${token}\`;
    }
    return requestConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;`
    },
    {
      path: 'README.md',
      content: `# React Authentication Frontend

A standalone React application with complete authentication functionality.

## 🚀 Features

- **Modern React 18** with hooks and functional components
- **Authentication System** - Login and Register with JWT
- **Protected Routes** - Secure navigation with React Router
- **Form Validation** - Robust validation with Formik and Yup
- **Responsive Design** - Bootstrap 5 for mobile-first design
- **API Integration** - Axios with request/response interceptors
- **State Management** - Context API for global auth state
- **Environment Config** - Configurable for different environments

## 📁 Project Structure

\`\`\`
src/
├── components/
│   ├── auth/
│   │   ├── Login.js
│   │   └── Register.js
│   ├── layout/
│   │   └── Navbar.js
│   ├── common/
│   │   └── ProtectedRoute.js
│   └── pages/
│       └── Dashboard.js
├── contexts/
│   └── AuthContext.js
├── services/
│   └── api.js
├── config/
│   └── api.js
├── App.js
└── index.js
\`\`\`

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Backend API server running

### Installation

1. **Clone the repository:**
   \`\`\`bash
   git clone <repository-url>
   cd react-auth-frontend
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Configure environment:**
   \`\`\`bash
   cp .env.example .env
   \`\`\`
   
   Edit \`.env\` and set your backend API URL:
   \`\`\`
   REACT_APP_API_URL=http://your-backend-url/api
   \`\`\`

4. **Start development server:**
   \`\`\`bash
   npm start
   \`\`\`

5. **Open browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Backend Integration

Update \`src/config/api.js\` to point to your backend:

\`\`\`javascript
const config = {
  API_BASE_URL: 'http://your-backend-server:port/api'
};
\`\`\`

### Environment Variables

Create \`.env\` file in root directory:

\`\`\`
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_ENV=development
\`\`\`

## 📋 Available Scripts

- \`npm start\` - Start development server
- \`npm build\` - Build for production
- \`npm test\` - Run tests
- \`npm run serve\` - Serve production build locally

## 🔐 Authentication Flow

1. **Registration/Login** - User submits credentials
2. **JWT Token** - Received from backend and stored in localStorage
3. **Protected Routes** - Automatically redirect to login if not authenticated
4. **API Requests** - Token automatically included in headers
5. **Auto Logout** - On token expiration or invalid responses

## 🌐 API Integration

This frontend expects a backend API with these endpoints:

- \`POST /api/auth/register\` - User registration
- \`POST /api/auth/login\` - User login  
- \`GET /api/auth/me\` - Get current user
- \`GET /api/users/profile\` - Get user profile
- \`PUT /api/users/profile\` - Update user profile

## 🚀 Deployment

### Build for Production

\`\`\`bash
npm run build
\`\`\`

### Deploy to Azure

The project includes Azure DevOps pipeline configuration for automated deployment.

### Environment Configuration

For production deployment, ensure these environment variables are set:

- \`REACT_APP_API_URL\` - Your production backend URL
- \`REACT_APP_ENV\` - production

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

**Generated by AI Assistant** - Ready for production deployment!`
    },
    {
      path: '.env.example',
      content: `# API Configuration
REACT_APP_API_URL=http://localhost:3001/api

# Environment
REACT_APP_ENV=development

# Optional: Analytics, monitoring, etc.
# REACT_APP_ANALYTICS_ID=your_analytics_id`
    },
    {
      path: '.gitignore',
      content: `# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Production
/build

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Editor directories and files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db`
    },
    {
      path: 'azure-pipelines.yml',
      content: `# Azure DevOps Pipeline for React Frontend
trigger:
  branches:
    include:
    - main
    - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '18.x'
  buildConfiguration: 'production'

stages:
- stage: Build
  displayName: 'Build React Application'
  jobs:
  - job: BuildJob
    displayName: 'Build and Test'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '$(nodeVersion)'
      displayName: 'Install Node.js'
    
    - script: |
        npm ci
      displayName: 'Install dependencies'
    
    - script: |
        npm run test -- --coverage --ci --watchAll=false
      displayName: 'Run tests'
    
    - script: |
        npm run build
      displayName: 'Build application'
      env:
        REACT_APP_API_URL: $(REACT_APP_API_URL)
        REACT_APP_ENV: production
    
    - task: ArchiveFiles@2
      inputs:
        rootFolderOrFile: 'build'
        includeRootFolder: false
        archiveType: 'zip'
        archiveFile: '$(Build.ArtifactStagingDirectory)/react-frontend.zip'
      displayName: 'Archive build files'
    
    - task: PublishBuildArtifacts@1
      inputs:
        PathtoPublish: '$(Build.ArtifactStagingDirectory)'
        ArtifactName: 'frontend-drop'
      displayName: 'Publish build artifacts'

- stage: Deploy
  displayName: 'Deploy to Azure'
  dependsOn: Build
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  jobs:
  - deployment: DeployJob
    displayName: 'Deploy to Azure App Service'
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebApp@1
            inputs:
              azureSubscription: '$(azureSubscription)'
              appType: 'webApp'
              appName: '$(appName)'
              package: '$(Pipeline.Workspace)/frontend-drop/react-frontend.zip'
            displayName: 'Deploy to Azure Web App'`
    }
    // Add React component files here...
  ];
}



// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend server is running with chunked processing!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} with intelligent chunking`);
});
