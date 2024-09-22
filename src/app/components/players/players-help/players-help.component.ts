import { Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-players-help',
  standalone: true,
  imports: [MatIconModule, MatDialogModule],
  templateUrl: './players-help.component.html',
  styleUrl: './players-help.component.scss',
})
export class PlayersHelpComponent {}
