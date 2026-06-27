import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkflowService, NodeType } from './workflow.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="h-16 glass-panel border-b border-white/10 flex items-center justify-between px-6 shadow-xl z-30">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-inner">
            <mat-icon class="text-white text-lg">account_tree</mat-icon>
          </div>
          <h1 class="text-xl font-bold text-white tracking-tight">Opal Clone MVP</h1>
        </div>
        <div class="h-6 w-px bg-white/10 mx-2"></div>
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-[600px]">
          <button class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition-all border border-transparent hover:border-white/20"
                  (click)="addNode('input')">
            <mat-icon class="text-sm text-yellow-400">input</mat-icon>
            Input
          </button>
          <button class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition-all border border-transparent hover:border-white/20"
                  (click)="addNode('generate')">
            <mat-icon class="text-sm text-blue-400">auto_awesome</mat-icon>
            Generate
          </button>
          <button class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition-all border border-transparent hover:border-white/20"
                  (click)="addNode('transform')">
            <mat-icon class="text-sm text-purple-400">transform</mat-icon>
            Transform
          </button>
          <button class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition-all border border-transparent hover:border-white/20"
                  (click)="addNode('filter')">
            <mat-icon class="text-sm text-red-400">filter_alt</mat-icon>
            Filter
          </button>
          <button class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition-all border border-transparent hover:border-white/20"
                  (click)="addNode('file-input')">
            <mat-icon class="text-sm text-amber-400">upload_file</mat-icon>
            File Input
          </button>
          <button class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition-all border border-transparent hover:border-white/20"
                  (click)="addNode('validation-loop')">
            <mat-icon class="text-sm text-orange-400">alt_route</mat-icon>
            Validation Loop
          </button>
          <button class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition-all border border-transparent hover:border-white/20"
                  (click)="addNode('data-stream')">
            <mat-icon class="text-sm text-indigo-400">rss_feed</mat-icon>
            Data Stream
          </button>
          <button class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition-all border border-transparent hover:border-white/20"
                  (click)="addNode('output')">
            <mat-icon class="text-sm text-green-400">output</mat-icon>
            Output
          </button>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <div class="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
          <button class="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white" (click)="zoomOut()">
            <mat-icon class="text-sm">zoom_out</mat-icon>
          </button>
          <button class="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white" (click)="resetView()">
            <mat-icon class="text-sm">filter_center_focus</mat-icon>
          </button>
          <button class="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white" (click)="zoomIn()">
            <mat-icon class="text-sm">zoom_in</mat-icon>
          </button>
        </div>
        <button class="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-indigo-500/20 transition-all"
                (click)="runWorkflow()">
          <mat-icon class="text-sm">play_arrow</mat-icon>
          Run
        </button>
      </div>
    </div>
  `
})
export class ToolbarComponent {
  workflow = inject(WorkflowService);

  addNode(type: NodeType) {
    // Add node roughly in the center of the viewport
    const x = window.innerWidth / 2 - 100 + (Math.random() * 50 - 25);
    const y = window.innerHeight / 2 - 100 + (Math.random() * 50 - 25);
    this.workflow.addNode(type, x, y);
  }

  runWorkflow() {
    this.workflow.runWorkflow();
  }

  zoomIn() {
    this.workflow.zoom.update(z => Math.min(z + 0.1, 2));
  }

  zoomOut() {
    this.workflow.zoom.update(z => Math.max(z - 0.1, 0.5));
  }

  resetView() {
    this.workflow.zoom.set(1);
    this.workflow.pan.set({ x: 0, y: 0 });
  }
}
