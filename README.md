
# GPT Mate - AI Software Development Assistant

GPT Mate is an intelligent AI-powered assistant designed to help software developers, testers, and business analysts streamline their workflow. It combines conversational AI capabilities with powerful integrations to popular development tools.

## 🚀 Features

### Core Functionality
- **AI Chat Interface**: Interactive conversation with AI for software development assistance
- **Multi-language Support**: Available in both English and Arabic
- **Role-based Assistance**: Specialized modes for different development roles
- **Real-time Responses**: Fast AI-powered responses for development queries

### Integrations
- **Axure DevOps**: Connect and sync with Axure DevOps for design specifications
- **Jira**: Integrate with Jira for issue tracking and project management
- **ClickUp**: Connect to ClickUp for task management and collaboration
- **Azure DevOps**: Sync with Azure DevOps for comprehensive project management

### Key Capabilities
- **Software Testing Assistance**: AI-powered test case generation and validation
- **BRD Analysis**: Business Requirements Document analysis and recommendations
- **Code Review Support**: Intelligent code analysis and suggestions
- **Project Integration**: Seamless connection with popular development tools

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state
- **Routing**: React Router DOM
- **UI Components**: Radix UI primitives with custom styling
- **Icons**: Lucide React
- **Form Handling**: React Hook Form with Zod validation

## 📦 Installation

### Prerequisites
- Node.js 16+ and npm (recommended: install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Git

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:8080` to view the application

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui base components
│   ├── ChatInterface.tsx
│   ├── IntegrationCard.tsx
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useIntegrations.ts
│   ├── useAISettings.ts
│   └── ...
├── pages/              # Route components
├── services/           # API and external service integrations
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── config/             # Configuration files
```

## 🔧 Configuration

### AI Settings
Configure AI providers and settings through the settings modal in the application.

### Integration Setup
1. Navigate to the Integrations panel
2. Select the integration you want to configure
3. Enter your API credentials and connection details
4. Test the connection to ensure proper setup

### Environment Variables
Create a `.env.local` file for environment-specific configurations:
```bash
# Add your environment variables here
VITE_API_URL=your_api_url
```

## 🚀 Deployment

### Using Lovable (Recommended)
1. Open your [Lovable Project](https://lovable.dev/projects/e78f8bab-068e-44ce-bfac-ee39ba4c525f)
2. Click on **Share** → **Publish**
3. Your app will be deployed automatically

### Manual Deployment
1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** to your preferred hosting service:
   - Netlify
   - Vercel
   - AWS S3 + CloudFront
   - Any static hosting service

## 🔗 Custom Domain

To connect a custom domain:
1. Navigate to **Project** → **Settings** → **Domains** in Lovable
2. Click **Connect Domain**
3. Follow the DNS configuration instructions

*Note: A paid Lovable plan is required for custom domains.*

## 🤝 Contributing

### Development Workflow
1. Make changes in the Lovable editor or locally
2. Changes are automatically synced with the connected GitHub repository
3. Test your changes in the preview window
4. Deploy using the Lovable publish feature

### Code Style
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Implement responsive designs
- Follow the existing component structure

## 📱 Usage

### Getting Started
1. Open the application
2. Start a conversation with the AI assistant
3. Configure integrations as needed
4. Use the various AI-powered features for your development workflow

### Integration Workflow
1. **Setup**: Configure your development tool integrations
2. **Sync**: Connect GPT Mate with your existing projects
3. **Assist**: Use AI-powered assistance for development tasks
4. **Collaborate**: Share insights and recommendations with your team

## 🔍 Troubleshooting

### Common Issues
- **Build Errors**: Ensure all dependencies are installed with `npm install`
- **Integration Connection**: Verify API credentials and network connectivity
- **Performance**: Clear browser cache and restart the development server

### Getting Help
- Check the [Lovable Documentation](https://docs.lovable.dev/)
- Join the [Lovable Discord Community](https://discord.com/channels/1119885301872070706/1280461670979993613)
- Review the project's issue tracker

## 📄 License

This project is part of the Lovable platform. Please refer to Lovable's terms of service for usage rights and restrictions.

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev/) - AI-powered web application development
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)

---

**Project URL**: https://lovable.dev/projects/e78f8bab-068e-44ce-bfac-ee39ba4c525f

Made with ❤️ using Lovable
