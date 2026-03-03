import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonSpinner, IonButtons, IonIcon, IonBadge, IonBackButton, IonGrid, IonRow, IonCol, IonCardContent, IonModal, IonLabel, IonItem, IonSelectOption, IonInput, IonSelect } from '@ionic/angular/standalone';
import { ConexionpyService } from '../services/conexionpy.service';
import { ActivatedRoute, Router } from '@angular/router';
import { documentTextOutline, downloadSharp, createOutline, trashOutline, arrowForwardOutline, saveOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { LocalDbService } from '../services/dataBase/local-db.service';

@Component({
  selector: 'app-partes-detalles',
  templateUrl: './partes-detalles.page.html',
  styleUrls: ['./partes-detalles.page.scss'],
  standalone: true,
  imports: [IonItem, IonLabel, IonModal, IonCardContent, IonCol, IonRow, IonGrid, IonBackButton, IonBadge, IonIcon, IonButtons, IonSpinner, IonButton, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonSelectOption, IonInput, IonSelect]
})
export class PartesDetallesPage implements OnInit {

  detPartes: any[] = [];
  esAprobado: boolean = false;
  labors: any[] = [];
  empleados: any[] = [];
  lotes: any[] = [];
  lotesNom: any[] = [];
  UnidadMedida: any[] = [];
  id: number | null = null;
  loading = false;
  infiniteDisabled = false;

  isModalOpen = false;
  detalleSeleccionado: any = null;

  constructor(private service: ConexionpyService,
    private route: ActivatedRoute,
    private router: Router, private localDbService: LocalDbService) {
    addIcons({ downloadSharp, createOutline, trashOutline, arrowForwardOutline, saveOutline, documentTextOutline });
  }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.id = idParam ? Number(idParam) : null;
    const haciendaIdParam = this.route.snapshot.queryParamMap.get('haciendaId');
    const haciendaId = haciendaIdParam ? Number(haciendaIdParam) : 0;
    const fechaParam = this.route.snapshot.queryParamMap.get('fecha');
    const fecha = fechaParam ? String(fechaParam) : ''

    if (!this.id) {
      // id inválido -> volver a lista
      this.router.navigateByUrl('/partes');
      return;
    }
    this.loadDetalle();
    // this.loadLabor();
    this.loadLabor(haciendaId);
    //this.loadEmpleado();
    this.cargarEmpleadosPorAsistencia(fecha)
    this.loadLote();
    this.loadUnidadMedida();
    this.loadLoteNom();
  }

  async loadDetalle() {
    if (!this.id) return;
    this.loading = true; // Asegúrate de activar el loading al iniciar

    if (navigator.onLine) {
      // --- MODO ONLINE ---
      console.log('Cargando detalle desde el servidor...');
      this.service.getParteDetalle(this.id).subscribe({
        next: (res) => {
          this.detPartes = res.detalles;
          this.esAprobado = res.aprobado;
          this.loading = false;
          console.log('Detalle cargado desde API:', this.detPartes);
        },
        error: (err) => {
          console.error('Error API, intentando carga local de respaldo:', err);
          if (this.id !== null) {
            this.cargarDesdeLocal(this.id);
          }
        }
      });
    } else {
      // --- MODO OFFLINE ---
      console.log('Sin internet, cargando desde SQLite...');
      await this.cargarDesdeLocal(this.id);
    }
  }

  // Extraemos la lógica local a un método aparte para mayor orden
  async cargarDesdeLocal(id: number) {
    try {
      const locales = await this.localDbService.listarDetLocales(id);
      if (locales && locales.length > 0) {
        this.detPartes = locales.map(p => ({
          idDetalle: p.id_detalle,
          secParte: p.sec_parte,
          secuencia: p.secuencia,
          codTrabaj: p.cod_trabj,
          loteId: p.lote_id,
          nomSeccion: p.nom_seccion,
          codLabor: p.cod_labor,
          cantidad: p.cantidad,
          fechaInicio: p.fecha_inicio,
          fechaFin: p.fecha_fin
        }));
        console.log('Cargado desde SQLite:', this.detPartes);
      } else {
        console.warn('No hay datos locales para este ID');
        this.detPartes = [];
      }
    } catch (error) {
      console.error('Error crítico leyendo SQLite:', error);
    } finally {
      this.loading = false;
    }
  }

  // async loadLabor() {
  //   try {
  //     // En lugar de llamar a partesService.getHaciendas(), usamos la DB local
  //     this.labors = await this.localDbService.obtenerLaborLocal();
  //     console.log('Labores cargadas desde SQLite:', this.labors);
  //   } catch (error) {
  //     console.error('Error al cargar labores locales:', error);
  //   }
  //   // this.service.getLabor().subscribe
  //   //   (res => {
  //   //     this.labors = res;
  //   //     console.log('Labor:', res);
  //   //   });
  // }
  async loadLabor(haciendaId: number) {
    try {
      // En lugar de llamar a partesService.getHaciendas(), usamos la DB local
      this.labors = await this.localDbService.obtenerLaborLocal(haciendaId);
      console.log('Labores cargadas desde SQLite:', this.labors);
    } catch (error) {
      console.error('Error al cargar labores locales:', error);
    }
    // this.service.getLabor().subscribe
    //   (res => {
    //     this.labors = res;
    //     console.log('Labor:', res);
    //   });
  }

  getLaborName(codLabor: number): string {
    const Labor = this.labors.find(l => l.id === codLabor);
    return Labor ? Labor.nombre : 'Desconocida';
  }

  // async loadEmpleado() {
  //   try {
  //     // En lugar de llamar a partesService.getHaciendas(), usamos la DB local
  //     this.empleados = await this.localDbService.obtenerTrabajadorLocal();
  //     console.log('Empleados cargados desde SQLite:', this.empleados);
  //   } catch (error) {
  //     console.error('Error al cargar empleados locales:', error);
  //   }
  //   // this.service.getEmpleado().subscribe
  //   //   (res => {
  //   //     this.empleados = res;
  //   //     console.log('Empleado:', res);
  //   //   });
  // }

  async cargarEmpleadosPorAsistencia(fecha: string) {
    console.log('Fecha', fecha);
    const locales = await this.localDbService.getEmpPorAsisLocal(fecha)
    this.empleados = locales.map(p => ({
      codTrabaj: p.COD_TRABAJ,
      nombreCorto: p.NOMBRE_CORTO
    }));
    console.log('Empleados cargados desde SQLite:', this.empleados);

    // if (navigator.onLine) {
    //   this.service.getTrabajadoresAsistencia(fecha).subscribe(res => {
    //     this.empleados = res;
    //     //console.log('Empleados que asistieron este día:', res);
    //   });
    // }
  }

  // getEmpleadoName(codTrabaj: number): string {
  //   const Empleados = this.empleados.find(l => l.COD_TRABAJ === codTrabaj);
  //   return Empleados ? Empleados.nombreCorto : 'Desconocido';
  // }

  getEmpleadoName(codTrabaj: number): string {
    const Empleados = this.empleados.find(l => l.codTrabaj === codTrabaj);
    return Empleados ? Empleados.nombreCorto : 'Desconocido';
  }

  async loadLote() {
    try {
      // En lugar de llamar a partesService.getHaciendas(), usamos la DB local
      this.lotes = await this.localDbService.obtenerLoteLocal();
      console.log('Lotes cargados desde SQLite:', this.lotes);
    } catch (error) {
      console.error('Error al cargar lotes locales:', error);
    }
    // this.service.getLotes().subscribe
    //   (res => {
    //     this.lotes = res;
    //     console.log('Lote:', res);
    //   });
  }

  getLoteName(codLote: number): string {
    const Lotes = this.lotes.find(l => l.LOTE_ID === codLote);
    return Lotes ? Lotes.LOTE_ID : 'SL';
  }
  // getLoteName(codLote: number): string {
  //   const Lotes = this.lotes.find(l => l.loteId === codLote);
  //   return Lotes ? Lotes.descripcion : 'SL';
  // }

  async loadLoteNom() {
    try {
      this.lotesNom = await this.localDbService.obtenerLoteLocal();
      console.log('LotesNom cargados desde SQLite:', this.lotesNom);
    } catch (error) {
      console.error('Error al cargar lotesNom locales:', error);
    }
  }
  getLoteNomSecc(codLote: number): string {
    const Lotes = this.lotesNom.find(l => l.LOTE_ID === codLote);
    return Lotes ? Lotes.NOM_SECCION : 'SL';
  }

  async loadUnidadMedida() {
    try {
      // En lugar de llamar a partesService.getHaciendas(), usamos la DB local
      this.UnidadMedida = await this.localDbService.obtenerMedidaLocal();
      console.log('UnidadMedida cargados desde SQLite:', this.UnidadMedida);
    } catch (error) {
      console.error('Error al cargar UnidadMedida locales:', error);
    }
    // this.service.getUnidadMedida().subscribe
    //   (res => {
    //     this.UnidadMedida = res;
    //     console.log('UnidadMedida:', res)
    //   })
  }
  getUnidadMedida(idUnidadMedida: number): string {
    const UnidadMedida = this.UnidadMedida.find(i => i.id === idUnidadMedida);
    return UnidadMedida ? UnidadMedida.nombre : 'Desconocido';
  }

  getLaborUM(codLabor: number): number {
    const Labor = this.labors.find(l => l.id === codLabor);
    return Labor ? Labor.id_unidad_medida : 0;
  }

  // getLaborUM(codLabor: number): number {
  //   const Labor = this.labors.find(l => l.id === codLabor);
  //   return Labor ? Labor.idUnidadMedida : 0;
  // }

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

  editarDetalle(detalle: any) {
    this.detalleSeleccionado = { ...detalle };
    if (this.detalleSeleccionado.loteId) {
      this.detalleSeleccionado.lote = {
        LOTE_ID: this.detalleSeleccionado.loteId,
        NOM_SECCION: this.detalleSeleccionado.nomSeccion || ''
      };
    }

    this.isModalOpen = true;
  }

  compareLotes(o1: any, o2: any) {
    if (!o1 || !o2) return false;

    const id1 = o1.LOTE_ID || o1.loteId || o1.loteid;
    const id2 = o2.LOTE_ID || o2.loteId || o2.loteid;

    const sec1 = (o1.NOM_SECCION || o1.nomSeccion || '').toString().trim();
    const sec2 = (o2.NOM_SECCION || o2.nomSeccion || '').toString().trim();

    return id1 === id2 && (sec1.includes(sec2) || sec2.includes(sec1));
  }

  async confirmarEdicion() {
    if (!this.detalleSeleccionado) return;

    this.loading = true;
    const d = this.detalleSeleccionado;
    console.log('Detalle', d);
    const loteObj = d.lote;
    const loteId = loteObj.loteId || loteObj.LOTE_ID;
    const nombreSec = loteObj.nomSeccion || loteObj.NOM_SECCION || 'Desconocida';

    const loteFormateado = String(loteId).padStart(4, '0');
    const bodyUpdate = {
      idDetalle: d.idDetalle,
      secParte: Number(d.secParte),
      secuencia: Number(d.secuencia),
      codTrabaj: Number(d.codTrabaj),
      lote: Number(loteId),
      labor: Number(d.codLabor),
      cantidad: Number(d.cantidad),
      fechaInicio: d.fechaInicio,
      fechaFin: d.fechaFin,
      nomSeccion: `${nombreSec} ${loteFormateado} `
    };

    console.log('Enviando este payload:', bodyUpdate);
    try {
      await this.localDbService.updateDet(bodyUpdate);
      if (!navigator.onLine) {
        alert('Parte editado localmente (Offline). Se sincronizará cuando recupere conexión.');
        this.isModalOpen = false;
        this.loadDetalle();
        this.loading = false;
        return;
      }
      if (navigator.onLine) {
        this.service.editarDetalle(d.secParte, d.secuencia, bodyUpdate).subscribe({
          next: (res) => {
            this.isModalOpen = false;
            this.loadDetalle();
            console.log('Actualizado:', res);
          },
          error: (err) => {
            this.loading = false;
            console.error('Error completo:', err);

            if (err.status === 0) {
              alert('Parte editado localmente. Se sincronizará cuando recupere la conexión.');
              this.isModalOpen = false;
              this.loadDetalle();
            } else {
              const mensajeError = typeof err.error === 'string'
                ? err.error
                : (err.error?.message || err.message || 'Error desconocido');

              alert(mensajeError);
            }
          }
        });
      }
    } catch (err) {
      console.error('Error actualizando:', err);
      this.loading = false;
    }
  }
}
