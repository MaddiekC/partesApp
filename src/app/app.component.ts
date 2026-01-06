import { Component, OnDestroy, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { MenuComponent } from "./menu/menu.component";
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { NgIf } from '@angular/common';
import { DatabaseService } from './services/dataBase/database.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, NgIf, IonRouterOutlet, MenuComponent],
})
export class AppComponent implements OnInit, OnDestroy {
  showMenu = true;
  private sub?: Subscription;

  constructor(private router: Router, private database: DatabaseService) { }

  ngOnInit() {
    this.initApp();
    // cada vez que cambie la ruta, ocultamos el menu si estamos en /login
    this.sub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const url = e.urlAfterRedirects ?? e.url;
        // lista de rutas donde NO queremos mostrar el menú
        const hideOn = ['/login']; // si tu login es ruta '' o '/login' ajusta aquí
        // también podrías usar startsWith para rutas como '/auth/login'
        this.showMenu = !hideOn.includes(url);
      });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  async initApp() {
    await this.database.inicializarDB();
    console.log('Base de datos SQLite lista');
  }
}

