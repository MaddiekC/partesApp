import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject } from 'rxjs';

const TOKEN_KEY = 'token';

interface JwtPayload {
  UserId: number; // o usa el nombre real del campo con el username
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _isAuthenticated = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this._isAuthenticated.asObservable();
  private _token = '';

  constructor() {
    // cargar token en background
    this.loadToken();
  }

  private async loadToken() {
    try {
      const res = await Preferences.get({ key: TOKEN_KEY });
      const token = res.value ?? '';
      if (token && !this.isTokenExpired(token)) {
        this._token = token;
        this._isAuthenticated.next(true);
      } else {
        this._token = '';
        this._isAuthenticated.next(false);
      }
    } catch (err) {
      console.error('Error loading token', err);
      this._isAuthenticated.next(false);
    }
  }

  isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      const now = Math.floor(Date.now() / 1000);
      return decoded.exp <= now;
    } catch {
      return true;
    }
  }


  // getter sync (puede estar vacío si aún no cargó)
  get token(): string {
    return this._token;
  }

  // obtener token async (útil para interceptors)
  async getToken(): Promise<string | null> {
    if (this._token) return this._token;
    const res = await Preferences.get({ key: TOKEN_KEY });
    this._token = res.value ?? '';
    return this._token || null;
  }

  async getUserInfo(): Promise<any> {
    const token = await this.getToken();
    if (token) {
      const decoded = jwtDecode<JwtPayload>(token);
        //console.log(decoded)
        return decoded.UserId;
    }
    return null;
  }

  // guardar token tras login
  async setToken(token: string): Promise<void> {
    this._token = token;
    await Preferences.set({ key: TOKEN_KEY, value: token });
    this._isAuthenticated.next(true);
  }

  async removeToken(): Promise<void> {
    this._token = '';
    await Preferences.remove({ key: TOKEN_KEY });
    this._isAuthenticated.next(false);
  }
}
