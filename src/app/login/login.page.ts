import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonItem, IonLabel, IonNote, IonButton, IonInput } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ConexionpyService, LoginDto } from '../services/conexionpy.service';
import { AuthService } from '../services/auth.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonButton, IonNote, IonLabel, IonItem, IonContent, IonInput, CommonModule, FormsModule]
})
export class LoginPage {
  loginObj: LoginDto = { login: '', passw: '' };

  constructor(private usuario: ConexionpyService, private router: Router, private auth: AuthService ) { }

  onLogin() {
    console.log('Enviando loginObj:', this.loginObj);
    this.usuario.loginUser(this.loginObj).subscribe(
      async (res: any) => {
        if (res?.token) {
          console.log("Login Success");
          await this.auth.setToken(res.token);
          this.router.navigateByUrl('', { replaceUrl: true });
        } else {
          alert(res?.msg || 'Login failed');
        }
      },
      error => {
        console.error('Error logging in', error);
        alert('Login failed');
      }
    );
  }
}

