import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonItem, IonLabel, IonNote, IonButton } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ConexionpyService } from '../services/conexionpy.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonButton, IonNote, IonLabel, IonItem, IonContent, CommonModule, FormsModule]
})
export class LoginPage {
  loginObj: Login;
  constructor(private usuario: ConexionpyService, private router: Router) {
    this.loginObj = new Login();
  }
  onLogin() {
    this.usuario.loginUser(this.loginObj).subscribe(
      (res: any) => {
        if (res.token) {
          console.log("Login Success");
          localStorage.setItem('token', res.token);
          this.router.navigateByUrl('/main');
        } else {
          alert(res.msg || 'Login failed');
        }
      },
      error => {
        console.error('Error logging in', error);
        alert('Login failed');
      }
    );
  }
}

export class Login {
  Username: string;
  Password: string;
  constructor() {
    this.Username= '';
    this.Password = '';
  }
}


