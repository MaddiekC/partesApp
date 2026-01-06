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

  constructor(private service: ConexionpyService, private fb: FormBuilder,
    private router: Router, private route: ActivatedRoute, private localDbService: LocalDbService) {
    addIcons({ addOutline, saveOutline, trashOutline });
  }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.secParte = idParam ? Number(idParam) : 0;
    console.log(this.secParte);
    this.form = this.fb.group({
      secParte: [this.secParte],
      detalles: this.fb.array([])
    });

    // al menos una fila inicial
    this.addDetalle();
    this.loadLabor();
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
      const key = `${d.empleado}-${d.labor}`;
      totalesPorEmpleado[key] = (totalesPorEmpleado[key] || 0) + Number(d.cantidad);

      const laborInfo = this.labors.find(l => l.id === Number(d.labor));
      if (laborInfo) {
        if (totalesPorEmpleado[key] > laborInfo.avanceMaximo) {
          const totales= totalesPorEmpleado[key] - laborInfo.avanceMaximo
          alert(`Error: El empleado ${this.getEmpleadoName(d.empleado)} supera con ${totales} el máximo permitido para la labor ${laborInfo.nombre}.`);
          return;
        }
      }
    }


    const payload = {
      secParte: this.secParte,
      detalles: this.form.value.detalles.map((d: any) => ({
        fechaInicio: d.fechaInicio,
        fechaFin: d.fechaFin,
        cantidad: Number(d.cantidad),
        lote: Number(d.lote),
        labor: Number(d.labor),
        empleado: Number(d.empleado)
      }))
    };

    console.log('Enviando este payload:', payload);

    if (navigator.onLine) {
      this.service.guardarDetalles(payload).subscribe({
        next: (resp) => {
          console.log('Guardado correcto', resp);
          this.router.navigateByUrl('/partes');
        },
        error: (err) => {
          console.error('Error al guardar', err);
        }
      });
    } else {
      await this.localDbService.guardarDetallesLocal(this.secParte, payload.detalles);
      alert('Parte guardado localmente. Se sincronizará cuando haya conexión.');
      this.router.navigateByUrl('/partes');
    }
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

  // loadEmpleado() {
  //   this.service.getEmpleado().subscribe
  //     (res => {
  //       this.empleados = res;
  //       console.log('Empleado:', res);
  //     });
  // }

  obtenerDatosCabecera() {
    this.service.getCabecera(this.secParte).subscribe(res => {
      this.fechaDelParte = res.fechaParte;
      console.log('fecha del parte:', this.fechaDelParte);
      this.cargarEmpleadosPorAsistencia(this.fechaDelParte);
    });
  }

  cargarEmpleadosPorAsistencia(fecha: string) {
    // Usamos el nuevo método del servicio que creamos en el paso anterior
    this.service.getTrabajadoresAsistencia(fecha).subscribe(res => {
      this.empleados = res;
      console.log('Empleados que asistieron este día:', res);
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
