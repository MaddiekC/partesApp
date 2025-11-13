// auth-guard.service.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    const token = await this.auth.getToken();
    const ok = !!token && !this.auth.isTokenExpired(token);
    if (!ok) {
      this.router.navigate(['/login']);
    }
    return ok;
  }
}
