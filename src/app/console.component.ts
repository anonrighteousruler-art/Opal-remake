import { Component, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkflowService } from './workflow.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-console',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="h-64 w-full glass-panel border-t border-white/10 flex flex-col shadow-2xl font-mono text-sm z-20">
      <div class="px-4 py-2 border-b border-white/10 bg-white/5 flex items-center justify-between backdrop-blur-md">
        <div class="flex items-center gap-2">
          <mat-icon class="text-white/40 text-sm">terminal</mat-icon>
          <h2 class="font-bold text-white/60 text-[10px] uppercase tracking-[0.2em]">Execution Console</h2>
        </div>
        <button class="text-white/30 hover:text-white transition-colors text-[10px] uppercase tracking-widest font-bold" (click)="clearLogs()">
          Clear
        </button>
      </div>

      <div class="p-4 flex-1 overflow-y-auto space-y-2 bg-black/30" #scrollContainer>
        @for (log of logs(); track log.timestamp) {
          <div class="flex items-start gap-3 border-l-2 pl-3"
               [class.border-blue-500/50]="log.type === 'info'"
               [class.border-emerald-500/50]="log.type === 'success'"
               [class.border-rose-500/50]="log.type === 'error'"
               [class.border-amber-500/50]="log.type === 'thinking'">
            <span class="text-white/20 text-[10px] whitespace-nowrap mt-0.5">[{{ log.timestamp | date:'HH:mm:ss.SSS' }}]</span>
            
            @if (log.type === 'info') {
              <span class="text-blue-400/80 break-words flex-1">{{ log.message }}</span>
            } @else if (log.type === 'success') {
              <span class="text-emerald-400/80 break-words flex-1 font-semibold">{{ log.message }}</span>
            } @else if (log.type === 'error') {
              <span class="text-rose-400/80 break-words flex-1">{{ log.message }}</span>
            } @else if (log.type === 'thinking') {
              <span class="text-amber-400/80 break-words flex-1 italic animate-pulse">{{ log.message }}</span>
            }
          </div>
        }
        @if (logs().length === 0) {
          <div class="text-white/20 italic text-xs">No logs to display. Run the workflow to see output.</div>
        }
      </div>
    </div>
  `
})
export class ConsoleComponent implements AfterViewChecked {
  workflow = inject(WorkflowService);
  logs = this.workflow.logs;
  
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch { 
      // Ignore errors when scrolling
    }
  }

  clearLogs() {
    this.workflow.clearLogs();
  }
}
