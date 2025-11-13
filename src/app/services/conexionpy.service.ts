import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ConexionpyService {
  constructor(private httpClient: HttpClient) {}

  loginUser(user: any): Observable<any> {
    return this.httpClient.post<any>(`http://localhost:8080/token`, user);
  }
}
