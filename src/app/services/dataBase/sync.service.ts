import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { ConexionpyService } from '../conexionpy.service';
import { lastValueFrom, Subject } from 'rxjs';
import { LoadingController, ToastController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root',
})
export class SyncService {
  public syncFinished = new Subject<void>();

  constructor(private db: DatabaseService, private partesService: ConexionpyService, private loadingCtrl: LoadingController, private toastCtrl: ToastController) { }

  private tablasMaestras = ['rh_mhaci', 'rh_mlotes', 'labor', 'rh_mtrab', 'det_asistencia', 'unidad_medida', 'rh_mlotseccion', 'area_grupo_labor', 'rh_mlotseccion'];

  async sincronizacionInicial() {
    console.log('Iniciando sincronización');
    for (const tabla of this.tablasMaestras) {
      await this.replicarTablaDinamica(tabla);
      await this.sincronizarDatosDinamicos(tabla);
    }
  }

  async replicarTablaDinamica(nombreTabla: string) {
    const esquema = await lastValueFrom(this.partesService.getEsquema(nombreTabla));

    const columnasSql = esquema.map((col: any) => {
      // Mapeo de tipos MySQL a SQLite
      let tipoSqlite = 'TEXT';
      const t = col.tipo.toLowerCase();

      if (t.includes('int')) tipoSqlite = 'INTEGER';
      if (t.includes('decimal') || t.includes('float') || t.includes('double')) tipoSqlite = 'REAL';

      // Definir si es Primary Key (opcional pero recomendado)
      const pk = col.extra === 'PRI' ? 'PRIMARY KEY' : '';

      return `${col.nombre} ${tipoSqlite} ${pk}`;
    }).join(', ');

    // Eliminamos la tabla vieja y creamos la nueva con la estructura actual
    await this.db.execute(`DROP TABLE IF EXISTS ${nombreTabla}`);
    await this.db.execute(`CREATE TABLE ${nombreTabla} (${columnasSql})`);

    // const debug = await this.db.query("SELECT cod_trabaj, fecha FROM det_asistencia LIMIT 5");
    // console.log('DATOS REALES EN TABLA ASISTENCIA:', JSON.stringify(debug.values));
  }

  async sincronizarDatosDinamicos(nombreTabla: string) {
    // Prueba de diagnóstico
    const checkTablas = await this.db.query("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tablas reales en el archivo .db:', checkTablas.values);

    //LOGICA
    const datos = await lastValueFrom(this.partesService.getDatosTabla(nombreTabla));
    if (!datos || datos.length === 0) return;

    const setInsert: any[] = [];
    setInsert.push({ statement: `DELETE FROM ${nombreTabla}`, values: [] });

    for (let registro of datos) {
      const columnas = Object.keys(registro).join(', ');
      const marcadores = Object.keys(registro).map(() => '?').join(', ');
      const valores = Object.values(registro);

      setInsert.push({
        statement: `INSERT INTO ${nombreTabla} (${columnas}) VALUES (${marcadores})`,
        values: valores
      });
    }

    await this.db.executeSet(setInsert);
    console.log(`${nombreTabla} sincronizada: ${datos.length} filas.`);

    // Diagnóstico de columnas actuales
    const info = await this.db.query("PRAGMA table_info(rh_mhaci)");
    console.log('Columnas actuales en rh_mhaci de SQLite:', info.values);

    const haci = await this.db.query("PRAGMA table_info(rh_mlotes)");
    console.log('Columnas actuales en rh_mlotes de SQLite:', haci.values);

    const labor = await this.db.query("PRAGMA table_info(labor)");
    console.log('Columnas actuales en labor de SQLite:', labor.values);

    const rh_mtrab = await this.db.query("PRAGMA table_info(rh_mtrab)");
    console.log('Columnas actuales en rh_mtrab de SQLite:', rh_mtrab.values);

    const det_asistencia = await this.db.query("PRAGMA table_info(det_asistencia)");
    console.log('Columnas actuales en det_asistencia de SQLite:', det_asistencia.values);
  }

  async sincronizarPendientes() {
    console.log('Iniciando Sincronización de Pendientes...');

    const resultCab = await this.db.query("SELECT * FROM tran_cparte WHERE sync = 0");
    const pendientes = resultCab.values ?? [];

    if (pendientes.length === 0) {
      console.log('No hay registros pendientes por sincronizar.');
      const toast = await this.toastCtrl.create({
        message: 'No hay registros pendientes por sincronizar.',
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Sincronizando datos...',
      spinner: 'crescent'
    });
    await loading.present();

    for (let cab of pendientes) {
      try {
        const cabeceraPayload = {
          codHacienda: cab.cod_hacienda,
          fechaParte: cab.fecha_parte,
          observacion: cab.observacion,
          estado: 'A',
        };

        console.log(`Enviando cabecera ${cab.id_local}:`, cabeceraPayload);

        const resServidor: any = await lastValueFrom(this.partesService.postCabPartes(cabeceraPayload));
        const idReal = resServidor.secParte;

        const resultDet = await this.db.query("SELECT * FROM tran_dparte WHERE sec_parte = ?", [cab.id_local]);
        const listaDetalles = resultDet.values ?? [];

        if (listaDetalles.length > 0) {
          const payloadDetalles = {
            secParte: idReal,
            detalles: listaDetalles.map(d => ({
              secuencia: d.secuencia,
              fechaInicio: d.fecha_inicio,
              fechaFin: d.fecha_fin,
              cantidad: d.cantidad,
              medida: d.medida,
              lote: d.lote_id,
              nomSeccion: d.nom_seccion,
              labor: d.cod_labor,
              codTrabaj: d.cod_trabj
            }))
          };

          await lastValueFrom(this.partesService.guardarDetalles(payloadDetalles));
        }

        console.log(`Registro ${cab.id_local} sincronizado. Eliminando local...`);
        await this.db.execute("DELETE FROM tran_dparte WHERE sec_parte = ?", [cab.id_local]);
        await this.db.execute("DELETE FROM tran_cparte WHERE id_local = ?", [cab.id_local]);

      } catch (error) {
        console.error(`Error sincronizando el parte ${cab.id_local}:`, error);
      }
    }

    await loading.dismiss();

    // Notificamos que la sincronización terminó 
    this.syncFinished.next();
  }
}
