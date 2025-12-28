/**
 * Parse Modelfile content into Ollama API create payload
 * Supports: FROM, SYSTEM, TEMPLATE, PARAMETER, MESSAGE, LICENSE
 */

export interface ModelfileParseResult {
  from?: string;
  model?: string;
  system?: string;
  template?: string;
  parameters?: Record<string, string | number | boolean>;
  messages?: Array<{ role: string; content: string }>;
  license?: string;
  errors?: string[];
}

/**
 * Parse a Modelfile string into Ollama API create payload
 * @param modelfileContent - The Modelfile content as string
 * @returns Parsed result with fields for API payload
 */
export function parseModelfile(modelfileContent: string): ModelfileParseResult {
  const result: ModelfileParseResult = {
    parameters: {},
    messages: [],
    errors: [],
  };

  const lines = modelfileContent.split('\n');
  let currentMessageRole: string | null = null;
  let currentMessageContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;

    // Handle multi-line messages
    if (currentMessageRole) {
      if (line.startsWith('MESSAGE ')) {
        // Save previous message
        if (currentMessageContent.length > 0) {
          result.messages!.push({
            role: currentMessageRole,
            content: currentMessageContent.join('\n'),
          });
          currentMessageContent = [];
        }
        // Parse new MESSAGE directive
        const match = line.match(/^MESSAGE\s+(\w+)\s+"(.*)"$/);
        if (match) {
          currentMessageRole = match[1];
          currentMessageContent = [match[2]];
        } else {
          result.errors?.push(`Invalid MESSAGE format at line ${i + 1}`);
        }
      } else if (line === '"""') {
        // End of multi-line message
        if (currentMessageContent.length > 0) {
          result.messages!.push({
            role: currentMessageRole,
            content: currentMessageContent.join('\n'),
          });
          currentMessageRole = null;
          currentMessageContent = [];
        }
      } else {
        currentMessageContent.push(line);
      }
      continue;
    }

    // FROM directive
    if (line.startsWith('FROM ')) {
      result.from = line.substring(5).trim();
      continue;
    }

    // MODEL directive (optional model name)
    if (line.startsWith('MODEL ')) {
      result.model = line.substring(6).trim();
      continue;
    }

    // SYSTEM directive
    if (line.startsWith('SYSTEM ')) {
      const content = line.substring(7).trim();
      if (content.startsWith('"""')) {
        // Multi-line system prompt
        const endIndex = modelfileContent.indexOf('"""', i + 1);
        if (endIndex === -1) {
          result.errors?.push(`Unclosed SYSTEM directive at line ${i + 1}`);
          continue;
        }
        result.system = modelfileContent
          .substring(lines.slice(0, i).join('\n').length + 8, endIndex)
          .trim();
        i = modelfileContent.substring(0, endIndex).split('\n').length - 1;
      } else {
        result.system = content.replace(/^["']|["']$/g, '');
      }
      continue;
    }

    // TEMPLATE directive
    if (line.startsWith('TEMPLATE ')) {
      const content = line.substring(9).trim();
      if (content.startsWith('"""')) {
        // Multi-line template
        const endIndex = modelfileContent.indexOf('"""', i + 1);
        if (endIndex === -1) {
          result.errors?.push(`Unclosed TEMPLATE directive at line ${i + 1}`);
          continue;
        }
        result.template = modelfileContent
          .substring(lines.slice(0, i).join('\n').length + 10, endIndex)
          .trim();
        i = modelfileContent.substring(0, endIndex).split('\n').length - 1;
      } else {
        result.template = content.replace(/^["']|["']$/g, '');
      }
      continue;
    }

    // PARAMETER directive
    if (line.startsWith('PARAMETER ')) {
      const paramLine = line.substring(10).trim();
      const match = paramLine.match(/^(\w+)\s+(.+)$/);
      if (match) {
        const key = match[1];
        let value: string | number | boolean = match[2].trim();
        
        // Try to parse as number or boolean
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (!isNaN(Number(value))) value = Number(value);
        else value = value.replace(/^["']|["']$/g, ''); // Remove quotes
        
        result.parameters![key] = value;
      } else {
        result.errors?.push(`Invalid PARAMETER format at line ${i + 1}`);
      }
      continue;
    }

    // MESSAGE directive
    if (line.startsWith('MESSAGE ')) {
      const match = line.match(/^MESSAGE\s+(\w+)\s+"(.*)"$/);
      if (match) {
        currentMessageRole = match[1];
        currentMessageContent = [match[2]];
      } else if (line.match(/^MESSAGE\s+(\w+)\s+"""$/)) {
        // Multi-line message start
        const roleMatch = line.match(/^MESSAGE\s+(\w+)\s+"""$/);
        if (roleMatch) {
          currentMessageRole = roleMatch[1];
          currentMessageContent = [];
        }
      } else {
        result.errors?.push(`Invalid MESSAGE format at line ${i + 1}`);
      }
      continue;
    }

    // LICENSE directive
    if (line.startsWith('LICENSE ')) {
      result.license = line.substring(8).trim().replace(/^["']|["']$/g, '');
      continue;
    }
  }

  // Save any remaining message
  if (currentMessageRole && currentMessageContent.length > 0) {
    result.messages!.push({
      role: currentMessageRole,
      content: currentMessageContent.join('\n'),
    });
  }

  // Clean up empty arrays
  if (result.messages!.length === 0) delete result.messages;
  if (Object.keys(result.parameters!).length === 0) delete result.parameters;

  return result;
}
