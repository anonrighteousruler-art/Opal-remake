import { Injectable, signal, computed, inject } from '@angular/core';
import { AiService } from './ai.service';

export type NodeType = 'input' | 'generate' | 'output' | 'transform' | 'filter' | 'condition' | 'delay' | 'file-input' | 'validation-loop' | 'data-stream';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  label: string;
  prompt?: string;
  value?: string;
  groupId?: string;
  config?: Record<string, unknown>;
  files?: { name: string; content: string; type: string }[];
  retryCount?: number; // For validation-loop
}

export interface WorkflowVersion {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  timestamp: Date;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface LogEntry {
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'error' | 'thinking';
}
// ... (rest of the interface definitions)

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {
  ai = inject(AiService);
  nodes = signal<WorkflowNode[]>([]); // Initialize empty
  edges = signal<WorkflowEdge[]>([]);
  
  versions = signal<WorkflowVersion[]>([]);
  currentVersionId = signal<string | null>(null);

  // ... (rest of the service implementation)
  
  selectedNodeId = signal<string | null>(null);
  
  logs = signal<LogEntry[]>([
    { timestamp: new Date(), message: 'Workflow initialized.', type: 'info' }
  ]);

  selectedNode = computed(() => {
    const id = this.selectedNodeId();
    return this.nodes().find(n => n.id === id) || null;
  });

  zoom = signal(1);
  pan = signal({ x: 0, y: 0 });
  gridSize = 20;

  validateWorkflow(): { valid: boolean; message: string } {
    const nodes = this.nodes();
    if (nodes.length === 0) return { valid: false, message: 'Workflow is empty.' };
    
    const hasInput = nodes.some(n => n.type === 'input' || n.type === 'file-input');
    const hasOutput = nodes.some(n => n.type === 'output');
    
    if (!hasInput) return { valid: false, message: 'Workflow must have at least one input node.' };
    if (!hasOutput) return { valid: false, message: 'Workflow must have at least one output node.' };
    
    return { valid: true, message: 'Workflow is valid.' };
  }

  addNode(type: NodeType, x: number, y: number) {
    const id = `node-${Date.now()}`;
    const label = type === 'input' ? 'New Input' : type === 'file-input' ? 'File Upload' : type === 'generate' ? 'New Generate' : 'New Output';
    // Snap to grid
    const snappedX = Math.round(x / this.gridSize) * this.gridSize;
    const snappedY = Math.round(y / this.gridSize) * this.gridSize;
    this.nodes.update(ns => [...ns, { id, type, x: snappedX, y: snappedY, label }]);
    this.log(`Added new ${type} node`, 'info');
  }

  updateNode(id: string, updates: Partial<WorkflowNode>) {
    this.nodes.update(ns => ns.map(n => {
      if (n.id === id) {
        const updated = { ...n, ...updates };
        if (updates.x !== undefined || updates.y !== undefined) {
          // Snap to grid
          updated.x = Math.round(updated.x / this.gridSize) * this.gridSize;
          updated.y = Math.round(updated.y / this.gridSize) * this.gridSize;
        }
        return updated;
      }
      return n;
    }));
  }

  deleteNode(id: string) {
    this.nodes.update(ns => ns.filter(n => n.id !== id));
    this.edges.update(es => es.filter(e => e.source !== id && e.target !== id));
    if (this.selectedNodeId() === id) {
      this.selectedNodeId.set(null);
    }
    this.log(`Deleted node ${id}`, 'info');
  }

  addEdge(source: string, target: string) {
    if (source === target) return;
    const exists = this.edges().some(e => e.source === source && e.target === target);
    if (!exists) {
      this.edges.update(es => [...es, { id: `edge-${Date.now()}`, source, target }]);
      this.log(`Connected ${source} to ${target}`, 'info');
    }
  }

  deleteEdge(id: string) {
    this.edges.update(es => es.filter(e => e.id !== id));
  }

  selectNode(id: string | null) {
    this.selectedNodeId.set(id);
  }

  log(message: string, type: LogEntry['type'] = 'info') {
    this.logs.update(ls => [...ls, { timestamp: new Date(), message, type }]);
  }

  clearLogs() {
    this.logs.set([]);
  }

  async runWorkflow() {
    const validation = this.validateWorkflow();
    if (!validation.valid) {
      this.log(validation.message, 'error');
      return;
    }
    
    this.log('Starting workflow execution...', 'info');
    
    // Find input nodes to start
    const startNodes = this.nodes().filter(n => n.type === 'input' || n.type === 'file-input');
    if (startNodes.length === 0) {
      this.log('No input node found to start workflow.', 'error');
      return;
    }

    // Simple sequential execution for MVP
    for (const startNode of startNodes) {
      let currentNode: WorkflowNode | undefined = startNode;
      let currentData = '';
      
      if (startNode.type === 'input') {
        currentData = startNode.value || '';
      } else if (startNode.type === 'file-input') {
        const files = startNode.files || [];
        if (files.length > 0) {
          currentData = files.map(f => `File: ${f.name}\nContent: ${f.content.substring(0, 500)}...`).join('\n\n');
          this.log(`Processing ${files.length} files from ${startNode.label}`, 'info');
        } else {
          this.log(`No files uploaded in ${startNode.label}`, 'error');
          continue;
        }
      }
      
      this.log(`Starting from: ${startNode.label}`, 'info');

      while (currentNode) {
        const nextEdge = this.edges().find(e => e.source === currentNode?.id);
        const nextNode = nextEdge ? this.nodes().find(n => n.id === nextEdge.target) : undefined;

        if (!nextNode) break;

        this.log(`Moving to: ${nextNode.label}`, 'info');

        try {
          if (nextNode.type === 'generate') {
            const prompt = (nextNode.prompt || '').replace('{{input}}', currentData);
            this.log(`AI Processing: ${prompt}`, 'thinking');
            const response = await this.ai.generateContent(prompt);
            currentData = response.text || '';
            this.log(`AI Result: ${currentData.substring(0, 50)}...`, 'success');
          } else if (nextNode.type === 'transform') {
            const format = nextNode.config?.['format'] as string || 'uppercase';
            if (format === 'uppercase') currentData = currentData.toUpperCase();
            else if (format === 'lowercase') currentData = currentData.toLowerCase();
            else if (format === 'capitalize') {
              currentData = currentData.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            }
            this.log(`Transformed to ${format}`, 'success');
          } else if (nextNode.type === 'filter') {
            const keyword = nextNode.config?.['keyword'] as string || '';
            if (keyword && !currentData.includes(keyword)) {
              this.log(`Filtered out: keyword "${keyword}" not found`, 'error');
              break;
            }
            this.log(`Passed filter: keyword "${keyword}" found`, 'success');
          } else if (nextNode.type === 'data-stream') {
            const url = nextNode.config?.['url'] as string || '';
            if (url) {
              this.log(`Fetching live data from: ${url}`, 'thinking');
              try {
                const response = await fetch(url);
                const data = await response.json();
                currentData = JSON.stringify(data);
                this.log(`Data stream updated`, 'success');
              } catch (error) {
                this.log(`Error fetching data stream: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
                break;
              }
            }
          } else if (nextNode.type === 'validation-loop') {
            const prompt = (nextNode.prompt || '').replace('{{input}}', currentData);
            this.log(`Validating: ${prompt}`, 'thinking');
            const response = await this.ai.generateContent(prompt);
            const isValid = response.text?.toLowerCase().includes('valid') || false;
            
            if (isValid) {
              this.log(`Validation passed`, 'success');
            } else {
              this.log(`Validation failed. Re-routing...`, 'error');
              const targetNodeId = nextNode.config?.['targetNodeId'] as string;
              const targetNode = this.nodes().find(n => n.id === targetNodeId);
              if (targetNode) {
                currentNode = targetNode;
                continue; // Skip the currentNode = nextNode assignment at the end
              }
            }
          } else if (nextNode.type === 'output') {
            this.log(`Final Output: ${currentData}`, 'success');
            break;
          }
        } catch (error) {
          this.log(`Error in node ${nextNode.label}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
          break;
        }

        currentNode = nextNode;
      }
    }
    
    this.log('Execution completed.', 'success');
  }
}
