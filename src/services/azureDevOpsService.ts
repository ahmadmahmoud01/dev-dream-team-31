import Groq from "groq-sdk";
import axios from 'axios'; // ✅ ADD: Missing axios import

// services/azureDevOpsService.ts
interface AzureDevOpsCredentials {
  personalAccessToken: string;
  organizationUrl: string;
  projectName: string;
}

interface WorkItemData {
  title: string;
  description?: string;
  assignedTo?: string;
  workItemType?: string;
  tags?: string[];
}

interface TestConnectionResult {
  success: boolean;
  error?: string;
  projectInfo?: {
    id: string;
    name: string;
    description: string;
  };
}

class AzureDevOpsService {
  private getAuthHeaders(pat: string) {
    const auth = btoa(`:${pat}`);
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json-patch+json',
      'Accept': 'application/json'
    };
  }

  private getApiUrl(orgUrl: string, project: string, endpoint: string) {
    const baseUrl = orgUrl.endsWith('/') ? orgUrl.slice(0, -1) : orgUrl;
    return `${baseUrl}/${project}/_apis/${endpoint}`;
  }

  async testConnection(credentials: AzureDevOpsCredentials): Promise<TestConnectionResult> {
    try {
      const { personalAccessToken, organizationUrl, projectName } = credentials;
      const headers = this.getAuthHeaders(personalAccessToken);
      
      // Test by getting project information
      const url = this.getApiUrl(organizationUrl, projectName, 'wit/workitemtypes?api-version=7.1');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        projectInfo: {
          id: projectName,
          name: projectName,
          description: `Connected successfully. Found ${data.count || 0} work item types.`
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async createWorkItem(
    credentials: AzureDevOpsCredentials,
    workItem: {
      title: string;
      description: string;
      assignedTo: string;
      workItemType: string;
      tags: string[];
      estimatedHours?: number;
      complexity?: string;
      activity?: string;
    }
  ): Promise<{ success: boolean; workItemId?: number; error?: string }> {
    try {
      const orgName = credentials.organizationUrl.replace('https://dev.azure.com/', '').replace('/', '');
      const createUrl = `https://dev.azure.com/${orgName}/${credentials.projectName}/_apis/wit/workitems/$${workItem.workItemType}?api-version=7.1`;

      // ✅ ENHANCED: Include estimation fields in work item creation
      const workItemFields = [
        {
          op: 'add',
          path: '/fields/System.Title',
          value: workItem.title
        },
        {
          op: 'add',
          path: '/fields/System.Description',
          value: workItem.description
        },
        {
          op: 'add',
          path: '/fields/System.AssignedTo',
          value: workItem.assignedTo
        },
        // {
        //   op: 'add',
        //   path: '/fields/System.Tags',
        //   value: workItem.tags.join('; ')
        // }
      ];

      // ✅ NEW: Add estimation fields if provided
      if (workItem.estimatedHours) {
        workItemFields.push(
          {
            op: 'add',
            path: '/fields/Microsoft.VSTS.Scheduling.OriginalEstimate',
            value: `${workItem.estimatedHours}`
          },
          {
            op: 'add',
            path: '/fields/Microsoft.VSTS.Scheduling.RemainingWork',
            value: `${workItem.estimatedHours}`
          }
        );
      }

      // ✅ NEW: Add activity type if provided
      if (workItem.activity) {
        workItemFields.push({
          op: 'add',
          path: '/fields/Microsoft.VSTS.Common.Activity',
          value: workItem.activity
        });
      }

      // ✅ NEW: Add complexity as custom field or tag
      // if (workItem.complexity) {
      //   workItemFields.push({
      //     op: 'add',
      //     path: '/fields/System.Tags',
      //     value: `${workItem.tags.join('; ')}; Complexity-${workItem.complexity}`
      //   });
      // }

      const response = await axios.post(createUrl, workItemFields, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`:${credentials.personalAccessToken}`).toString('base64')}`,
          'Content-Type': 'application/json-patch+json'
        }
      });

      return {
        success: true,
        workItemId: response.data.id
      };
    } catch (error: any) { // ✅ FIX: Proper error typing
      console.error('Error creating work item:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // ✅ ENHANCED: AI-powered task creation with estimation
  async createTasksFromPRD(
    credentials: AzureDevOpsCredentials,
    prdFileName: string,
    teamMembers: Array<{ email: string; role: string }>
  ): Promise<{ success: boolean; createdTasks?: Array<{ email: string; workItemId: number; role: string; estimatedHours: number }>; error?: string }> {
    try {
      console.log('=== AI-POWERED TASK EXTRACTION FROM PRD ===');
      
      // Step 1: Extract tasks from PRD using Groq AI
      const extractedTasks = await this.extractTasksFromPRDWithAI(prdFileName, teamMembers);
      
      if (!extractedTasks || extractedTasks.length === 0) {
        throw new Error('No tasks could be extracted from the PRD file');
      }

      console.log(`Extracted ${extractedTasks.length} tasks from PRD`);

      // Step 2: Create work items for each extracted task with estimation
      const createdTasks = [];
      
      for (const task of extractedTasks) {
        const result = await this.createWorkItem(credentials, {
          title: task.title,
          description: task.description,
          assignedTo: task.assignedTo,
          workItemType: 'Task',
          tags: [task.role, 'prd-extracted', 'ai-generated'],
          estimatedHours: task.estimatedHours,
          complexity: task.complexity,
          activity: task.activity
        });

        if (result.success && result.workItemId) {
          createdTasks.push({
            email: task.assignedTo,
            workItemId: result.workItemId,
            role: task.role,
            estimatedHours: task.estimatedHours
          });
          
          console.log(`✅ Created work item ${result.workItemId} for ${task.assignedTo} (${task.role}): ${task.title} - ${task.estimatedHours}h`);
        } else {
          console.warn(`❌ Failed to create task for ${task.assignedTo}:`, result.error);
        }
      }

      return {
        success: createdTasks.length > 0,
        createdTasks: createdTasks
      };
    } catch (error) {
      console.error('Error in AI-powered createTasksFromPRD:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during AI task extraction'
      };
    }
  }

  // ✅ NEW: AI-powered task extraction with estimation
  async extractTasksFromPRDWithAI(
    prdFileName: string,
    teamMembers: Array<{ email: string; role: string }>
  ): Promise<Array<{ 
    title: string; 
    description: string; 
    assignedTo: string; 
    role: string; 
    estimatedHours: number; 
    complexity: string;
    activity: string;
  }>> {
    try {
      // Group team members by role
      const roleGroups = teamMembers.reduce((groups, member) => {
        if (!groups[member.role]) {
          groups[member.role] = [];
        }
        groups[member.role].push(member);
        return groups;
      }, {} as Record<string, Array<{ email: string; role: string }>>);

      const allTasks = [];

      // Generate tasks for each role
      for (const [role, members] of Object.entries(roleGroups)) {
        const roleTasks = await this.generateTasksForRole(role, members, prdFileName);
        allTasks.push(...roleTasks);
      }

      return allTasks;
    } catch (error) {
      console.error('Error in AI task extraction:', error);
      return [];
    }
  }

  // ✅ ENHANCED: Generate role-specific tasks with estimation using Groq AI
  async generateTasksForRole(
    role: string,
    members: Array<{ email: string; role: string }>,
    prdFileName: string
  ): Promise<Array<{ 
    title: string; 
    description: string; 
    assignedTo: string; 
    role: string; 
    estimatedHours: number; 
    complexity: string;
    activity: string;
  }>> {
    try {
      const groq = new Groq({
        apiKey: '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'
      });

      const systemPrompt = `You are an expert project manager analyzing a PRD document. Generate specific, actionable tasks for ${role} developers with accurate time estimation.

Requirements:
- Generate exactly 5 detailed tasks for ${role} role
- Each task should include realistic time estimation in hours
- Classify complexity as: simple, medium, complex
- Tasks should be specific and actionable
- Include technical details relevant to ${role} work
- Provide accurate hour estimates based on industry standards

Return format:
{
  "tasks": [
    {
      "title": "Specific task title",
      "description": "Detailed description with technical requirements and acceptance criteria",
      "complexity": "simple|medium|complex",
      "estimatedHours": 8
    }
  ]
}`;

      const userPrompt = `Based on the PRD file "${prdFileName}", generate 5 specific ${role} development tasks with time estimation.

For ${role} developers, focus on:
${this.getRoleSpecificGuidance(role)}

Time estimation guidelines:
- Simple tasks: 2-8 hours
- Medium tasks: 8-16 hours  
- Complex tasks: 16-40 hours

Generate tasks that are:
- Specific to ${role} development work
- Technically detailed and actionable
- Include realistic hour estimates
- Based on typical PRD requirements
- Include acceptance criteria
- Realistic in scope for sprint planning

Return only the JSON with 5 tasks including estimatedHours and complexity.`;

      const completion = await groq.chat.completions.create({
        //model: "llama-3.1-8b-instant",
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const content = completion.choices[0]?.message?.content;
      
      try {
        const jsonMatch = content?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedTasks = JSON.parse(jsonMatch[0]);
          
          if (parsedTasks.tasks && Array.isArray(parsedTasks.tasks)) {
            return this.distributeTasksWithEstimation(parsedTasks.tasks, members, role);
          }
        }
      } catch (parseError) {
        console.error('Failed to parse AI response for role:', role);
      }

      // Fallback if AI parsing fails
      return this.generateFallbackTasksWithEstimation(role, members);
    } catch (error) {
      console.error(`Error generating tasks for ${role}:`, error);
      return this.generateFallbackTasksWithEstimation(role, members);
    }
  }

  // ✅ NEW: Distribute tasks with estimation among team members
  distributeTasksWithEstimation(
    tasks: Array<{ title: string; description: string; complexity: string; estimatedHours: number }>,
    members: Array<{ email: string; role: string }>,
    role: string
  ): Array<{ 
    title: string; 
    description: string; 
    assignedTo: string; 
    role: string; 
    estimatedHours: number; 
    complexity: string;
    activity: string;
  }> {
    const distributedTasks = [];
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const assignedMember = members[i % members.length];
      
      const validatedEstimation = this.validateEstimation(task.estimatedHours, task.complexity, role);
      
      distributedTasks.push({
        title: task.title,
        description: task.description,
        assignedTo: assignedMember.email,
        role: role,
        estimatedHours: validatedEstimation,
        complexity: task.complexity || 'medium',
        activity: this.getActivityType(role)
      });
    }
    
    return distributedTasks;
  }

  // ✅ NEW: Validate and adjust estimation based on complexity and role
  validateEstimation(estimatedHours: number, complexity: string, role: string): number {
    const estimationMatrix = {
      simple: { 
        frontend: { min: 2, max: 8, default: 4 },
        backend: { min: 3, max: 10, default: 6 },
        fullstack: { min: 4, max: 12, default: 8 },
        tester: { min: 1, max: 4, default: 2 },
        devops: { min: 2, max: 6, default: 4 }
      },
      medium: {
        frontend: { min: 6, max: 16, default: 10 },
        backend: { min: 8, max: 20, default: 14 },
        fullstack: { min: 10, max: 24, default: 16 },
        tester: { min: 3, max: 8, default: 5 },
        devops: { min: 4, max: 12, default: 8 }
      },
      complex: {
        frontend: { min: 12, max: 40, default: 24 },
        backend: { min: 16, max: 48, default: 32 },
        fullstack: { min: 20, max: 56, default: 40 },
        tester: { min: 6, max: 16, default: 10 },
        devops: { min: 8, max: 24, default: 16 }
      }
    };

    const roleMatrix = estimationMatrix[complexity as keyof typeof estimationMatrix]?.[role as keyof typeof estimationMatrix.simple];
    if (!roleMatrix) {
      return estimatedHours || 8;
    }

    if (estimatedHours < roleMatrix.min) {
      return roleMatrix.min;
    } else if (estimatedHours > roleMatrix.max) {
      return roleMatrix.max;
    }
    
    return estimatedHours || roleMatrix.default;
  }

  // ✅ NEW: Get activity type based on role
  getActivityType(role: string): string {
    const activityMap = {
      'frontend': 'Development',
      'backend': 'Development',
      'fullstack': 'Development',
      'devops': 'Deployment',
      'tester': 'Testing',
      'designer': 'Design',
      'analyst': 'Requirements'
    };

    return activityMap[role as keyof typeof activityMap] || 'Development';
  }

  // ✅ ENHANCED: Generate fallback tasks with estimation
  generateFallbackTasksWithEstimation(
    role: string,
    members: Array<{ email: string; role: string }>
  ): Array<{ 
    title: string; 
    description: string; 
    assignedTo: string; 
    role: string; 
    estimatedHours: number; 
    complexity: string;
    activity: string;
  }> {
    const fallbackTasks = this.getFallbackTasksByRole(role);
    
    return fallbackTasks.map((task, index) => ({
      title: task.title,
      description: task.description,
      assignedTo: members[index % members.length].email,
      role: role,
      estimatedHours: task.estimatedHours,
      complexity: task.complexity,
      activity: this.getActivityType(role)
    }));
  }

  // ✅ NEW: Fallback tasks with estimation by role
  getFallbackTasksByRole(role: string): Array<{ 
    title: string; 
    description: string; 
    estimatedHours: number; 
    complexity: string; 
  }> {
    const taskTemplates = {
      frontend: [
        {
          title: "Implement User Authentication UI",
          description: "Create login and registration forms with validation and responsive design",
          estimatedHours: 12,
          complexity: "medium"
        },
        {
          title: "Develop Dashboard Components",
          description: "Build main dashboard with charts, widgets, and user navigation",
          estimatedHours: 16,
          complexity: "medium"
        },
        {
          title: "Create Responsive Layout",
          description: "Implement mobile-first responsive design across all pages",
          estimatedHours: 8,
          complexity: "simple"
        },
        {
          title: "Integrate API Endpoints",
          description: "Connect frontend components with backend APIs and handle error states",
          estimatedHours: 10,
          complexity: "medium"
        },
        {
          title: "Implement State Management",
          description: "Set up Redux/Context API for global state management",
          estimatedHours: 14,
          complexity: "complex"
        }
      ],
      backend: [
        {
          title: "Design Database Schema",
          description: "Create database tables, relationships, and indexes for the application",
          estimatedHours: 8,
          complexity: "medium"
        },
        {
          title: "Implement Authentication API",
          description: "Build JWT-based authentication with login, register, and password reset",
          estimatedHours: 16,
          complexity: "medium"
        },
        {
          title: "Create CRUD Operations",
          description: "Develop RESTful APIs for all main entities with proper validation",
          estimatedHours: 20,
          complexity: "complex"
        },
        {
          title: "Set Up Security Middleware",
          description: "Implement rate limiting, CORS, helmet, and input sanitization",
          estimatedHours: 6,
          complexity: "simple"
        },
        {
          title: "Configure Deployment Pipeline",
          description: "Set up CI/CD pipeline with testing, building, and deployment stages",
          estimatedHours: 12,
          complexity: "medium"
        }
      ],
      tester: [
        {
          title: "Create Test Plan",
          description: "Develop comprehensive test plan covering functional and non-functional requirements",
          estimatedHours: 6,
          complexity: "simple"
        },
        {
          title: "Write Automated Tests",
          description: "Create unit and integration tests for critical application features",
          estimatedHours: 16,
          complexity: "complex"
        },
        {
          title: "Perform Manual Testing",
          description: "Execute manual test cases for UI/UX and edge case scenarios",
          estimatedHours: 12,
          complexity: "medium"
        },
        {
          title: "Set Up Test Environment",
          description: "Configure testing environment with test data and monitoring tools",
          estimatedHours: 4,
          complexity: "simple"
        },
        {
          title: "Create Test Reports",
          description: "Generate detailed test reports with metrics and recommendations",
          estimatedHours: 3,
          complexity: "simple"
        }
      ]
    };

    return taskTemplates[role as keyof typeof taskTemplates] || taskTemplates.backend;
  }

  // ✅ FIX: Get role-specific guidance for AI task generation
  private getRoleSpecificGuidance(role: string): string {
    const guidance = {
      frontend: `
- User interface components and layouts
- Responsive design implementation
- User experience optimization
- Client-side functionality
- API integration from frontend perspective`,
      backend: `
- Database schema design and implementation
- API endpoint development
- Business logic implementation
- Data validation and security
- Server-side architecture`,
      fullstack: `
- End-to-end feature implementation
- Frontend and backend integration
- Complete user workflows
- Cross-layer optimization
- Full system functionality`,
      tester: `
- Test plan creation and execution
- Automated testing implementation
- Quality assurance processes
- Bug identification and reporting
- User acceptance testing`,
      devops: `
- CI/CD pipeline setup
- Infrastructure configuration
- Deployment automation
- Monitoring and logging
- Security and compliance`
    };

    return guidance[role as keyof typeof guidance] || 'General development tasks';
  }

  // ✅ ENHANCED: Test case generation from PRD
  async generateTestCasesFromPRD(
    credentials: AzureDevOpsCredentials,
    prdFileName: string,
    prdContent: string,
    testers: Array<{ email: string; role: string }>
  ): Promise<{ success: boolean; createdTestCases?: Array<{ email: string; workItemId: number; role: string }>; error?: string }> {
    try {
      console.log('=== AI-POWERED TEST CASE GENERATION FROM PRD ===');
      
      // Step 1: Generate test cases from PRD using backend AI
      const testCasesResponse = await fetch('http://localhost:8000/api/generate-test-cases-from-prd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prdContent: prdContent,
          testers: testers,
          prdFileName: prdFileName
        })
      });

      if (!testCasesResponse.ok) {
        throw new Error(`Backend API error: ${testCasesResponse.status}`);
      }

      const testCasesResult = await testCasesResponse.json();
      
      if (!testCasesResult.success || !testCasesResult.testCases) {
        throw new Error(testCasesResult.error || 'Failed to generate test cases from backend');
      }

      console.log(`Generated ${testCasesResult.totalTestCases} test cases from PRD`);

      // Step 2: Create work items for each test case
      const createdTestCases = [];
      
      for (const testCase of testCasesResult.testCases) {
        const result = await this.createWorkItem(credentials, {
          title: testCase.title,
          description: testCase.description,
          assignedTo: testCase.assignedTo,
          workItemType: 'Test Case',
          tags: ['test-case', 'prd-generated', 'automated-testing']
        });

        if (result.success && result.workItemId) {
          createdTestCases.push({
            email: testCase.assignedTo,
            workItemId: result.workItemId,
            role: testCase.role
          });
          
          console.log(`✅ Created test case ${result.workItemId} for ${testCase.assignedTo}: ${testCase.title}`);
        } else {
          console.warn(`❌ Failed to create test case for ${testCase.assignedTo}:`, result.error);
        }
      }

      return {
        success: createdTestCases.length > 0,
        createdTestCases: createdTestCases
      };
    } catch (error) {
      console.error('Error in test case generation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during test case generation'
      };
    }
  }
}

export const azureDevOpsService = new AzureDevOpsService();
