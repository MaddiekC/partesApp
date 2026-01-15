import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonMenu, IonTitle, IonToolbar, IonItem, IonIcon } from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  imports: [IonIcon, IonItem, IonContent, IonHeader, IonMenu, IonTitle, IonToolbar, RouterLink]
})
export class MenuComponent implements OnInit {

  constructor(private alertCtrl: AlertController, private authService: AuthService, private router: Router) {addIcons({ logOutOutline }); }

  ngOnInit() { }
  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que deseas salir de la aplicación?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salir',
          role: 'destructive',
          handler: async () => {
            await this.authService.removeToken();
            this.router.navigateByUrl('/login', { replaceUrl: true });
          }
        }
      ]
    });

    await alert.present();
  }
}
