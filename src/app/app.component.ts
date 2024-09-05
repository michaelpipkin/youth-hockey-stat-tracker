import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, inject, OnInit, signal, Signal } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { User } from '@angular/fire/auth';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { FooterComponent } from '@components/footer/footer.component';
import { Program } from '@models/program';
import { ProgramService } from '@services/program.service';
import { UserService } from '@services/user.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    FooterComponent,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatMenuModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'Youth Hockey Tracker';

  userService = inject(UserService);
  programService = inject(ProgramService);
  router = inject(Router);
  analytics = inject(Analytics);
  breakpointObserver = inject(BreakpointObserver);

  isSmallScreen = signal<boolean>(false);

  user: Signal<User> = this.userService.user;
  isLoggedIn: Signal<boolean> = this.userService.isLoggedIn;
  activeProgram: Signal<Program> = this.programService.activeUserProgram;

  constructor() {
    logEvent(this.analytics, 'app_initalized');
  }

  ngOnInit(): void {
    this.breakpointObserver
      .observe('(max-width: 896px)')
      .subscribe((result) => {
        this.isSmallScreen.set(result.matches);
      });
  }

  logout(): void {
    this.userService.logout();
  }
}
