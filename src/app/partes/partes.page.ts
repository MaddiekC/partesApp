import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
//import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { IonContent, IonSpinner, IonButton, IonToolbar, IonHeader, IonTitle, IonInfiniteScroll, IonInfiniteScrollContent, IonButtons, IonMenuButton, IonSearchbar, IonModal, IonItem, IonInput, IonSelectOption, IonCard, IonIcon, IonCardContent, IonLabel, IonNote, AlertController, IonFab, IonFabButton, IonBadge } from "@ionic/angular/standalone";
import { ConexionpyService } from '../services/conexionpy.service';
import { AuthService } from '../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { IonSelect } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { clipboardOutline, addCircleOutline, eyeOutline, downloadOutline, keyOutline, businessOutline, calendarOutline, chatbubbleEllipsesOutline, createOutline, addOutline, downloadSharp, trashOutline, add } from 'ionicons/icons';
import { LocalDbService } from '../services/dataBase/local-db.service';
import { Network } from '@capacitor/network';
import { SyncService } from '../services/dataBase/sync.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-partes',
  templateUrl: './partes.page.html',
  styleUrls: ['./partes.page.scss'],
  standalone: true,
  imports: [IonBadge, IonFabButton, IonFab, IonNote, IonLabel, IonCardContent, IonIcon, IonCard, IonInput, IonItem, IonSelect, IonModal, IonSearchbar, IonButtons, IonInfiniteScrollContent, ReactiveFormsModule, IonInfiniteScroll, IonTitle, IonHeader, IonToolbar, IonButton, IonSpinner, IonContent, CommonModule, FormsModule, IonMenuButton, RouterModule, IonSelectOption, CommonModule]
})

export class PartesPage implements OnInit {
  @ViewChild('modal') modal!: IonModal;
  form!: FormGroup;

  allPartes: any[] = []; // copia
  partes: any[] = [];
  searchQuery = '';

  loading = false;
  username: number = 0;

  empleados: any[] = [];
  haciendas: any[] = [];

  selectedSecParte: number | null = null;
  // paginador
  page = 1;
  pageSize = 10; // por defecto
  total = 0;
  totalItems = 0;
  totalPages = 0;
  pageSizes = 20;
  infiniteDisabled = false;


  nuevoCabParte: any = {
    codigo: null,
    codHacienda: null,
    fechaParte: null,
    estado: 'A',
    observacion: ''
  }

  nuevoDetParte: any = {
    secParte: 0,
    secDetParte: 0,
    codTarea: 0,
    descripcion: '',
    horasTrabajadas: 0
  }

  isOffline: boolean = false;
  private syncSubscription: Subscription | null = null;

  constructor(private cdr: ChangeDetectorRef, private partesService: ConexionpyService, private authService: AuthService, private fb: FormBuilder, private localDbService: LocalDbService, private alertCtrl: AlertController, private router: Router, private syncService: SyncService) {
    addIcons({ addCircleOutline, add, trashOutline, clipboardOutline, businessOutline, calendarOutline, chatbubbleEllipsesOutline, downloadSharp, addOutline, createOutline, keyOutline, downloadOutline, eyeOutline });
  }

  goToDetails(p: any) {
    if (!p.usuarioaprob && p.totalDetalles === 0) {
      this.router.navigate(['/agregar-det', p.secParte], { queryParams: { haciendaId: p.codHacienda, fecha: p.fechaParte } });
    } else if (p.totalDetalles > 0) {
      this.router.navigate(['/partes', p.secParte], { queryParams: { haciendaId: p.codHacienda, fecha: p.fechaParte } });
    }
  }

  async ngOnInit(): Promise<void> {
    const status = await Network.getStatus();
    this.isOffline = !status.connected;

    Network.addListener('networkStatusChange', status => {
      //Real 
      // this.isOffline = !status.connected;
      // this.cdr.detectChanges();

      //PRUEBA
      if (this.isOffline && status.connected) {
        this.loadPage(1);
        this.syncService.sincronizarPendientes();
      }
      else if (!status.connected) {
        this.loadPage(1);
      }
      this.isOffline = !status.connected;
      this.cdr.detectChanges();

    });

    this.form = this.fb.group({
      //codigo: [null, Validators.required],
      codHacienda: [null, Validators.required],
      fechaParte: [null, Validators.required],
      estado: ['A'],
      observacion: [null]
    });

    const u = await this.authService.getUserInfo();
    this.username = u ?? 0;
    console.log('Usuario:', this.username);

    this.syncSubscription = this.syncService.syncFinished.subscribe(() => {
      this.loadPage(1);
    });

  }

  ngOnDestroy() {
    if (this.syncSubscription) {
      this.syncSubscription.unsubscribe();
    }
  }

  ionViewWillEnter() {
    this.loadPage(1);
    this.loadHaciendas();
    this.loadEmpleado();
  }

  async loadHaciendas() {
    try {
      // En lugar de llamar a partesService.getHaciendas(), usamos la DB local
      this.haciendas = await this.localDbService.obtenerHaciendasLocal();
      console.log('Haciendas cargadas desde SQLite:', this.haciendas);
    } catch (error) {
      console.error('Error al cargar haciendas locales:', error);
    }
  }
  // loadHaciendas() {
  //   if (navigator.onLine) {
  //     this.partesService.getHaciendas().subscribe
  //       (res => {
  //         this.haciendas = res;
  //         console.log('Haciendas:', res);
  //       });
  //   } else {
  //     this.localDbService.obtenerHaciendasLocal().then(res => {
  //       this.haciendas = res;
  //       console.log('Haciendas cargadas localmente:', res);
  //     });
  //     (error: any) => {
  //       console.log('Error local', error);
  //     }
  //   }
  // }

  getHaciendaName(codHacienda: number): string {
    const hacienda = this.haciendas.find(h => h.COD_HACIENDA === codHacienda);
    return hacienda ? hacienda.NOM_HACIENDA : 'Desconocida';
  }

  // getHaciendaName(codHacienda: number): string {
  //   const hacienda = this.haciendas.find(h => h.codHacienda === codHacienda);
  //   return hacienda ? hacienda.nomHacienda : 'Desconocida';
  // }

  async loadPage(page: number, event?: any) {
    this.loading = true;
    const locales = await this.localDbService.listarPartesLocales();
    this.partes = locales.map(p => ({
      secParte: p.id_local, // Usamos el ID local mientras no tenga el del servidor
      secReal: p.sec_parte,  // El ID real del servidor (si ya se sincronizó)
      fechaParte: p.fecha_parte,
      codHacienda: p.COD_HACIENDA || p.cod_hacienda,
      usuarioaprob: p.estado === 'Aprobado',
      sync: p.sync,
      codigo: p.codigo,
      totalDetalles: p.totalDetalles || 0
    }));
    console.log('Partes locales', this.partes);
    this.loading = false;

    // 2.
    if (navigator.onLine) {
      this.partesService.cabPartes(page).subscribe(
        (res: any) => {
          console.log('Partes con wifi:', res);
          if (page === 1) {
            this.allPartes = res || [];
            this.partes = [...this.allPartes];
          } else {
            this.partes = [...this.partes, ...(res || [])];
          }
          if (event) {
            event.target.complete();
            if (this.infiniteDisabled) {
              event.target.disabled = true;
            }
          }
          this.loading = false;
        },
        error => {
          console.error('Error al obtener los datos del parte', error);
          alert('Error al obtener los datos del parte');
        }
      );
    }
  }

  handleInput(event: any) {
    const raw = event?.detail?.value ?? '';          // ion-searchbar usa event.detail.value
    const q = raw.toString().trim().toLowerCase();

    this.searchQuery = q;

    // si la consulta está vacía, restaurar lista completa
    if (!q) {
      this.partes = [...this.allPartes];
      this.infiniteDisabled = this.partes.length >= this.totalItems;
      return;
    }

    // si la consulta es numérica, conviértela para comparaciones exactas
    const qNum = Number.isFinite(Number(q)) ? Number(q) : null;

    this.partes = this.allPartes.filter(p => {
      // normalizar campos (defensive)
      const sec = p.secParte != null ? p.secParte.toString().toLowerCase() : '';
      const cod = p.codigo != null ? p.codigo.toString().toLowerCase() : '';
      const hac = p.codHacienda != null ? p.codHacienda.toString().toLowerCase() : '';
      const fecha = p.fechaParte ? p.fechaParte.toString().toLowerCase() : '';
      const estado = p.estado ? p.estado.toString().toLowerCase() : '';

      // búsqueda por texto (contiene)
      const textMatch =
        sec.includes(q) ||
        cod.includes(q) ||
        hac.includes(q) ||
        fecha.includes(q) ||
        estado.includes(q);

      // búsqueda numérica exacta (si el usuario escribió solo números)
      const numberMatch = qNum !== null && (
        (p.secParte !== undefined && Number(p.secParte) === qNum) ||
        (p.codigo !== undefined && Number(p.codigo) === qNum) ||
        (p.codHacienda !== undefined && Number(p.codHacienda) === qNum)
      );

      return textMatch || numberMatch;
    });

    // si usas infinite scroll, deshabilítalo cuando ya mostramos todo filtrado
    this.infiniteDisabled = this.partes.length >= this.totalItems;
  }

  loadMore(event: any) {
    if (this.infiniteDisabled) {
      event.target.complete();
      return;
    }
    this.loadPage(this.page + 1, event);
  }


  formatDate(iso?: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString();
  }

  async confirm() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      ...this.form.value,
      estado: 'A'
    };

    console.log('Payload:', payload);

    const idLocal = await this.localDbService.guardarCabeceraLocal(payload, 0);
    if (!navigator.onLine) {
      alert('Parte guardado localmente. Se sincronizará cuando haya conexión.');
      this.modal.dismiss();
      this.loadPage(1);
    }

    if (navigator.onLine) {
      this.partesService.postCabPartes(payload).subscribe({
        next: async (res) => {
          console.log('Parte creado:', res);
          await this.localDbService.marcarComoSincronizado(idLocal);
          alert('Parte creado correctamente');
          this.modal.dismiss();
          this.loadPage(1);
        },
        error: (err) => {
          console.error('Error al guardar', err);
        }
      });
    }
  }

  async loadEmpleado() {
    try {
      this.empleados = await this.localDbService.obtenerTrabajadorLocal();
      console.log('Trabajadores cargados desde SQLite:', this.empleados);
    } catch (error) {
      console.error('Error al cargar trabajadores locales:', error);
    }
    // this.partesService.getEmpleado().subscribe
    //   (res => {
    //     this.empleados = res;
    //     console.log('Empleado:', res);
    //   });
  }

  async eliminarParte(secParte: any) {
    const alertDialog = await this.alertCtrl.create({
      header: '¿Eliminar Parte?',
      message: 'Esta acción eliminará el parte.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.localDbService.deleteParte(secParte);
            this.loadPage(1);
            if (navigator.onLine) {
              this.partesService.desactivarParte(secParte).subscribe({
                next: () => {
                  this.loadPage(1);
                },
                error: async (err) => {
                  const errorAlert = await this.alertCtrl.create({
                    header: 'Error',
                    message: err.error.message || 'Error al desactivar',
                    buttons: ['OK']
                  });
                  await errorAlert.present();
                }
              });
            }
          }
        }
      ]
    });
    await alertDialog.present();
  }

}
