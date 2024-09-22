import { Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-evaluations-help',
  standalone: true,
  imports: [MatIconModule, MatDialogModule],
  templateUrl: './evaluations-help.component.html',
  styleUrl: './evaluations-help.component.scss',
})
export class EvaluationsHelpComponent {}
