import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  CallToolRequestSchema, 
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ErrorCode,
  McpError
} from "@modelcontextprotocol/sdk/types.js";
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface TemplateConfig {
  description: string;
  version: string;
  arguments: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
  metadata: {
    tags: string[];
    suggested_use: string;
    output_format: string;
  };
}

interface Template {
  config: TemplateConfig;
  template: string;
}

class TemplateServer {
  private server: Server;
  private templates: Map<string, Template>;

  constructor() {
    this.server = new Server(
      {
        name: "prompts-template-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          prompts: {},
        },
      }
    );
    
    this.templates = this.loadTemplates();
    this.setupHandlers();
  }

  private loadTemplates(): Map<string, Template> {
    const templates = new Map<string, Template>();
    const templateDir = path.join(__dirname, '..', 'templates');
    
    try {
      const categories = fs.readdirSync(templateDir);
      
      for (const category of categories) {
        const categoryPath = path.join(templateDir, category);
        
        if (fs.statSync(categoryPath).isDirectory()) {
          try {
            // Load config
            const configPath = path.join(categoryPath, 'config.yaml');
            const configContent = fs.readFileSync(configPath, 'utf-8');
            const config = yaml.load(configContent) as TemplateConfig;
            
            // Load template
            const templatePath = path.join(categoryPath, 'template.md');
            const template = fs.readFileSync(templatePath, 'utf-8');
            
            templates.set(category, {
              config,
              template
            });
          } catch (error) {
            console.error(`Failed to load template ${category}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load templates directory:', error);
    }
    
    return templates;
  }

  private setupHandlers() {
    // Handle list prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      const prompts = Array.from(this.templates.entries()).map(([name, template]) => ({
        name,
        description: template.config.description,
        arguments: template.config.arguments.map(arg => ({
          name: arg.name,
          description: arg.description,
          required: arg.required
        }))
      }));
      
      return { prompts };
    });

    // Handle get prompt
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      const template = this.templates.get(name);
      if (!template) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Unknown template: ${name}`
        );
      }
      
      let formattedTemplate = template.template;
      
      // Replace placeholders with arguments
      if (args) {
        for (const [key, value] of Object.entries(args)) {
          const placeholder = `{{ ${key} }}`;
          formattedTemplate = formattedTemplate.replace(
            new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
            String(value)
          );
        }
      }
      
      return {
        description: template.config.description,
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: formattedTemplate
            }
          }
        ]
      };
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("MCP Template Server running on stdio");
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new TemplateServer();
  server.run().catch(console.error);
}