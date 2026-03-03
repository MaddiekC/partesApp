import { Component, OnDestroy, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { MenuComponent } from "./menu/menu.component";
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { NgIf } from '@angular/common';
import { DatabaseService } from './services/dataBase/database.service';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { SyncService } from './services/dataBase/sync.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, NgIf, IonRouterOutlet, MenuComponent],
})
export class AppComponent implements OnInit, OnDestroy {
  showMenu = true;
  private sub?: Subscription;

  constructor(private router: Router, private database: DatabaseService, private syncService: SyncService) { }

  async ngOnInit() {
    await this.database.inicializarDB();
    await this.syncService.sincronizacionInicial();
    await this.syncService.sincronizarPendientes();
    
    if (Capacitor.isNativePlatform()) {
      //StatusBar.setBackgroundColor({ color: '#2dd36f' });
      StatusBar.setStyle({ style: Style.Dark }); // Iconos de batería/hora en blanco
    }
    this.sub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const url = e.urlAfterRedirects ?? e.url;
        const hideOn = ['/login'];
        this.showMenu = !hideOn.includes(url);
      });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}

