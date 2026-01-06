import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonMenu, IonTitle, IonToolbar, IonItem } from '@ionic/angular/standalone';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  imports: [IonItem, IonContent, IonHeader, IonMenu, IonTitle, IonToolbar, RouterLink]
})
export class MenuComponent implements OnInit {

  constructor() { }

  ngOnInit() { }

}
