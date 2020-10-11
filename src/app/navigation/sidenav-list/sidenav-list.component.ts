import {Component, OnInit, Output, EventEmitter, OnDestroy} from '@angular/core';
import {AuthService} from '../../auth/auth.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-sidenav-list',
  templateUrl: './sidenav-list.component.html',
  styleUrls: ['./sidenav-list.component.css']
})
export class SidenavListComponent implements OnInit, OnDestroy {
  @Output() closeSidenav = new EventEmitter<void>();
  isAuth = false;
  authSubscription: Subscription;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.authSubscription = this.authService.authChange.subscribe(authStatus => {
      this.isAuth = authStatus;
    });
  }

  onClose(): void {
    this.closeSidenav.emit();
  }
  onLogout(){
    this.onClose();
    this.authService.logout();
  }
  // tslint:disable-next-line:typedef
  ngOnDestroy() {
    this.authSubscription.unsubscribe();
  }
}
