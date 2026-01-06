import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonSpinner, IonInfiniteScroll, IonInfiniteScrollContent, IonButtons, IonIcon, IonBadge, IonBackButton } from '@ionic/angular/standalone';
import { ConexionpyService } from '../services/conexionpy.service';
import { ActivatedRoute, Router } from '@angular/router';
import { documentTextOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-partes-detalles',
  templateUrl: './partes-detalles.page.html',
  styleUrls: ['./partes-detalles.page.scss'],
  standalone: true,
  imports: [IonBackButton, IonBadge, IonIcon, IonButtons, IonInfiniteScrollContent, IonInfiniteScroll, IonSpinner, IonButton, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class PartesDetallesPage implements OnInit {

  detPartes: any[] = [];
  labors: any[] = [];
  empleados: any[] = [];
  lotes: any[] = [];
  UnidadMedida: any[] = [];

  id: number | null = null;
  loading = false;
  infiniteDisabled = false;

  constructor(private service: ConexionpyService,
    private route: ActivatedRoute,
    private router: Router) {
    addIcons({ documentTextOutline });
  }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.id = idParam ? Number(idParam) : null;
    if (!this.id) {
      // id inválido -> volver a lista
      this.router.navigateByUrl('/partes');
      return;
    }
    this.loadDetalle();
    this.loadLabor();
    this.loadEmpleado();
    this.loadLote();
    this.loadUnidadMedida();
  }

  loadDetalle() {
    if (!this.id) return;
    this.loading = true;
    this.service.getParteDetalle(this.id).subscribe({
      next: (res) => {
        this.detPartes = res;
        console.log('Detalle cargado:', this.detPartes);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando detalle:', err);
        this.loading = false;
        // si 404 -> volver a lista
        if (err?.status === 404) {
          alert('No se encontró el parte o no tienes permiso.');
          this.router.navigateByUrl('/partes');
        } else {
          alert('Error al cargar detalle.');
        }
      }
    });
  }

  loadLabor() {
    this.service.getLabor().subscribe
      (res => {
        this.labors = res;
        console.log('Labor:', res);
      });
  }

  getLaborName(codLabor: number): string {
    const Labor = this.labors.find(l => l.id === codLabor);
    return Labor ? Labor.nombre : 'Desconocida';
  }

  loadEmpleado() {
    this.service.getEmpleado().subscribe
      (res => {
        this.empleados = res;
        console.log('Empleado:', res);
      });
  }

  getEmpleadoName(codTrabaj: number): string {
    const Empleados = this.empleados.find(l => l.codTrabaj === codTrabaj);
    return Empleados ? Empleados.nombreCorto : 'Desconocido';
  }

  loadLote() {
    this.service.getLotes().subscribe
      (res => {
        this.lotes = res;
        console.log('Lote:', res);
      });
  }

  getLoteName(codLote: number): string {
    const Lotes = this.lotes.find(l => l.loteId === codLote);
    return Lotes ? Lotes.descripcion : 'SL';
  }

  loadUnidadMedida() {
    this.service.getUnidadMedida().subscribe
      (res => {
        this.UnidadMedida = res;
        console.log('UnidadMedida:', res)
      })
  }
  getUnidadMedida(idUnidadMedida: number): string {
    const UnidadMedida = this.UnidadMedida.find(i => i.id === idUnidadMedida);
    return UnidadMedida ? UnidadMedida.nombre : 'Desconocido';
  }

  getLaborUM(codLabor: number): number {
    const Labor = this.labors.find(l => l.id === codLabor);
    return Labor ? Labor.idUnidadMedida : 0;
  }

  formatDate(iso?: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString();
  }


  goBack() {
    this.router.navigateByUrl('/partes');
  }

  loadMore(event: any) {
    if (this.infiniteDisabled) {
      event.target.complete();
      return;
    }
    this.loadDetalle();
  }

  exportToPDF() {

  }
}
