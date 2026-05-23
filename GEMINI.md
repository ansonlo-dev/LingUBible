# Gemini Project Configuration

This file helps Gemini understand your project's specific details and conventions. By providing this information, you can get more accurate and helpful assistance.

## Project Overview

**1. Project Description:**
Task Master AI is a powerful command-line tool that integrates with multiple AI models—including Anthropic Claude, OpenAI GPT, Perplexity, Mistral, Google PaLM, Azure OpenAI, Ollama, and XAI—to automate and manage software development tasks. It parses product requirement documents (PRDs), generates and expands tasks, analyzes their complexity, and maintains task dependencies, thereby streamlining workflows for software development teams and project managers.

**2. Target Audience:**
- Software engineers and developers  
- Project managers and scrum masters  
- AI researchers and automation enthusiasts  

## Tech Stack

**Languages:**  
- JavaScript (Node.js)  
- TypeScript  

**Frameworks/Libraries:**  
- Task Master AI CLI (`task-master`)  
- Node.js MCP integration  

**UI/Styling:**  
- Command-Line Interface (CLI) with colorized output  

**Database/Storage:**  
- JSON-based storage in `.taskmaster/tasks/tasks.json`  
- PRD documents in `.taskmaster/docs/prd.txt`  

**State Management:**  
- Task definitions and statuses persisted in JSON files  

## Development Setup

1. **Build Command:**  
   ```bash
   npm run build
   ```

2. **Local Development Command:**  
   ```bash
   git clone <repo-url>
   cd <project-folder>
   npm install
   npm link
   task-master init
   ```

3. **Environment Variables:**  
   - `ANTHROPIC_API_KEY` (Claude)  
   - `OPENAI_API_KEY`  
   - `PERPLEXITY_API_KEY`  
   - `GOOGLE_API_KEY`  
   - `MISTRAL_API_KEY`  
   - `AZURE_OPENAI_API_KEY`  
   - `OLLAMA_API_KEY`  
   - `XAI_API_KEY`  
   - `OPENROUTER_API_KEY`  
   - Configuration template provided in `.env.example`

4. **AI Model Configuration:**  
   ```bash
   task-master models --setup
   # Follow interactive prompts to configure preferred AI models and their API keys
   ```

## Testing

**Testing Frameworks:**  
- None preconfigured by default (consider adding Jest, Mocha, or Vitest)

**Commands:**  
```bash
npm test             # Run all tests
npm test -- <file>   # Run a specific test file
```

## Code Style and Conventions

**Linters/Formatters:**  
- ESLint (configured with your chosen rule set)  
- Prettier  

**Commands:**  
```bash
npm run lint         # Lint code
npm run lint:fix     # Auto-fix lint errors
```

**Guidelines:**  
- Follow the Standard JavaScript Style Guide  
- Use `PascalCase` for class names  
- Use `camelCase` for variables and functions  
- Use `kebab-case` for CLI commands and filenames  
- Keep functions small and focused on a single responsibility  

## Project Structure

**Key Directories and Files:**
```
project/
├── .taskmaster/
│   ├── docs/
│   │   └── prd.txt             # Product Requirement Document
│   ├── tasks/
│   │   ├── tasks.json          # Persisted task list
│   │   └── *.md                # Individual task files
│   └── config.json             # Task Master configuration
├── .claude/
│   ├── settings.json           # Claude-specific settings
│   └── commands/               # Custom Claude slash commands
├── .mcp.json                   # Multi-Connect Provider configuration
├── .env.example                # Environment variable template
├── CLAUDE.md                   # Claude integration guide
└── GEMINI.md                   # Gemini configuration (this file)
```

## Additional Information

### Essential Commands (Core Workflow)

```bash
# Project Setup
task-master init                                    # Initialize Task Master in current project
task-master parse-prd .taskmaster/docs/prd.txt      # Generate tasks from PRD document
task-master models --setup                          # Configure AI models interactively

# Daily Development Workflow
task-master list                                   # Show all tasks with status
task-master next                                   # Get next available task to work on
task-master show <id>                              # View detailed task information

# Task Updates
task-master update --from=<id>                     # Update multiple future tasks starting from <id>
task-master update-task --id=<id>                  # Update a single task by <id>
task-master update-subtask --id=<id>               # Log implementation details for a subtask

# Research Mode
task-master list --research                        # List tasks with research enhancements
task-master next --research                        # Get next task in research mode
# (Requires PERPLEXITY_API_KEY for research model API)
```

### Research Mode

- Use the `--research` flag to engage Perplexity-based research enhancements.  
- Provides deeper technical analysis and context for complex tasks.  
- Ensure `PERPLEXITY_API_KEY` is set in your environment.

### MCP Integration

- `.mcp.json` configures connections to multiple AI providers (e.g., Claude, OpenAI, Mistral).  
- Use `task-master mcp list` or `task-master mcp set <provider>` to manage endpoints.  

### Custom Slash Commands

- Custom workflows and shortcuts defined under `.claude/commands/`.  
- Reference your own frequently used task sequences for faster development.

### Deployment

- Published as `task-master-ai` on the npm registry.  
- Install globally:
  ```bash
  npm install -g task-master-ai
  ```
- Or run via npx:
  ```bash
  npx task-master-ai <command>
  ```

### Documentation

- For detailed Claude integration and custom commands, see `CLAUDE.md`.  
- Use this file (`GEMINI.md`) as the primary source for Gemini-based assistance and insights.
