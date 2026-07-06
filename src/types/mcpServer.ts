export type MCPTransport = 'stdio' | 'sse';

export interface MCPServer {
  id: number;
  project: number;
  name: string;
  transport: MCPTransport;
  url: string;
  command: string;
  args: string[];
  enabled: boolean;
}

export interface MCPServerInput {
  project: number;
  name: string;
  transport: MCPTransport;
  url: string;
  command: string;
  args: string[];
}
