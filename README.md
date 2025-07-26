# MCP Prompt Templates Server

A Model Context Protocol (MCP) server that provides a "prompts" primitive for managing and serving customizable prompt templates. This server allows you to create, organize, and serve prompt templates that can be used by MCP clients for various tasks like meeting analysis, content summarization, and blog post creation.

## Features

- **Dynamic Template Loading**: Automatically loads prompt templates from the `templates` directory
- **YAML Configuration**: Each template uses YAML for configuration, making it easy to define metadata and parameters
- **Argument Support**: Templates support dynamic arguments that can be replaced at runtime
- **Resource Management**: Provides access to Markdown resources from the `resources` directory through MCP resources primitive
- **Type-Safe Implementation**: Built with TypeScript for improved reliability and developer experience
- **Standard MCP Prompts**: Implements the MCP prompts primitive, making it compatible with any MCP client
- **Standard MCP Resources**: Implements the MCP resources primitive for accessing static content and documentation

## Demo

This MCP server provides "prompts" that can be used directly in Claude Desktop. Here's how it works:

### 1. Viewing Available Prompts
When the MCP server is configured, you can see the list of available prompts by clicking "+" icon in Claude:

![Available prompts list](./docs/demo0.png)

The server dynamically loads all templates from the `templates` directory and makes them available as prompts.

### 2. Using a Prompt
Select a prompt (e.g., `today_city_weather_forecast`) to see its required arguments:

![Prompt argument form](./docs/demo1.png)

Fill in the required fields:
- **City**: Enter the city name (e.g., "川崎" for Kawasaki)
- **Date**: Enter the date for the forecast (e.g., "2025-06-02")

### 3. Prompt Execution
After clicking "プロンプトを追加" (Add Prompt), the template is processed with your arguments:

![Prompt execution result](./docs/demo2.png)

The server replaces the placeholders in the template with your provided values and returns the formatted prompt.

### 4. Claude's Response
Claude then processes the generated prompt and provides a response based on the template's instructions:

![Claude's response](./docs/demo3.png)

In this example, Claude analyzes weather data and provides a detailed weather forecast for the specified city and date, following the format defined in the template.



## Installation

```bash
npm install
```

## Quick Start

1. Build the project:
   ```bash
   npm run build
   ```

2. Start the server:
   ```bash
   npm start
   ```

For development with hot-reloading:
```bash
npm run dev
```

## DXT Package Distribution

This server can also be distributed as a DXT (Desktop Extension) package for one-click installation in Claude Desktop.

### Building DXT Package

1. **Validate DXT configuration:**
   ```bash
   npm run dxt:validate
   ```

2. **Build the DXT package:**
   ```bash
   npm run dxt:build
   ```

3. **Create the .dxt file:**
   ```bash
   npm run dxt:package
   ```

The final `.dxt` file will be created in the `dist-dxt` directory and can be distributed for easy installation.

### Installing DXT Package

1. Open Claude Desktop
2. Go to Settings > Extensions  
3. Click "Install Extension" and select the `.dxt` file
4. The MCP server will be automatically configured and ready to use

## Creating Templates

Templates are organized in the `templates` directory. Each template requires:
- A directory with a descriptive name (e.g., `business_team_minutes_template`)
- A `config.yaml` file defining metadata and arguments
- A `template.md` file containing the prompt template

### Template Structure

```
templates/
└── your_custom_template/
    ├── config.yaml
    └── template.md
```

### Configuration Format (config.yaml)

```yaml
description: "A detailed description of what this template does"
version: "1.0"
arguments:
  - name: "argument_name"
    description: "Description of this argument"
    required: true
  - name: "optional_argument"
    description: "This argument is optional"
    required: false
metadata:
  tags:
    - tag1
    - tag2
  suggested_use: "When and how to use this template"
  output_format: "markdown"
```

### Template Format (template.md)

Templates use Mustache-style placeholders for arguments:

```markdown
# My Template

Date: {{ date }}
Title: {{ title }}

Content that uses the arguments provided by the user.
{{ main_content }}
```

## MCP Server Configuration

To use this server with an MCP client, add it to your MCP settings configuration.

### For Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "prompt-templates": {
      "command": "node",
      "args": ["/path/to/mcp-prompt-templates-ts/dist/server.js"]
    }
  }
}
```

### For Development

During development, you can use tsx directly:

```json
{
  "mcpServers": {
    "prompt-templates": {
      "command": "npx",
      "args": ["tsx", "/path/to/mcp-prompt-templates-ts/src/server.ts"]
    }
  }
}
```

## Development

### Project Structure

```
mcp-prompt-templates-ts/
├── src/
│   ├── server.ts    # Main MCP server implementation
│   └── client.ts    # Test client for development
├── templates/       # Prompt templates directory
├── resources/       # Static Markdown resources directory
├── dist/           # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── README.md
```

### Adding New Templates

1. Create a new directory in `templates/`
2. Add a `config.yaml` file with the template configuration
3. Add a `template.md` file with the prompt template
4. Restart the server to load the new template

## Managing Resources

Resources provide a way to serve static Markdown content through the MCP resources primitive. These can be documentation, guides, or any reference material that MCP clients can access.

### Resource Structure

Resources are stored as Markdown files in the `resources` directory:

```
resources/
├── user-guide.md
├── api-documentation.md
└── troubleshooting-guide.md
```

### Resource Format

Each resource is a standard Markdown file. The first line can optionally start with `#` to provide a description:

```markdown
# User Guide for Template Management

This guide explains how to create and manage prompt templates...

## Section 1
Content here...
```

### Adding Resources

1. Create a `.md` file in the `resources/` directory
2. Add your Markdown content
3. Optionally start with a `#` heading for the resource description
4. Restart the server to load the new resource

### Accessing Resources

Resources are automatically exposed through the MCP resources primitive with URIs like `resource://filename` (without the `.md` extension). MCP clients can list and read these resources using standard MCP resource operations.

## API Reference

This server implements the MCP prompts and resources primitives with the following handlers:

### Prompts API

#### List Prompts
Returns all available prompt templates with their metadata.

#### Get Prompt
Retrieves a specific prompt template and replaces arguments with provided values.

**Parameters:**
- `name`: The template name (directory name)
- `arguments`: Object containing argument values to substitute

### Resources API

#### List Resources
Returns all available resources from the `resources` directory.

**Response:**
- Array of resource objects with `uri`, `name`, `description`, and `mimeType`

#### Read Resource
Retrieves the content of a specific resource.

**Parameters:**
- `uri`: The resource URI (e.g., `resource://filename`)

**Response:**
- Resource content as text with metadata

## License

MIT License - see LICENSE file for details

## Troubleshooting

### Server not loading templates
- Ensure templates directory exists and contains valid subdirectories
- Check that each template has both `config.yaml` and `template.md` files
- Verify YAML syntax in configuration files

### Template arguments not replacing
- Ensure argument names in template match those defined in config.yaml
- Use the correct placeholder syntax: `{{ argument_name }}`
- Check that required arguments are provided when calling the prompt

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/tubone24/mcp-prompts).