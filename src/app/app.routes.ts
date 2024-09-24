import { Routes } from '@angular/router';
import { approvedGuard } from '@components/auth/approved.guard';
import { directorGuard } from '@components/auth/director.guard';
import { LoginComponent } from '@components/auth/login/login.component';
import { ManageUsersComponent } from '@components/auth/manage-users/manage-users.component';
import { ProfileComponent } from '@components/auth/profile/profile.component';
import { programGuard } from '@components/auth/program.guard';
import { EvaluationsComponent } from '@components/evaluations/evaluations/evaluations.component';
import { PlayersComponent } from '@components/players/players/players.component';
import { ProgramsComponent } from '@components/programs/programs/programs.component';
import { TeamsComponent } from '@components/teams/teams/teams.component';
import { ToolsComponent } from '@components/tools/tools/tools.component';
import {
  canActivate,
  redirectLoggedInTo,
  redirectUnauthorizedTo,
} from '@angular/fire/auth-guard';

const authGuard = () => redirectUnauthorizedTo(['login']);
const loggedInGuard = () => redirectLoggedInTo(['profile']);

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/programs' },
  {
    path: 'login',
    title: 'Login',
    component: LoginComponent,
    ...canActivate(loggedInGuard),
  },
  {
    path: 'profile',
    title: 'Profile',
    component: ProfileComponent,
    ...canActivate(authGuard),
  },
  {
    path: 'programs',
    title: 'Programs',
    component: ProgramsComponent,
    ...canActivate(authGuard),
    canActivate: [approvedGuard],
  },
  {
    path: 'players',
    title: 'Players',
    component: PlayersComponent,
    ...canActivate(authGuard),
    canActivate: [programGuard, approvedGuard],
  },
  {
    path: 'teams',
    title: 'Teams',
    component: TeamsComponent,
    ...canActivate(authGuard),
    canActivate: [programGuard, approvedGuard],
  },
  {
    path: 'evaluations',
    title: 'Evaluations',
    component: EvaluationsComponent,
    ...canActivate(authGuard),
    canActivate: [programGuard, approvedGuard],
  },
  {
    path: 'tools',
    title: 'Tools',
    component: ToolsComponent,
    ...canActivate(authGuard),
    canActivate: [programGuard, approvedGuard],
  },
  {
    path: 'users',
    title: 'Manage Users',
    component: ManageUsersComponent,
    ...canActivate(authGuard),
    canActivate: [directorGuard, approvedGuard],
  },

  { path: '**', redirectTo: '/programs' },
];
