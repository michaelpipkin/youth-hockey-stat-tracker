import { Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-manage-users-help',
  standalone: true,
  imports: [MatIconModule, MatDialogModule],
  templateUrl: './manage-users-help.component.html',
  styleUrl: './manage-users-help.component.scss',
})
export class ManageUsersHelpComponent {}
