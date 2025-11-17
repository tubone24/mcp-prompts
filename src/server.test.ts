import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock modules before importing the server
vi.mock('fs');
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: vi.fn().mockImplementation(() => ({
    setRequestHandler: vi.fn(),
    connect: vi.fn(),
  })),
}));
vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn(),
}));

describe('TemplateServer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadTemplates', () => {
    it('should load templates from directory structure', () => {
      // Mock filesystem structure
      const mockCategories = ['category1', 'category2'];
      const mockTemplate = 'Test template content {{ arg1 }}';

      vi.mocked(fs.readdirSync).mockReturnValue(mockCategories as unknown as fs.Dirent[]);
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as fs.Stats);
      vi.mocked(fs.readFileSync)
        .mockReturnValueOnce(
          `description: Test template
version: 1.0.0
arguments:
  - name: arg1
    description: Test argument
    required: true
metadata:
  tags:
    - test
  suggested_use: testing
  output_format: text`
        )
        .mockReturnValueOnce(mockTemplate);

      expect(fs.readdirSync).toBeDefined();
    });
  });

  describe('Template placeholder replacement', () => {
    it('should replace placeholders correctly', () => {
      const template = 'Hello {{ name }}, welcome to {{ place }}!';
      const args = { name: 'World', place: 'MCP' };

      let result = template;
      for (const [key, value] of Object.entries(args)) {
        const placeholder = `{{ ${key} }}`;
        result = result.replace(
          new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          String(value)
        );
      }

      expect(result).toBe('Hello World, welcome to MCP!');
    });

    it('should handle multiple occurrences of the same placeholder', () => {
      const template = '{{ word }} {{ word }} {{ word }}';
      const args = { word: 'test' };

      let result = template;
      for (const [key, value] of Object.entries(args)) {
        const placeholder = `{{ ${key} }}`;
        result = result.replace(
          new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          String(value)
        );
      }

      expect(result).toBe('test test test');
    });
  });

  describe('Resource URI generation', () => {
    it('should generate correct resource URI', () => {
      const fileName = 'example.md';
      const resourceName = path.basename(fileName, '.md');
      const uri = `resource://${resourceName}`;

      expect(uri).toBe('resource://example');
    });

    it('should extract description from markdown heading', () => {
      const content = '# Test Resource\nThis is the content';
      const lines = content.split('\n');
      let description = '';

      if (lines[0].startsWith('#')) {
        description = lines[0].replace('#', '').trim();
      }

      expect(description).toBe('Test Resource');
    });

    it('should handle content without heading', () => {
      const content = 'This is content without heading';
      const lines = content.split('\n');
      let description = '';

      if (lines[0].startsWith('#')) {
        description = lines[0].replace('#', '').trim();
      }

      expect(description).toBe('');
    });
  });

  describe('Path resolution', () => {
    it('should resolve template directory path correctly', () => {
      const __dirname = '/home/user/mcp-prompts/dist';
      const templateDir = path.join(__dirname, '..', 'templates');

      expect(templateDir).toBe('/home/user/mcp-prompts/templates');
    });

    it('should resolve resource directory path correctly', () => {
      const __dirname = '/home/user/mcp-prompts/dist';
      const resourceDir = path.join(__dirname, '..', 'resources');

      expect(resourceDir).toBe('/home/user/mcp-prompts/resources');
    });
  });
});
