export interface Tool {
  id: string;
  description: string;
  parameters: Record<string, any>;
  execute(params: Record<string, any>): Promise<string>;
}

export class ToolManager {
  private tools: Map<string, Tool> = new Map();

  registerTool(tool: Tool) {
    this.tools.set(tool.id, tool);
  }

  async invokeTool(toolId: string, params: Record<string, any>): Promise<string> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new Error(`Tool ${toolId} not found`);
    }
    return await tool.execute(params);
  }

  listTools(): Tool[] {
    return Array.from(this.tools.values());
  }
}

export const toolManager = new ToolManager();

/**
 * Helper function to invoke a tool by ID.
 */
export async function callTool(toolId: string, params: Record<string, any>): Promise<string> {
  return await toolManager.invokeTool(toolId, params);
}

// Example tool: Fetch weather info
toolManager.registerTool({
  id: 'fetch_weather',
  description: 'Fetch current weather for a city',
  parameters: { city: 'string' },
  async execute(params) {
    const city = params.city || 'New Orleans';
    try {
      const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=3`);
      const text = await response.text();
      return `Weather in ${city}: ${text}`;
    } catch (error) {
      console.error('[ToolManager] Weather fetch error:', error);
      return 'Sorry, I could not fetch the weather.';
    }
  }
});

// Example tool: Trigger Zapier webhook
toolManager.registerTool({
  id: 'trigger_zapier',
  description: 'Trigger a Zapier webhook for automation',
  parameters: { url: 'string', payload: 'object' },
  async execute(params) {
    try {
      const response = await fetch(params.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params.payload || {}),
      });
      if (response.ok) {
        return 'Automation triggered successfully.';
      } else {
        return 'Failed to trigger automation.';
      }
    } catch (error) {
      console.error('[ToolManager] Zapier trigger error:', error);
      return 'Sorry, I could not trigger the automation.';
    }
  }
});
