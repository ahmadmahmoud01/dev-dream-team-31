// services/prdService.ts
import axios from 'axios';

interface PRDGenerationResult {
  success: boolean;
  error?: string;
  fileCount?: number;
}

class PRDService {
  private baseURL = 'http://localhost:8000/api';

// Updated method for multiple files PRD generation
async generatePRDFromMultipleFiles(
  files: File[]
): Promise<PRDGenerationResult> {
  try {
    // Validate all files before upload
    const validation = this.validateMultipleFiles(files);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    const formData = new FormData();
    
    // Append all files to FormData - backend will merge them
    files.forEach((file, index) => {
      formData.append('requirements', file);
    });

    // Use the multiple files endpoint which now merges files internally
    const response = await axios.post(`${this.baseURL}/generate-prd-multiple`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'blob',
      //timeout: 120000000 // 2 minutes timeout for multiple files
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PRD_MergedFiles_${new Date().toISOString().split('T')[0]}.docx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { 
      success: true,
      fileCount: files.length
    };
  } catch (error: any) {
    console.error('Error generating PRD from multiple files:', error);
    
    let errorMessage = 'Unknown error occurred';
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Backend server is not running. Please start the Node.js server on port 8000.';
    } else if (error.response?.status === 413) {
      errorMessage = 'Files too large after merging. Please reduce file sizes or upload fewer files.';
    } else if (error.response?.status === 400) {
      errorMessage = error.response.data?.error || 'Invalid file format or content in one or more files.';
    } else if (error.response?.status === 500) {
      errorMessage = 'Server error during PRD generation. The merged file may be too large for processing.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Request timeout. File merging and processing takes time. Try uploading fewer or smaller files.';
    } else {
      errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
    }

    return {
      success: false,
      error: errorMessage,
      fileCount: files.length
    };
  }
}


// File validation for multiple files upload
private validateMultipleFiles(files: File[]): { valid: boolean; error?: string } {
  const maxFileSize = 10 * 1024 * 1024; // 10MB per file
  const maxTotalSize = 50 * 1024 * 1024; // 50MB total
  const maxFiles = 5;
  const allowedTypes = [
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf'
  ];

  if (!files || files.length === 0) {
    return { valid: false, error: 'No files provided' };
  }

  if (files.length > maxFiles) {
    return { 
      valid: false, 
      error: `Too many files. Maximum ${maxFiles} files allowed, but ${files.length} provided` 
    };
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > maxTotalSize) {
    return { 
      valid: false, 
      error: `Combined file size (${(totalSize / 1024 / 1024).toFixed(2)}MB) exceeds the 50MB limit` 
    };
  }

  const invalidFiles = files.filter(file => 
    file.size > maxFileSize || !allowedTypes.includes(file.type)
  );

  if (invalidFiles.length > 0) {
    const invalidFileNames = invalidFiles.map(f => f.name).join(', ');
    return { 
      valid: false, 
      error: `Invalid files: ${invalidFileNames}. Each file must be under 10MB and be .txt, .doc, .docx, or .pdf format` 
    };
  }

  return { valid: true };
}

// Get maximum number of files allowed
getMaxFileCount(): number {
  return 5;
}

// Get maximum total size for multiple files in MB
getMaxTotalSize(): number {
  return 50; // MB
}


  // Main method for single file PRD generation
  async generatePRDFromRequirements(
    file: File
  ): Promise<PRDGenerationResult> {
    try {
      // Validate file before upload
      const validation = this.validateSingleFile(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      const formData = new FormData();
      formData.append('requirements', file);

      const response = await axios.post(`${this.baseURL}/generate-prd`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob',
        timeout: 60000 // 60 seconds timeout for single file
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `PRD_${file.name.replace(/\.[^/.]+$/, "")}_${new Date().toISOString().split('T')[0]}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { 
        success: true,
        fileCount: 1
      };
    } catch (error: any) {
      console.error('Error generating PRD:', error);
      
      // Enhanced error handling
      let errorMessage = 'Unknown error occurred';
      
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Backend server is not running. Please start the Node.js server on port 8000.';
      } else if (error.response?.status === 413) {
        errorMessage = 'File too large. Please upload a file smaller than 10MB.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.error || 'Invalid file format or content.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error during PRD generation. Please check your template and try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout. The file might be too large or complex to process.';
      } else {
        errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
      }

      return {
        success: false,
        error: errorMessage,
        fileCount: 1
      };
    }
  }

  // Alias method for backward compatibility
  async generatePRDFromSingleFile(file: File): Promise<PRDGenerationResult> {
    return this.generatePRDFromRequirements(file);
  }

  // File validation for single file upload
  private validateSingleFile(file: File): { valid: boolean; error?: string } {
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/pdf'
    ];

    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (file.size > maxFileSize) {
      return { 
        valid: false, 
        error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds the 10MB limit` 
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: `Unsupported file type: ${file.type}. Please upload .txt, .doc, .docx, or .pdf files` 
      };
    }

    return { valid: true };
  }

  // Test backend connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000 // 5 second timeout for health check
      });
      return response.status === 200;
    } catch (error) {
      console.warn('Backend connection test failed:', error);
      return false;
    }
  }

  // Get backend server status with detailed information
  async getServerStatus(): Promise<{ 
    connected: boolean; 
    message: string; 
    timestamp: string 
  }> {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000
      });
      
      return {
        connected: true,
        message: response.data?.status || 'Backend server is running',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      let message = 'Backend server is not accessible';
      
      if (error.code === 'ECONNREFUSED') {
        message = 'Backend server is not running on port 8000';
      } else if (error.code === 'ENOTFOUND') {
        message = 'Cannot resolve backend server address';
      } else if (error.message.includes('timeout')) {
        message = 'Backend server is not responding (timeout)';
      }

      return {
        connected: false,
        message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Utility method to check if file is valid for PRD generation
  isValidPRDFile(file: File): boolean {
    const validation = this.validateSingleFile(file);
    return validation.valid;
  }

  // Get supported file types
  getSupportedFileTypes(): string[] {
    return ['.txt', '.doc', '.docx', '.pdf'];
  }

  // Get maximum file size in MB
  getMaxFileSize(): number {
    return 10; // MB
  }
}

export const prdService = new PRDService();
