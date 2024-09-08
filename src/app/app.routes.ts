import { Routes } from '@angular/router';
import { LoginComponent } from '@components/auth/login/login.component';
import { ProfileComponent } from '@components/auth/profile/profile.component';
import { PlayersComponent } from '@components/players/players/players.component';
import { ProgramsComponent } from '@components/programs/programs/programs.component';
import { TeamsComponent } from '@components/teams/teams/teams.component';
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
  },
  {
    path: 'players',
    title: 'Players',
    component: PlayersComponent,
    ...canActivate(authGuard),
  },
  {
    path: 'teams',
    title: 'Teams',
    component: TeamsComponent,
    ...canActivate(authGuard),
  },
  { path: '**', redirectTo: '/programs' },
];
