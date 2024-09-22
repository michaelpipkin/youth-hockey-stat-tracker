import { Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-programs-help',
  standalone: true,
  imports: [MatIconModule, MatDialogModule],
  templateUrl: './programs-help.component.html',
  styleUrl: './programs-help.component.scss',
})
export class ProgramsHelpComponent {}
