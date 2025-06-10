import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListPromptsRequestSchema, GetPromptRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
class TemplateServer {
    server;
    templates;
    resources;
    constructor() {
        this.server = new Server({
            name: "prompts-template-server",
            version: "0.1.0",
        }, {
            capabilities: {
                prompts: {},
                resources: {},
            },
        });
        this.templates = this.loadTemplates();
        this.resources = this.loadResources();
        this.setupHandlers();
    }
    loadTemplates() {
        const templates = new Map();
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
                        const config = yaml.load(configContent);
                        // Load template
                        const templatePath = path.join(categoryPath, 'template.md');
                        const template = fs.readFileSync(templatePath, 'utf-8');
                        templates.set(category, {
                            config,
                            template
                        });
                    }
                    catch (error) {
                        console.error(`Failed to load template ${category}:`, error);
                    }
                }
            }
        }
        catch (error) {
            console.error('Failed to load templates directory:', error);
        }
        return templates;
    }
    loadResources() {
        const resources = new Map();
        const resourceDir = path.join(__dirname, '..', 'resources');
        try {
            if (!fs.existsSync(resourceDir)) {
                fs.mkdirSync(resourceDir, { recursive: true });
            }
            const files = fs.readdirSync(resourceDir);
            for (const file of files) {
                if (file.endsWith('.md')) {
                    const filePath = path.join(resourceDir, file);
                    const content = fs.readFileSync(filePath, 'utf-8');
                    const resourceName = path.basename(file, '.md');
                    const uri = `resource://${resourceName}`;
                    // Extract description from first line if it starts with #
                    let description = '';
                    const lines = content.split('\n');
                    if (lines[0].startsWith('#')) {
                        description = lines[0].replace('#', '').trim();
                    }
                    resources.set(uri, {
                        uri,
                        name: resourceName,
                        description: description || `Resource: ${resourceName}`,
                        mimeType: 'text/markdown',
                        content
                    });
                }
            }
        }
        catch (error) {
            console.error('Failed to load resources directory:', error);
        }
        return resources;
    }
    setupHandlers() {
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
                throw new McpError(ErrorCode.InvalidRequest, `Unknown template: ${name}`);
            }
            let formattedTemplate = template.template;
            // Replace placeholders with arguments
            if (args) {
                for (const [key, value] of Object.entries(args)) {
                    const placeholder = `{{ ${key} }}`;
                    formattedTemplate = formattedTemplate.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), String(value));
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
        // Handle list resources
        this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
            const resources = Array.from(this.resources.values()).map(resource => ({
                uri: resource.uri,
                name: resource.name,
                description: resource.description,
                mimeType: resource.mimeType
            }));
            return { resources };
        });
        // Handle read resource
        this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
            const { uri } = request.params;
            const resource = this.resources.get(uri);
            if (!resource) {
                throw new McpError(ErrorCode.InvalidRequest, `Resource not found: ${uri}`);
            }
            return {
                contents: [
                    {
                        uri: resource.uri,
                        mimeType: resource.mimeType,
                        text: resource.content
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
//# sourceMappingURL=server.js.map