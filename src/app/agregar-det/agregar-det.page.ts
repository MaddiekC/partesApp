import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCol, IonButton, IonRow, IonButtons, IonSelectOption, IonBackButton, IonIcon, IonItem, IonLabel, IonItemDivider, IonList } from '@ionic/angular/standalone';
import { FormGroup, FormArray, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { ConexionpyService } from '../services/conexionpy.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonInput } from '@ionic/angular/standalone';
import { IonSelect } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, saveOutline, trashOutline } from 'ionicons/icons';
import { LocalDbService } from '../services/dataBase/local-db.service';

@Component({
  selector: 'app-agregar-det',
  templateUrl: './agregar-det.page.html',
  styleUrls: ['./agregar-det.page.scss'],
  standalone: true,
  imports: [IonList, IonItemDivider, IonLabel, IonItem, IonIcon, IonBackButton, CommonModule, IonButtons, IonSelect, IonRow, IonButton, IonInput, IonCol, FormsModule, ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonSelectOption]
})


export class AgregarDetPage implements OnInit {
  form!: FormGroup;
  secParte: any;
  labors: any[] = [];
  empleados: any[] = [];
  lotes: any[] = [];
  asistencias: any[] = [];
  fechaDelParte: string = '';
  codTrabaj: number = 0;
  haciendaId: number = 0;

  constructor(private service: ConexionpyService, private fb: FormBuilder,
    private router: Router, private route: ActivatedRoute, private localDbService: LocalDbService) {
    addIcons({ addOutline, saveOutline, trashOutline });
  }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.secParte = idParam ? Number(idParam) : 0;

    const haciendaIdParam = this.route.snapshot.queryParamMap.get('haciendaId');
    const haciendaId = haciendaIdParam ? Number(haciendaIdParam) : 0;

    console.log('SecParte:', this.secParte);
    this.form = this.fb.group({
      secParte: [this.secParte],
      detalles: this.fb.array([])
    });

    // al menos una fila inicial
    this.addDetalle();
    // this.loadLabor();
    this.loadLabor(haciendaId);
    //this.loadEmpleado();
    this.loadLote();
    this.obtenerDatosCabecera();
  }

  goBack() {
    this.router.navigateByUrl('/partes');
  }

  createDetalle(): FormGroup {
    return this.fb.group({
      empleado: ['', Validators.required],
      lote: ['', Validators.required],
      labor: ['', Validators.required],
      cantidad: [0, [Validators.required, Validators.min(1)]],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
    });
  }


  addDetalle() {
    this.detalles.push(this.createDetalle());
  }

  get detalles(): FormArray {
    return this.form.get('detalles') as FormArray;
  }

  removeDetalle(index: number) {
    this.detalles.removeAt(index);
  }

  async guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const detallesArray = this.form.value.detalles;
    const totalesPorEmpleado: { [key: string]: number } = {};

    for (const d of detallesArray) {
      const empId = d.empleado || d.codTrabaj;
      const key = `${empId}-${d.labor}`;
      const cantidadActual = Number(d.cantidad);

      // Acumulamos para la validación de máximos
      totalesPorEmpleado[key] = (totalesPorEmpleado[key] || 0) + cantidadActual;

      const laborInfo = this.labors.find(l => l.id === Number(d.labor));

      if (laborInfo) {
        // 1. VALIDACIÓN DE MÍNIMO (Por cada registro individual)
        const minimoPermitido = laborInfo.avanceMinimo ?? laborInfo.avance_minimo ?? 0;
        if (minimoPermitido > 0 && cantidadActual < minimoPermitido) {
          alert(`Error: La cantidad (${cantidadActual}) es menor al mínimo permitido (${minimoPermitido}) para la labor ${laborInfo.nombre}.`);
          return;
        }

        // 2. VALIDACIÓN DE MÁXIMO (Sobre el total acumulado del empleado en esa labor)
        const maximoPermitido = laborInfo.avanceMaximo ?? laborInfo.avance_maximo ?? 0;
        if (maximoPermitido > 0 && totalesPorEmpleado[key] > maximoPermitido) {
          const exceso = totalesPorEmpleado[key] - maximoPermitido;
          alert(`Error: El empleado ${this.getEmpleadoName(empId)} supera por ${exceso} el máximo permitido (${maximoPermitido}) para la labor ${laborInfo.nombre}.`);
          return;
        }
      }
    }
    const payload = {
      secParte: this.secParte,
      detalles: this.form.value.detalles.map((d: any, index: number) => {
        const loteObj = d.lote;
        const loteId = loteObj.loteId || loteObj.LOTE_ID;
        const nombreSec = loteObj.nomSeccion || loteObj.NOM_SECCION || 'Desconocida';

        const loteFormateado = String(loteId).padStart(4, '0');
        return {
          secuencia: index + 1,
          fechaInicio: d.fechaInicio,
          fechaFin: d.fechaFin,
          cantidad: Number(d.cantidad),
          lote: Number(loteId),
          labor: Number(d.labor),
          codTrabaj: Number(d.empleado),
          nomSeccion: `${nombreSec} ${loteFormateado} `
        }
      })
    };

    console.log('Enviando este payload:', payload);
    await this.localDbService.guardarDetallesLocal(this.secParte, payload.detalles);
    if (!navigator.onLine) {
      alert('Detalles guardados localmente. Se sincronizará cuando haya conexión.');
      this.router.navigateByUrl('/partes');
      return;
    }
    if (navigator.onLine) {
      this.service.guardarDetalles(payload).subscribe({
        next: (resp) => {
          console.log('Guardado correcto', resp);
          alert('Detalles guardados');
          this.router.navigateByUrl('/partes');
        },
        error: (err) => {
          console.error('Error al guardar', err);
          alert(err);
        }
      });
    }
  }

  // async loadLabor() {
  //   try {
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

  // loadEmpleado() {
  //   this.service.getEmpleado().subscribe
  //     (res => {
  //       this.empleados = res;
  //       console.log('Empleado:', res);
  //     });
  // }


  async obtenerDatosCabecera() {
    const locales = await this.localDbService.listarPartesLocales();

    // Mapeamos los campos de SQLite a los nombres que usa tu HTML
    this.fechaDelParte = locales.length > 0 ? locales[0].fecha_parte : '';
    console.log('Partes locales', this.fechaDelParte);
    this.cargarEmpleadosPorAsistencia(this.fechaDelParte);

    if (navigator.onLine) {
      this.service.getCabecera(this.secParte).subscribe(res => {
        this.fechaDelParte = res.fechaParte;
        //console.log('fecha del parte:', this.fechaDelParte);
        this.cargarEmpleadosPorAsistencia(this.fechaDelParte);
      });
    }
  }

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
    const Lotes = this.lotes.find(l => l.loteId === codLote);
    return Lotes ? Lotes.descripcion : 'Desconocido';
  }

  // loadAsistencias(){
  //   this.service.getAsistencia().subscribe
  //   (res=>{
  //     this.asistencias = res;
  //     console.log('Asistencias:', res);
  //   });
  // }

  // getAsistencia(codTrabaj: number): string {
  //   const Asistencia = this.asistencias.find(a => a.codTrabaj === codTrabaj);
  //   return Asistencia ? Asistencia.fecha : 'Desconocido';
  // }
}
