// services/testCasesService.ts
import Groq from 'groq-sdk';

interface TestCasesData {
  srsFile: File;
  organization: string;
  project: string;
  assignToTester: string; // Removed personalAccessToken from interface
}

interface TestCaseCreationResult {
  success: boolean;
  message: string;
  createdTestCases?: number;
  failedTestCases?: number;
  details?: string;
  testCases?: ExtractedTestCase[];
}

interface ExtractedTestCase {
  title: string;
  description: string;
  preconditions: string;
  test_steps: string;
  expected_result: string;
  test_type: string;
  priority: number;
}

class TestCasesService {
  private groqClient: Groq;
  private readonly personalAccessToken = '5DKJLrt5PsAMGuueQ3EDunwNv4pArdWM7d8qSKeqVRtYTNKSklK4JQQJ99BFACAAAAAlj3PAAAASAZDO2aHM';

  constructor() {
    // Initialize Groq client with your API key
    this.groqClient = new Groq({
      apiKey: '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',
      dangerouslyAllowBrowser: true
    });
  }

  async createTestCasesFromSRS(data: TestCasesData): Promise<TestCaseCreationResult> {
    try {
      // Read the SRS file content
      const srsContent = await this.readFileContent(data.srsFile);
      
      if (!srsContent.trim()) {
        return {
          success: false,
          message: "❌ The uploaded SRS file is empty."
        };
      }

      // Step 1: Extract test cases from SRS using Groq API
      const extractedTestCases = await this.extractTestCasesFromSRS(srsContent);
      
      if (!extractedTestCases || extractedTestCases.length === 0) {
        return {
          success: false,
          message: "❌ No test cases could be extracted from the SRS document."
        };
      }

      // Step 2: Create test cases in Azure DevOps
      const creationResult = await this.createTestCasesInAzureDevOps(extractedTestCases, data);
      
      return {
        success: creationResult.success,
        message: creationResult.message,
        createdTestCases: creationResult.createdTestCases,
        failedTestCases: creationResult.failedTestCases,
        details: creationResult.details,
        testCases: extractedTestCases
      };
      
    } catch (error) {
      return {
        success: false,
        message: `❌ Error creating test cases: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async extractTestCasesFromSRS(srsContent: string): Promise<ExtractedTestCase[]> {
    try {
      const messages = [
        {
          role: "system" as const,
          content: (
            "You are an expert QA engineer. Generate comprehensive test cases and return ONLY valid JSON without any additional text. " +
            "Based on the following SRS document, generate comprehensive test cases. " +
            "Each test case should:\n" +
            "- Have a clear, descriptive title\n" +
            "- Include detailed test steps (numbered list)\n" +
            "- Specify expected results\n" +
            "- Include preconditions if applicable\n" +
            "- Have test type: 'Functional', 'Integration', 'Performance', 'Security', 'UI', or 'API'\n" +
            "- Have priority: 1 (Critical), 2 (High), 3 (Medium), 4 (Low)\n" +
            "Return ONLY a valid JSON array in this format:\n" +
            "[\n" +
            "  {\n" +
            "    \"title\": \"User Login with Valid Credentials\",\n" +
            "    \"description\": \"Test user authentication with valid username and password\",\n" +
            "    \"preconditions\": \"User account exists in the system\",\n" +
            "    \"test_steps\": \"1. Navigate to login page\\n2. Enter valid username\\n3. Enter valid password\\n4. Click login button\",\n" +
            "    \"expected_result\": \"User should be successfully logged in and redirected to dashboard\",\n" +
            "    \"test_type\": \"Functional\",\n" +
            "    \"priority\": 1\n" +
            "  }\n" +
            "]\n\n"
          )
        },
        {
          role: "user" as const,
          content: `Extract test cases from this SRS:\n\n${srsContent}`
        }
      ];

      const completion = await this.groqClient.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.3,
        max_tokens: 10000,
        top_p: 0.9,
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error("Empty response from Groq API");
      }

      // Parse JSON response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No valid JSON array found in response");
      }

      const testCases = JSON.parse(jsonMatch[0]) as ExtractedTestCase[];
      
      // Validate and clean test cases
      return testCases.filter(tc => 
        tc.title && 
        tc.description && 
        tc.test_steps &&
        tc.expected_result &&
        typeof tc.priority === 'number'
      );

    } catch (error) {
      console.error('Error extracting test cases from SRS:', error);
      throw new Error(`Failed to extract test cases: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createTestCasesInAzureDevOps(
    testCases: ExtractedTestCase[], 
    azureConfig: TestCasesData
  ): Promise<TestCaseCreationResult> {
    try {
      const { organization, project, assignToTester } = azureConfig;
      
      // Validate Azure DevOps configuration
      if (!organization || !project || !assignToTester) {
        throw new Error("Missing Azure DevOps configuration");
      }

      const baseUrl = `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems`;
      const headers = {
        'Content-Type': 'application/json-patch+json',
        'Authorization': `Basic ${btoa(`:${this.personalAccessToken}`)}`
      };

      let createdTestCases = 0;
      let failedTestCases = 0;
      const creationDetails: string[] = [];

      // Create each test case in Azure DevOps
      for (const testCase of testCases) {
        try {
          // Combine description with test details
          const fullDescription = `${testCase.description}\n\n` +
            (testCase.preconditions ? `**Preconditions:**\n${testCase.preconditions}\n\n` : '') +
            `**Test Steps:**\n${testCase.test_steps}\n\n` +
            `**Expected Result:**\n${testCase.expected_result}`;

          const workItemData = [
            {
              op: "add",
              path: "/fields/System.Title",
              value: testCase.title
            },
            {
              op: "add",
              path: "/fields/System.Description",
              value: fullDescription
            },
            {
              op: "add",
              path: "/fields/System.AssignedTo",
              value: assignToTester
            },
            {
              op: "add",
              path: "/fields/Microsoft.VSTS.Common.Priority",
              value: testCase.priority
            }
            // {
            //   op: "add",
            //   path: "/fields/System.Tags",
            //   value: `Test Case; ${testCase.test_type}`
            // }
          ];

          const response = await fetch(`${baseUrl}/$Test Case?api-version=7.0`, {
            method: 'POST',
            headers,
            body: JSON.stringify(workItemData)
          });

          if (response.ok) {
            const createdWorkItem = await response.json();
            createdTestCases++;
            creationDetails.push(`✅ Created: "${testCase.title}" (ID: ${createdWorkItem.id})`);
          } else {
            const errorText = await response.text();
            failedTestCases++;
            creationDetails.push(`❌ Failed: "${testCase.title}" - ${errorText}`);
          }
        } catch (testCaseError) {
          failedTestCases++;
          creationDetails.push(`❌ Failed: "${testCase.title}" - ${testCaseError instanceof Error ? testCaseError.message : 'Unknown error'}`);
        }

        // Add a small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const success = createdTestCases > 0;
      const message = success 
        ? `✅ Successfully created ${createdTestCases} test cases in Azure DevOps${failedTestCases > 0 ? ` (${failedTestCases} failed)` : ''}`
        : `❌ Failed to create any test cases in Azure DevOps`;

      return {
        success,
        message,
        createdTestCases,
        failedTestCases,
        details: creationDetails.join('\n')
      };

    } catch (error) {
      return {
        success: false,
        message: `❌ Error creating test cases in Azure DevOps: ${error instanceof Error ? error.message : 'Unknown error'}`,
        createdTestCases: 0,
        failedTestCases: testCases.length
      };
    }
  }

  private readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }
}

export const testCasesService = new TestCasesService();
