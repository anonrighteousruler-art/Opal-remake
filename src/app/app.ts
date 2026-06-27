import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasComponent } from './canvas.component';
import { SidebarComponent } from './sidebar.component';
import { ConsoleComponent } from './console.component';
import { ToolbarComponent } from './toolbar.component';
import { ChatbotComponent } from './chatbot.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CanvasComponent, SidebarComponent, ConsoleComponent, ToolbarComponent, ChatbotComponent],
  template: `
    <div class="galactic-bg"></div>
    <div class="h-screen w-screen flex flex-col overflow-hidden font-sans relative z-10">
      <app-toolbar></app-toolbar>
      
      <div class="flex-1 flex overflow-hidden">
        <div class="flex-1 relative flex flex-col">
          <div class="flex-1 relative">
            <app-canvas></app-canvas>
          </div>
          <app-console></app-console>
        </div>
        
        <app-sidebar></app-sidebar>
      </div>
      <app-chatbot></app-chatbot>
    </div>
  `
})
export class App {}
