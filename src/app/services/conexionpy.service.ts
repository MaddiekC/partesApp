import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';


export interface LoginDto {
  login: string;
  passw: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConexionpyService {
  private baseUrl = environment.apiUrl; // e.g. "https://localhost:7003"

  constructor(private httpClient: HttpClient) { }

  loginUser(loginObj: LoginDto): Observable<any> {
    return this.httpClient.post<any>(`${this.baseUrl}/AdMusuas/login`, loginObj);
  }
  getHaciendas(): Observable<any> {
    return this.httpClient.get<any>(`${this.baseUrl}/RhMhacis`);
  }
  getLotes(): Observable<any> {
    return this.httpClient.get<any>(`${this.baseUrl}/RhMlotes`);
  }

  getUnidadMedida(): Observable<any> {
    return this.httpClient.get<any>(`${this.baseUrl}/UnidadMedidas`);
  }

  getLabor(): Observable<any> {
    return this.httpClient.get<any>(`${this.baseUrl}/Labors`);
  }

  getEmpleado(): Observable<any> {
    return this.httpClient.get<any>(`${this.baseUrl}/RhMtrabs`);
  }

  // getAsistencia(): Observable<any> {
  //   return this.httpClient.get<any>(`${this.baseUrl}/DetAsistencias`);
  // }

  getTrabajadoresAsistencia(fecha: string) {
    // fecha debe ir en formato YYYY-MM-DD
    return this.httpClient.get<any[]>(`${this.baseUrl}/RhMtrabs/${fecha}`);
  }

  //-----Cabecera
  getCabecera(secParte: number): Observable<any> {
    return this.httpClient.get<any>(`${this.baseUrl}/TranCpartes/${secParte}`);
  }

  cabPartes(page: number): Observable<any> {
    const params = {
      page: page.toString(),
      //pageSize: pageSize.toString()
    };
    return this.httpClient.get<any>(`${this.baseUrl}/TranCpartes/mine`, { params });
  }
  
  postCabPartes(cabPartes: any): Observable<any> {
    return this.httpClient.post<any>(`${this.baseUrl}/TranCpartes`, cabPartes);
  }

  //-----Detalles
  getParteDetalle(secParte: number): Observable<any> {
    return this.httpClient.get<any>(`${this.baseUrl}/TranDpartes/${secParte}`);
  }
  guardarDetalles(payload: any): Observable<any> {
    return this.httpClient.post<any>(`${this.baseUrl}/TranDpartes`, payload);
  }
}