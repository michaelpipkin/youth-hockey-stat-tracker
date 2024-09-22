import { Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-tools-help',
  standalone: true,
  imports: [MatIconModule, MatDialogModule],
  templateUrl: './tools-help.component.html',
  styleUrl: './tools-help.component.scss',
})
export class ToolsHelpComponent {}
