import { Analytics } from '@angular/fire/analytics';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Program } from '@models/program';
import { AppUser } from '@models/user';
import { ProgramService } from '@services/program.service';
import { SortingService } from '@services/sorting.service';
import { UserService } from '@services/user.service';
import { UserType } from '@shared/enums';
import { LoadingService } from '@shared/loading/loading.service';
import { ManageUsersHelpComponent } from './manage-users-help/manage-users-help.component';
import {
  MatSlideToggleChange,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import {
  Component,
  computed,
  inject,
  model,
  signal,
  Signal,
} from '@angular/core';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatOptionModule,
    MatTooltipModule,
  ],
  templateUrl: './manage-users.component.html',
  styleUrl: './manage-users.component.scss',
})
export class ManageUsersComponent {
  programService = inject(ProgramService);
  userService = inject(UserService);
  loading = inject(LoadingService);
  snackBar = inject(MatSnackBar);
  dialog = inject(MatDialog);
  sorter = inject(SortingService);
  analytics = inject(Analytics);

  currentProgram: Signal<Program> = this.programService.activeUserProgram;
  userList: Signal<AppUser[]> = this.userService.userList;

  sortField = signal<string>('lastFirstName');
  sortAsc = signal<boolean>(true);

  nameFilter = model<string>('');
  approvedOnly = model<boolean>(false);

  filteredUsers = computed(
    (
      nameFilter: string = this.nameFilter(),
      approvedOnly: boolean = this.approvedOnly()
    ) => {
      let users = this.userList().filter((user) => {
        return (
          (!nameFilter ||
            user.displayName
              .toLowerCase()
              .includes(nameFilter.toLowerCase())) &&
          (!approvedOnly || user.approved)
        );
      });
      if (users.length > 0) {
        users = this.sorter.sort(users, this.sortField(), this.sortAsc());
      }
      return users;
    }
  );

  roleOptions = Object.values(UserType);

  constructor() {
    this.userService.getAllUsers();
  }

  sortUsers(e: { active: string; direction: string }): void {
    this.sortField.set(e.active);
    this.sortAsc.set(e.direction == 'asc');
  }

  toggleApproved(user: AppUser, e: MatSlideToggleChange) {
    const approved = e.checked;
    this.loading.loadingOn();
    this.userService
      .updateUser(user.id, { approved })
      .then(() => {
        this.snackBar.open(
          `${user.displayName} ${approved ? 'approved' : 'unapproved'}`,
          'Close'
        );
      })
      .catch((err: Error) => {
        this.snackBar.open(`Error updating user: ${err.message}`, 'Close');
        this.userService.getAllUsers();
      })
      .finally(() => {
        this.loading.loadingOff();
      });
  }

  updateRole(user: AppUser, e: MatSelectChange): void {
    const role = e.value;
    this.loading.loadingOn();
    this.userService
      .updateUser(user.id, { userType: role })
      .then(() => {
        this.snackBar.open(`${user.displayName} role updated`, 'Close');
        if (user.id === this.userService.user().id && role !== UserType.D) {
          this.userService.logout();
        }
      })
      .catch((err: Error) => {
        this.snackBar.open(`Error updating user: ${err.message}`, 'Close');
        this.userService.getAllUsers();
      })
      .finally(() => {
        this.loading.loadingOff();
      });
  }

  showHelp(): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      maxWidth: '80vw',
    };
    this.dialog.open(ManageUsersHelpComponent, dialogConfig);
  }
}
