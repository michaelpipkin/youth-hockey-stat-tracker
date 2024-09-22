import { Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-teams-help',
  standalone: true,
  imports: [MatIconModule, MatDialogModule],
  templateUrl: './teams-help.component.html',
  styleUrl: './teams-help.component.scss',
})
export class TeamsHelpComponent {}
