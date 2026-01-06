import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { ConexionpyService } from '../conexionpy.service';

@Injectable({
  providedIn: 'root',
})
export class SyncService {
  constructor(private db: DatabaseService, private partesService: ConexionpyService) { }

  async sincronizarPendientes() {
    // 1. Usamos QUERY para el SELECT
    const resultCab = await this.db.query("SELECT * FROM tran_cparte WHERE sync = 0");

    // Verificamos si hay datos
    const pendientes = resultCab.values ?? [];

    for (let cab of pendientes) {
      this.partesService.postCabPartes(cab).subscribe(async (resServidor: any) => {

        const idReal = resServidor.secParte;

        // 2. Usamos QUERY para obtener los detalles
        const resultDet = await this.db.query("SELECT * FROM tran_dparte WHERE sec_parte = ?", [cab.id_local]);
        const listaDetalles = resultDet.values ?? [];

        if (listaDetalles.length > 0) {
          const payloadDetalles = {
            secParte: idReal,
            detalles: listaDetalles.map(d => ({
              fechaInicio: d.fecha_inicio,
              fechaFin: d.fecha_fin,
              cantidad: d.cantidad,
              medida: d.medida,
              lote: d.lote,
              labor: d.labor,
              empleado: d.empleado
            }))
          };

          this.partesService.guardarDetalles(payloadDetalles).subscribe(async () => {
            await this.db.execute("DELETE FROM tran_dparte WHERE sec_parte = ?", [cab.id_local]);
            await this.db.execute("DELETE FROM tran_cparte WHERE id_local = ?", [cab.id_local]);

            console.log(`Registro ${cab.id_local} subido y eliminado de SQLite.`);
          });
        }
      });
    }
  }
}
