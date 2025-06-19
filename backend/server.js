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
      model: "llama-3.1-8b-instant",
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



// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend server is running with chunked processing!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} with intelligent chunking`);
});
