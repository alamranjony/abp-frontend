import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { SharedModule } from '../../shared.module';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './back-button.component.html',
  styleUrl: './back-button.component.scss',
})
export class BackButtonComponent {
  @Input() route: string;
  constructor(private router: Router) {}

  navigateBack() {
    if (this.route) this.router.navigate([this.route]);
  }
}
