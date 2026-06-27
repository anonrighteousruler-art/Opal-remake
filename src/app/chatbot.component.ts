import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from './ai.service';
import { MatIconModule } from '@angular/material/icon';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="fixed bottom-4 right-4 z-50 transition-all duration-300" 
         [class.w-80]="isOpen()" 
         [class.w-14]="!isOpen()">
      
      <!-- Minimized State -->
      @if (!isOpen()) {
        <button (click)="isOpen.set(true)" 
                class="w-14 h-14 glass-panel rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg">
          <mat-icon>voice_chat</mat-icon>
        </button>
      }

      <!-- Expanded State -->
      @if (isOpen()) {
        <div class="glass-panel rounded-2xl flex flex-col shadow-2xl overflow-hidden border border-white/20">
          <div class="p-4 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-md">
            <h3 class="font-semibold text-white flex items-center gap-2">
              <mat-icon class="text-indigo-400">voice_chat</mat-icon>
              AI Assistant
            </h3>
            <button (click)="isOpen.set(false)" class="text-white/60 hover:text-white transition-colors">
              <mat-icon>keyboard_arrow_down</mat-icon>
            </button>
          </div>
          
          <div class="h-96 overflow-y-auto p-4 space-y-4 bg-black/20">
            @for (msg of messages(); track msg) {
              <div [class.text-right]="msg.role === 'user'">
                <div class="inline-block p-3 rounded-2xl text-sm max-w-[85%] break-words"
                     [class.bg-indigo-600/80]="msg.role === 'user'"
                     [class.text-white]="msg.role === 'user'"
                     [class.glass-card]="msg.role === 'ai'"
                     [class.text-white/90]="msg.role === 'ai'">
                  {{ msg.text }}
                </div>
              </div>
            }
          </div>

          <div class="p-4 border-t border-white/10 bg-white/5">
            <div class="flex gap-2">
              <input [(ngModel)]="userInput" 
                     (keyup.enter)="sendMessage()"
                     placeholder="Ask anything..."
                     class="flex-1 px-4 py-2 bg-white/10 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              <button (click)="sendMessage()" 
                      class="p-2 bg-indigo-600/80 text-white rounded-xl hover:bg-indigo-500 transition-colors flex items-center justify-center">
                <mat-icon>send</mat-icon>
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ChatbotComponent {
  ai = inject(AiService);
  isOpen = signal(true);
  messages = signal<Message[]>([]);
  userInput = '';

  async sendMessage() {
    if (!this.userInput.trim()) return;
    
    const userMsg = this.userInput;
    this.messages.update(m => [...m, { role: 'user', text: userMsg }]);
    this.userInput = '';

    try {
      const response = await this.ai.generateContent(userMsg, true);
      this.messages.update(m => [...m, { role: 'ai', text: response.text || 'No response.' }]);
    } catch {
      this.messages.update(m => [...m, { role: 'ai', text: 'Error: Could not get response.' }]);
    }
  }
}
