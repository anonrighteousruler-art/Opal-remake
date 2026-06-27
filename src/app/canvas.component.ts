import { Component, inject, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkflowService, WorkflowNode, WorkflowEdge } from './workflow.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="relative w-full h-full bg-transparent overflow-hidden" 
         (mousedown)="onCanvasMouseDown($event)" 
         (mousemove)="onMouseMove($event)" 
         (mouseup)="onMouseUp()">
      
      <!-- Canvas Container for Zoom/Pan -->
      <div class="absolute inset-0 transition-transform duration-75 origin-top-left"
           [style.transform]="'scale(' + zoom() + ') translate(' + pan().x + 'px, ' + pan().y + 'px)'">
        
        <!-- Edges SVG Overlay -->
        <svg class="absolute inset-0 w-full h-full pointer-events-none z-0">
          @for (edge of edges(); track edge.id) {
            <path [attr.d]="getEdgePath(edge)" 
                  fill="none" 
                  stroke="rgba(255,255,255,0.3)" 
                  stroke-width="3" 
                  class="transition-all duration-200" />
          }
          @if (isConnecting() && connectionStart() && currentMousePos()) {
            <path [attr.d]="getTempEdgePath()" 
                  fill="none" 
                  stroke="rgba(255,255,255,0.2)" 
                  stroke-width="3" 
                  stroke-dasharray="5,5" />
          }
        </svg>

        <!-- Nodes -->
        @for (node of nodes(); track node.id) {
          <div class="absolute z-10 shadow-xl rounded-2xl border border-white/20 glass-panel cursor-move transition-all duration-200 hover:scale-[1.02]"
               [class.ring-4]="selectedNodeId() === node.id"
               [class.ring-indigo-500/50]="selectedNodeId() === node.id"
               [style.left.px]="node.x"
               [style.top.px]="node.y"
               [style.width.px]="nodeWidth"
               [style.height.px]="nodeHeight"
               (mousedown)="onNodeMouseDown($event, node)">
            
            <!-- Node Header -->
            <div class="px-4 py-2 border-b border-white/10 flex items-center justify-between rounded-t-2xl bg-white/5 backdrop-blur-md">
              <div class="flex items-center gap-2">
                <mat-icon class="text-sm" 
                          [class.text-yellow-400]="node.type === 'input'"
                          [class.text-blue-400]="node.type === 'generate'"
                          [class.text-green-400]="node.type === 'output'"
                          [class.text-purple-400]="node.type === 'transform'"
                          [class.text-red-400]="node.type === 'filter'"
                          [class.text-orange-400]="node.type === 'condition'"
                          [class.text-cyan-400]="node.type === 'delay'"
                          [class.text-amber-400]="node.type === 'file-input'">
                  {{ getNodeIcon(node.type) }}
                </mat-icon>
                <span class="font-medium text-sm text-white/90">{{ node.label }}</span>
              </div>
              <button class="text-white/40 hover:text-red-400 transition-colors" (click)="deleteNode(node.id, $event)">
                <mat-icon class="text-sm">close</mat-icon>
              </button>
            </div>

            <!-- Node Body -->
            <div class="p-4 text-xs text-white/70 h-full overflow-hidden bg-black/10">
              @if (node.type === 'input') {
                <div class="truncate opacity-80">{{ node.value || 'Empty input' }}</div>
              } @else if (node.type === 'generate') {
                <div class="truncate italic opacity-80">{{ node.prompt || 'No prompt' }}</div>
              } @else if (node.type === 'file-input') {
                <div class="space-y-1">
                  <div class="text-[10px] text-white/40 uppercase tracking-widest">Files ({{ node.files?.length || 0 }})</div>
                  @for (file of node.files?.slice(0, 2); track file.name) {
                    <div class="truncate text-[10px] flex items-center gap-1">
                      <mat-icon class="text-[10px] h-3 w-3">insert_drive_file</mat-icon>
                      {{ file.name }}
                    </div>
                  }
                  @if ((node.files?.length || 0) > 2) {
                    <div class="text-[8px] text-white/30 italic">+ {{ (node.files?.length || 0) - 2 }} more</div>
                  }
                </div>
              } @else if (node.type === 'transform') {
                <div class="truncate opacity-80">Format: {{ node.config?.['format'] || 'default' }}</div>
              } @else {
                <div class="text-white/30 italic">Awaiting execution...</div>
              }
            </div>

            <!-- Connection Ports -->
            @if (node.type !== 'input') {
              <div class="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/10 border-2 border-white/30 cursor-crosshair hover:bg-indigo-400/50 hover:border-indigo-400 transition-colors backdrop-blur-sm"
                   (mousedown)="onPortMouseDown($event, node.id, 'in')"
                   (mouseup)="onPortMouseUp($event, node.id, 'in')"></div>
            }
            @if (node.type !== 'output') {
              <div class="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/10 border-2 border-white/30 cursor-crosshair hover:bg-indigo-400/50 hover:border-indigo-400 transition-colors backdrop-blur-sm"
                   (mousedown)="onPortMouseDown($event, node.id, 'out')"
                   (mouseup)="onPortMouseUp($event, node.id, 'out')"></div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class CanvasComponent {
  workflow = inject(WorkflowService);
  el = inject(ElementRef);

  nodes = this.workflow.nodes;
  edges = this.workflow.edges;
  selectedNodeId = this.workflow.selectedNodeId;
  zoom = this.workflow.zoom;
  pan = this.workflow.pan;
  nodeWidth = 240;
  nodeHeight = 120;

  draggingNode = signal<string | null>(null);
  dragOffset = signal<{x: number, y: number}>({x: 0, y: 0});

  isConnecting = signal(false);
  connectionStart = signal<{nodeId: string, type: 'in' | 'out'} | null>(null);
  currentMousePos = signal<{x: number, y: number} | null>(null);

  getNodeIcon(type: string): string {
    switch (type) {
      case 'input': return 'input';
      case 'generate': return 'auto_awesome';
      case 'output': return 'output';
      case 'transform': return 'transform';
      case 'filter': return 'filter_alt';
      case 'condition': return 'alt_route';
      case 'delay': return 'timer';
      case 'file-input': return 'upload_file';
      case 'validation-loop': return 'alt_route';
      case 'data-stream': return 'rss_feed';
      default: return 'help';
    }
  }

  onCanvasMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('bg-transparent') || target.tagName === 'svg' || target.tagName === 'path') {
      this.workflow.selectNode(null);
    }
  }

  onNodeMouseDown(event: MouseEvent, node: WorkflowNode) {
    const target = event.target as HTMLElement;
    if (target.closest('.cursor-crosshair') || target.closest('button')) {
      return;
    }
    
    event.stopPropagation();
    this.workflow.selectNode(node.id);
    this.draggingNode.set(node.id);
    
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.dragOffset.set({
      x: (event.clientX - rect.left) / this.zoom(),
      y: (event.clientY - rect.top) / this.zoom()
    });
  }

  onPortMouseDown(event: MouseEvent, nodeId: string, type: 'in' | 'out') {
    event.stopPropagation();
    this.isConnecting.set(true);
    this.connectionStart.set({ nodeId, type });
    this.updateMousePos(event);
  }

  onPortMouseUp(event: MouseEvent, nodeId: string, type: 'in' | 'out') {
    event.stopPropagation();
    if (this.isConnecting() && this.connectionStart()) {
      const start = this.connectionStart()!;
      if (start.nodeId !== nodeId && start.type !== type) {
        const source = start.type === 'out' ? start.nodeId : nodeId;
        const target = start.type === 'in' ? start.nodeId : nodeId;
        this.workflow.addEdge(source, target);
      }
    }
    this.resetConnection();
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.draggingNode()) {
      const canvasRect = this.el.nativeElement.getBoundingClientRect();
      const x = (event.clientX - canvasRect.left) / this.zoom() - this.pan().x - this.dragOffset().x;
      const y = (event.clientY - canvasRect.top) / this.zoom() - this.pan().y - this.dragOffset().y;
      
      this.workflow.updateNode(this.draggingNode()!, { x, y });
    } else if (this.isConnecting()) {
      this.updateMousePos(event);
    }
  }

  @HostListener('window:mouseup')
  onMouseUp() {
    if (this.draggingNode()) {
      this.draggingNode.set(null);
    } else if (this.isConnecting()) {
      this.resetConnection();
    }
  }

  resetConnection() {
    this.isConnecting.set(false);
    this.connectionStart.set(null);
    this.currentMousePos.set(null);
  }

  updateMousePos(event: MouseEvent) {
    const canvasRect = this.el.nativeElement.getBoundingClientRect();
    this.currentMousePos.set({
      x: (event.clientX - canvasRect.left) / this.zoom() - this.pan().x,
      y: (event.clientY - canvasRect.top) / this.zoom() - this.pan().y
    });
  }

  deleteNode(id: string, event: MouseEvent) {
    event.stopPropagation();
    this.workflow.deleteNode(id);
  }

  getNodeCenter(nodeId: string, portType: 'in' | 'out'): {x: number, y: number} {
    const node = this.nodes().find(n => n.id === nodeId);
    if (!node) return {x: 0, y: 0};
    
    const x = portType === 'in' ? node.x : node.x + this.nodeWidth;
    const y = node.y + (this.nodeHeight / 2);
    return {x, y};
  }

  getEdgePath(edge: WorkflowEdge): string {
    const source = this.getNodeCenter(edge.source, 'out');
    const target = this.getNodeCenter(edge.target, 'in');
    return this.createBezierPath(source, target);
  }

  getTempEdgePath(): string {
    if (!this.connectionStart() || !this.currentMousePos()) return '';
    
    const start = this.connectionStart()!;
    const pos1 = this.getNodeCenter(start.nodeId, start.type);
    const pos2 = this.currentMousePos()!;
    
    if (start.type === 'out') {
      return this.createBezierPath(pos1, pos2);
    } else {
      return this.createBezierPath(pos2, pos1);
    }
  }

  createBezierPath(p1: {x: number, y: number}, p2: {x: number, y: number}): string {
    const dx = Math.abs(p2.x - p1.x) * 0.5;
    return `M ${p1.x} ${p1.y} C ${p1.x + dx} ${p1.y}, ${p2.x - dx} ${p2.y}, ${p2.x} ${p2.y}`;
  }
}
