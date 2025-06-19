// services/srsService.ts
import Groq from 'groq-sdk';

interface SRSGenerationData {
  projectDescription?: string;
  file?: File;
}

interface SRSResult {
  success: boolean;
  message: string;
  content?: string;
}

class SRSService {
  private groqClient: Groq;

  constructor() {
    // Initialize Groq client with hardcoded API key
    this.groqClient = new Groq({
      apiKey: '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',
      dangerouslyAllowBrowser: true // Required for client-side usage
    });
  }

  async generateSRSFromDescription(
    projectDescription: string,
    model: string = "llama-3.3-70b-versatile"
  ): Promise<SRSResult> {
    try {
      if (!projectDescription || !projectDescription.trim()) {
        return {
          success: false,
          message: "❌ Error: Project description cannot be empty."
        };
      }

      const messages = [
        {
          role: "system" as const,
          content: (
            "You are an expert software architect. Generate a comprehensive Software Requirements Specification (SRS) " +
            "that includes:\n" +
            "1. Project Overview\n" +
            "2. Functional Requirements\n" +
            "3. Non-Functional Requirements\n" +
            "4. System Architecture Overview\n" +
            "5. User Interface Requirements\n" +
            "6. Data Requirements\n" +
            "7. Security Requirements\n" +
            "8. Performance Requirements\n" +
            "9. Assumptions and Dependencies\n" +
            "10. Glossary\n\n" +
            "Make it professional, detailed, and implementable."
          )
        },
        {
          role: "user" as const,
          content: `Generate a complete SRS for this project:\n\n${projectDescription}`
        }
      ];

      const completion = await this.groqClient.chat.completions.create({
        model,
        messages,
        temperature: 0.6,
        max_tokens: 10000,
        top_p: 0.95,
        stream: false,
      });

      const srsContent = completion.choices[0]?.message?.content;

      if (srsContent && srsContent.trim()) {
        return {
          success: true,
          message: "✅ SRS generated successfully!",
          content: srsContent
        };
      } else {
        return {
          success: false,
          message: "❌ Error: Empty SRS generated. Please try again."
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Error generating SRS: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async generateSRSFromFile(file: File, model: string = "llama-3.3-70b-versatile"): Promise<SRSResult> {
    try {
      const fileExtension = file.name.toLowerCase().split('.').pop();
      let projectDescription = '';

      if (fileExtension === 'txt') {
        projectDescription = await this.readTextFile(file);
      } else if (fileExtension === 'docx') {
        // For DOCX files, you might need a more complex solution
        // For now, we'll treat it as text
        projectDescription = await this.readTextFile(file);
      } else {
        return {
          success: false,
          message: "❌ Error: Unsupported file type. Please upload a .txt or .docx file."
        };
      }

      if (!projectDescription.trim()) {
        return {
          success: false,
          message: "❌ Error: Uploaded file is empty."
        };
      }

      return await this.generateSRSFromDescription(projectDescription, model);
    } catch (error) {
      return {
        success: false,
        message: `❌ Error generating SRS from file: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  async createWordDocument(srsContent: string): Promise<Blob | null> {
    try {
      // This is a simplified version. For full Word document creation,
      // you might need to use a library like docx or implement server-side generation
      const blob = new Blob([srsContent], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      return blob;
    } catch (error) {
      console.error('Error creating Word document:', error);
      return null;
    }
  }
}

export const srsService = new SRSService();
