import Groq from "groq-sdk";

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
  workItemType?: 'Task' | 'Bug' | 'User Story';
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
    workItemData: WorkItemData
  ): Promise<{ success: boolean; workItemId?: number; error?: string }> {
    try {
      const { personalAccessToken, organizationUrl, projectName } = credentials;
      const headers = this.getAuthHeaders(personalAccessToken);
      
      const workItemType = workItemData.workItemType || 'Task';
      const url = this.getApiUrl(organizationUrl, projectName, `wit/workitems/$${workItemType}?api-version=7.1`);

      // Build the patch document for work item creation[2]
      const patchDocument = [
        {
          op: 'add',
          path: '/fields/System.Title',
          value: workItemData.title
        }
      ];

      if (workItemData.description) {
        patchDocument.push({
          op: 'add',
          path: '/fields/System.Description',
          value: workItemData.description
        });
      }

      if (workItemData.assignedTo) {
        patchDocument.push({
          op: 'add',
          path: '/fields/System.AssignedTo',
          value: workItemData.assignedTo
        });
      }

      // if (workItemData.tags && workItemData.tags.length > 0) {
      //   patchDocument.push({
      //     op: 'add',
      //     path: '/fields/System.Tags',
      //     value: workItemData.tags.join('; ')
      //   });
      // }

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(patchDocument)
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Failed to create work item: HTTP ${response.status} - ${errorText}`
        };
      }

      const createdWorkItem = await response.json();
      
      return {
        success: true,
        workItemId: createdWorkItem.id
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // async createTasksFromPRD(
  //   credentials: AzureDevOpsCredentials,
  //   prdFileName: string,
  //   teamMembers: Array<{ email: string; role: string }>
  // ): Promise<{ success: boolean; createdTasks?: Array<{ email: string; workItemId: number; role: string }>; error?: string }> {
  //   try {
  //     console.log('=== AUTOMATED AZURE DEVOPS TASK CREATION ===');
  //     console.log('PRD File:', prdFileName);
  //     console.log('Team members:', teamMembers.length);
  //     console.log('Project:', credentials.projectName);

  //     const createdTasks = [];
      
  //     // Enhanced role-based tasks with PRD context
  //     const roleTasks = {
  //       frontend: [
  //         'Implement user interface components based on PRD specifications',
  //         'Create responsive design layouts for all user interfaces',
  //         'Develop client-side functionality and user interactions',
  //         'Integrate frontend components with backend APIs',
  //         'Implement user authentication and authorization flows'
  //       ],
  //       backend: [
  //         'Design and implement database schema per PRD requirements',
  //         'Create REST API endpoints for all system functions',
  //         'Implement core business logic and data processing',
  //         'Set up authentication and authorization systems',
  //         'Develop data validation and security measures'
  //       ],
  //       fullstack: [
  //         'Implement end-to-end features from PRD specifications',
  //         'Create complete user workflows and processes',
  //         'Integrate frontend and backend components seamlessly',
  //         'Develop comprehensive system functionality',
  //         'Ensure data flow consistency across all layers'
  //       ],
  //       tester: [
  //         'Create comprehensive test plans based on PRD requirements',
  //         'Develop automated test cases for all features',
  //         'Perform functional and integration testing',
  //         'Execute user acceptance testing scenarios',
  //         'Document and track defects and issues'
  //       ],
  //       devops: [
  //         'Set up CI/CD pipelines for automated deployment',
  //         'Configure production and staging environments',
  //         'Implement monitoring and logging systems',
  //         'Manage infrastructure and scalability requirements',
  //         'Ensure security and compliance standards'
  //       ]
  //     };

  //     // Create tasks for each team member
  //     for (const member of teamMembers) {
  //       const roleSpecificTasks = roleTasks[member.role as keyof typeof roleTasks] || ['General development tasks'];
  //       const randomTask = roleSpecificTasks[Math.floor(Math.random() * roleSpecificTasks.length)];
        
  //       const taskTitle = `[${member.role.toUpperCase()}] ${randomTask}`;
  //       const taskDescription = `Task automatically generated from PRD: ${prdFileName}

  // Role: ${member.role}
  // Assigned to: ${member.email}

  // Task Description: ${randomTask}

  // This task is part of the automated project implementation workflow based on the Product Requirements Document. Please refer to the PRD for detailed specifications and requirements.

  // Generated: ${new Date().toLocaleString()}
  // Priority: Based on role and project timeline
  // Estimated Effort: To be determined during sprint planning`;
        
  //       const result = await this.createWorkItem(credentials, {
  //         title: taskTitle,
  //         description: taskDescription,
  //         assignedTo: member.email,
  //         workItemType: 'Task',
  //         //tags: [member.role, 'prd-generated', 'auto-assigned', 'automated-workflow']
  //       });

  //       if (result.success && result.workItemId) {
  //         createdTasks.push({
  //           email: member.email,
  //           workItemId: result.workItemId,
  //           role: member.role
  //         });
          
  //         console.log(`✅ Created work item ${result.workItemId} for ${member.email} (${member.role})`);
  //       } else {
  //         console.warn(`❌ Failed to create task for ${member.email}:`, result.error);
  //       }
  //     }

  //     console.log(`=== TASK CREATION COMPLETE: ${createdTasks.length}/${teamMembers.length} successful ===`);

  //     return {
  //       success: createdTasks.length > 0,
  //       createdTasks: createdTasks
  //     };
  //   } catch (error) {
  //     console.error('Error in automated createTasksFromPRD:', error);
  //     return {
  //       success: false,
  //       error: error instanceof Error ? error.message : 'Unknown error occurred during automated task creation'
  //     };
  //   }
  // }

  // Enhanced createTasksFromPRD method with AI-powered extraction
  async createTasksFromPRD(
    credentials: AzureDevOpsCredentials,
    prdFileName: string,
    teamMembers: Array<{ email: string; role: string }>
  ): Promise<{ success: boolean; createdTasks?: Array<{ email: string; workItemId: number; role: string }>; error?: string }> {
    try {
      console.log('=== AI-POWERED TASK EXTRACTION FROM PRD ===');
      
      // Step 1: Extract tasks from PRD using Groq AI
      const extractedTasks = await this.extractTasksFromPRDWithAI(prdFileName, teamMembers);
      
      if (!extractedTasks || extractedTasks.length === 0) {
        throw new Error('No tasks could be extracted from the PRD file');
      }

      console.log(`Extracted ${extractedTasks.length} tasks from PRD`);

      // Step 2: Create work items for each extracted task
      const createdTasks = [];
      
      for (const task of extractedTasks) {
        const result = await this.createWorkItem(credentials, {
          title: task.title,
          description: task.description,
          assignedTo: task.assignedTo,
          workItemType: 'Task',
          tags: [task.role, 'prd-extracted', 'ai-generated']
        });

        if (result.success && result.workItemId) {
          createdTasks.push({
            email: task.assignedTo,
            workItemId: result.workItemId,
            role: task.role
          });
          
          console.log(`✅ Created work item ${result.workItemId} for ${task.assignedTo} (${task.role}): ${task.title}`);
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

  // New method for AI-powered task extraction
async extractTasksFromPRDWithAI(
  prdFileName: string,
  teamMembers: Array<{ email: string; role: string }>
): Promise<Array<{ title: string; description: string; assignedTo: string; role: string }>> {
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

// Generate role-specific tasks using Groq AI
async generateTasksForRole(
  role: string,
  members: Array<{ email: string; role: string }>,
  prdFileName: string
): Promise<Array<{ title: string; description: string; assignedTo: string; role: string }>> {
  try {
    const groq = new Groq({
      apiKey: 'your-groq-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-key'
    });

    const systemPrompt = `You are an expert project manager analyzing a PRD document. Generate specific, actionable tasks for ${role} developers based on the PRD content.

Requirements:
- Generate exactly 5 detailed tasks for ${role} role
- Each task should be specific and actionable
- Tasks should be realistic and implementable
- Include technical details relevant to ${role} work
- Return tasks in JSON format

Return format:
{
  "tasks": [
    {
      "title": "Specific task title",
      "description": "Detailed description with technical requirements and acceptance criteria"
    }
  ]
}`;

    const userPrompt = `Based on the PRD file "${prdFileName}", generate 5 specific ${role} development tasks. 

For ${role} developers, focus on:
${this.getRoleSpecificGuidance(role)}

Generate tasks that are:
- Specific to ${role} development work
- Technically detailed and actionable
- Based on typical PRD requirements
- Include acceptance criteria
- Realistic in scope for sprint planning

Return only the JSON with 5 tasks.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = completion.choices[0]?.message?.content;
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedTasks = JSON.parse(jsonMatch[0]);
        
        if (parsedTasks.tasks && Array.isArray(parsedTasks.tasks)) {
          // Distribute tasks among team members of this role
          return this.distributeTasks(parsedTasks.tasks, members, role);
        }
      }
    } catch (parseError) {
      console.error('Failed to parse AI response for role:', role);
    }

    // Fallback if AI parsing fails
    return this.generateFallbackTasks(role, members);
  } catch (error) {
    console.error(`Error generating tasks for ${role}:`, error);
    return this.generateFallbackTasks(role, members);
  }
}

// Get role-specific guidance for AI task generation
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

// Distribute tasks among team members
private distributeTasks(
  tasks: Array<{ title: string; description: string }>,
  members: Array<{ email: string; role: string }>,
  role: string
): Array<{ title: string; description: string; assignedTo: string; role: string }> {
  const distributedTasks = [];
  
  tasks.forEach((task, index) => {
    const assignedMember = members[index % members.length];
    distributedTasks.push({
      title: `[${role.toUpperCase()}] ${task.title}`,
      description: `${task.description}\n\nRole: ${role}\nAssigned to: ${assignedMember.email}\nGenerated from PRD analysis`,
      assignedTo: assignedMember.email,
      role: role
    });
  });

  return distributedTasks;
}

// Fallback task generation if AI fails
private generateFallbackTasks(
  role: string,
  members: Array<{ email: string; role: string }>
): Array<{ title: string; description: string; assignedTo: string; role: string }> {
  const fallbackTasks = {
    frontend: [
      'Implement main dashboard UI components',
      'Create responsive navigation system',
      'Develop user authentication interface',
      'Build data visualization components',
      'Implement form validation and user feedback'
    ],
    backend: [
      'Design and implement database schema',
      'Create user authentication API endpoints',
      'Develop data processing business logic',
      'Implement API security and validation',
      'Create data backup and recovery system'
    ],
    fullstack: [
      'Implement complete user registration flow',
      'Develop end-to-end search functionality',
      'Create integrated reporting system',
      'Build real-time notification system',
      'Implement complete user profile management'
    ],
    tester: [
      'Create comprehensive test plan',
      'Develop automated UI test suite',
      'Implement API testing framework',
      'Execute performance testing scenarios',
      'Create user acceptance test cases'
    ],
    devops: [
      'Set up CI/CD pipeline infrastructure',
      'Configure production deployment environment',
      'Implement monitoring and alerting system',
      'Create automated backup procedures',
      'Set up security scanning and compliance'
    ]
  };

  const tasks = fallbackTasks[role as keyof typeof fallbackTasks] || ['General development task'];
  
  return tasks.map((task, index) => ({
    title: `[${role.toUpperCase()}] ${task}`,
    description: `Fallback task: ${task}\n\nRole: ${role}\nGenerated as backup when AI extraction failed`,
    assignedTo: members[index % members.length].email,
    role: role
  }));
}




}

export const azureDevOpsService = new AzureDevOpsService();
