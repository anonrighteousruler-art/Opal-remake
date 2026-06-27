import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkflowService, WorkflowNode } from './workflow.service';
import { MatIconModule } from '@angular/material/icon';
import JSZip from 'jszip';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="w-80 h-full glass-panel border-l border-white/10 flex flex-col shadow-2xl z-20 overflow-hidden">
      <div class="p-4 border-b border-white/10 bg-white/5 flex items-center gap-2">
        <mat-icon class="text-white/50">tune</mat-icon>
        <h2 class="font-semibold text-white/90">Properties</h2>
      </div>

      <div class="p-4 flex-1 overflow-y-auto">
        @if (selectedNode()) {
          <div class="space-y-6">
            
            <!-- Node Type Badge -->
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded-md border"
                    [class.bg-yellow-400/10]="selectedNode()?.type === 'input'"
                    [class.text-yellow-400]="selectedNode()?.type === 'input'"
                    [class.border-yellow-400/20]="selectedNode()?.type === 'input'"
                    [class.bg-blue-400/10]="selectedNode()?.type === 'generate'"
                    [class.text-blue-400]="selectedNode()?.type === 'generate'"
                    [class.border-blue-400/20]="selectedNode()?.type === 'generate'"
                    [class.bg-green-400/10]="selectedNode()?.type === 'output'"
                    [class.text-green-400]="selectedNode()?.type === 'output'"
                    [class.border-green-400/20]="selectedNode()?.type === 'output'"
                    [class.bg-purple-400/10]="selectedNode()?.type === 'transform'"
                    [class.text-purple-400]="selectedNode()?.type === 'transform'"
                    [class.border-purple-400/20]="selectedNode()?.type === 'transform'"
                    [class.bg-amber-400/10]="selectedNode()?.type === 'file-input'"
                    [class.text-amber-400]="selectedNode()?.type === 'file-input'"
                    [class.border-amber-400/20]="selectedNode()?.type === 'file-input'">
                {{ selectedNode()?.type }} NODE
              </span>
              <span class="text-[10px] text-white/30 font-mono">{{ selectedNode()?.id }}</span>
            </div>

            <!-- Common Properties -->
            <div class="space-y-2">
              <label for="nodeLabel" class="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Label</label>
              <input id="nodeLabel" type="text" 
                     [ngModel]="selectedNode()?.label" 
                     (ngModelChange)="updateNode({label: $event})"
                     class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" />
            </div>

            <!-- Type-specific Properties -->
            @if (selectedNode()?.type === 'input') {
              <div class="space-y-2">
                <label for="nodeValue" class="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Input Value</label>
                <textarea id="nodeValue" [ngModel]="selectedNode()?.value" 
                          (ngModelChange)="updateNode({value: $event})"
                          rows="4"
                          placeholder="Enter user input here..."
                          class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"></textarea>
              </div>
            }

            @if (selectedNode()?.type === 'file-input') {
              <div class="space-y-4">
                <label for="fileInput" class="block text-[10px] font-bold text-white/40 uppercase tracking-widest">File Upload (ZIP supported)</label>
                
                <div class="relative group">
                  <div class="w-full h-32 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-white/10 hover:border-amber-400/50 transition-all cursor-pointer overflow-hidden focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                       tabindex="0"
                       (dragover)="$event.preventDefault(); isDragging.set(true)"
                       (dragleave)="isDragging.set(false)"
                       (drop)="onFileDrop($event)"
                       (click)="fileInput.click()"
                       (keydown.enter)="fileInput.click()"
                       (keydown.space)="fileInput.click()">
                    
                    @if (isProcessing()) {
                      <mat-icon class="text-amber-400 animate-spin">sync</mat-icon>
                      <span class="text-[10px] text-amber-400 font-bold uppercase tracking-widest">Extracting...</span>
                    } @else {
                      <mat-icon class="text-white/30 group-hover:text-amber-400 transition-colors">cloud_upload</mat-icon>
                      <span class="text-[10px] text-white/40 font-bold uppercase tracking-widest group-hover:text-white/60 transition-colors">Click or Drag & Drop</span>
                    }
                  </div>
                  <input #fileInput id="fileInput" type="file" class="hidden" (change)="onFileSelect($event)" multiple />
                </div>

                @if (selectedNode()?.files?.length) {
                  <div class="space-y-2">
                    <div class="flex items-center justify-between">
                      <h3 class="text-[10px] font-bold text-white/40 uppercase tracking-widest">Uploaded Files</h3>
                      <button (click)="clearFiles()" class="text-[10px] text-rose-400 hover:text-rose-300 font-bold uppercase tracking-widest">Clear All</button>
                    </div>
                    <div class="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      @for (file of selectedNode()?.files; track file.name) {
                        <div class="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5 group">
                          <div class="flex items-center gap-2 truncate">
                            <mat-icon class="text-xs text-white/30">insert_drive_file</mat-icon>
                            <span class="text-xs text-white/70 truncate">{{ file.name }}</span>
                          </div>
                          <button (click)="removeFile(file.name)" class="opacity-0 group-hover:opacity-100 text-white/30 hover:text-rose-400 transition-all">
                            <mat-icon class="text-sm">delete</mat-icon>
                          </button>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }

            @if (selectedNode()?.type === 'generate') {
              <div class="space-y-2">
                <label for="nodePrompt" class="block text-[10px] font-bold text-white/40 uppercase tracking-widest">System Prompt</label>
                <textarea id="nodePrompt" [ngModel]="selectedNode()?.prompt" 
                          (ngModelChange)="updateNode({prompt: $event})"
                          rows="6"
                          placeholder="e.g., Translate to French: {{ '{' }}{{ '{' }}input{{ '}' }}{{ '}' }}"
                          class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none font-mono text-xs"></textarea>
                <p class="text-[10px] text-white/30 mt-1 italic">Use <code class="bg-white/5 px-1 rounded text-indigo-400">{{ '{' }}{{ '{' }}input{{ '}' }}{{ '}' }}</code> for references.</p>
              </div>
            }

            @if (selectedNode()?.type === 'validation-loop') {
              <div class="space-y-2">
                <label for="nodePrompt" class="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Validation Prompt</label>
                <textarea id="nodePrompt" [ngModel]="selectedNode()?.prompt" 
                          (ngModelChange)="updateNode({prompt: $event})"
                          rows="4"
                          placeholder="e.g., Is this output valid? Respond 'valid' or 'invalid'."
                          class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none font-mono text-xs"></textarea>
                <label for="targetNodeId" class="block text-[10px] font-bold text-white/40 uppercase tracking-widest mt-4">Re-route to Node ID</label>
                <input id="targetNodeId" type="text" 
                       [ngModel]="selectedNode()?.config?.['targetNodeId']" 
                       (ngModelChange)="updateNode({config: {targetNodeId: $event}})"
                       class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" />
              </div>
            }

            @if (selectedNode()?.type === 'data-stream') {
              <div class="space-y-2">
                <label for="nodeUrl" class="block text-[10px] font-bold text-white/40 uppercase tracking-widest">API URL</label>
                <input id="nodeUrl" type="text" 
                       [ngModel]="selectedNode()?.config?.['url']" 
                       (ngModelChange)="updateNode({config: {url: $event}})"
                       class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" />
              </div>
            }

            @if (selectedNode()?.type === 'transform') {
              <div class="space-y-2">
                <label for="nodeFormat" class="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Format</label>
                <select id="nodeFormat" [ngModel]="selectedNode()?.config?.['format']" 
                        (ngModelChange)="updateNode({config: {format: $event}})"
                        class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all">
                  <option value="uppercase">UPPERCASE</option>
                  <option value="lowercase">lowercase</option>
                  <option value="capitalize">Capitalize</option>
                </select>
              </div>
            }

            @if (selectedNode()?.type === 'output') {
              <div class="p-4 glass-card">
                <p class="text-xs text-white/50 leading-relaxed">This node displays the final result of your workflow execution.</p>
              </div>
            }
          </div>
        } @else {
          <div class="h-full flex flex-col items-center justify-center text-white/20 space-y-4">
            <mat-icon class="text-5xl">touch_app</mat-icon>
            <p class="text-xs text-center uppercase tracking-widest font-bold">Select a node</p>
          </div>
        }
      </div>
    </div>
  `
})
export class SidebarComponent {
  workflow = inject(WorkflowService);
  selectedNode = this.workflow.selectedNode;
  isDragging = signal(false);
  isProcessing = signal(false);

  updateNode(updates: Partial<WorkflowNode>) {
    const node = this.selectedNode();
    if (node) {
      this.workflow.updateNode(node.id, updates);
    }
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files) {
      this.processFiles(Array.from(files));
    }
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.processFiles(Array.from(input.files));
    }
  }

  async processFiles(files: File[]) {
    this.isProcessing.set(true);
    const processedFiles: { name: string; content: string; type: string }[] = [...(this.selectedNode()?.files || [])];

    for (const file of files) {
      if (file.name.endsWith('.zip')) {
        try {
          const zip = new JSZip();
          const contents = await zip.loadAsync(file);
          for (const [path, zipEntry] of Object.entries(contents.files)) {
            if (!zipEntry.dir) {
              const content = await zipEntry.async('string');
              processedFiles.push({
                name: `${file.name}/${path}`,
                content,
                type: 'text/plain'
              });
            }
          }
        } catch (e) {
          console.error('Error extracting ZIP:', e);
        }
      } else {
        const content = await file.text();
        processedFiles.push({
          name: file.name,
          content,
          type: file.type
        });
      }
    }

    this.updateNode({ files: processedFiles });
    this.isProcessing.set(false);
  }

  removeFile(fileName: string) {
    const currentFiles = this.selectedNode()?.files || [];
    this.updateNode({ files: currentFiles.filter(f => f.name !== fileName) });
  }

  clearFiles() {
    this.updateNode({ files: [] });
  }
}
