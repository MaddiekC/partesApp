import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root',
})
export class LocalDbService {
  constructor(private db: DatabaseService) { }

  async guardarCabeceraLocal(data: any): Promise<number> {
    const sql = `INSERT INTO tran_cparte (cod_hacienda, fecha_parte, estado, observacion, sync) 
               VALUES (?, ?, ?, ?, 0)`;

    const result = await this.db.execute(sql, [
      data.codHacienda,
      data.fechaParte,
      'A',
      data.observacion
    ]);

    // Retornamos el ID autoincremental que generó SQLite
    return result.changes?.lastId ?? 0;
  }

  async guardarDetallesLocal(secParte: number, detalles: any[]) {
    for (let d of detalles) {
      const sql = `INSERT INTO tran_dparte (sec_parte, empleado, lote, labor, cantidad, fecha_inicio, fecha_fin) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;
      await this.db.execute(sql, [
        secParte,
        d.empleado,
        d.lote,
        d.labor,
        d.cantidad,
        d.fechaInicio,
        d.fechaFin
      ]);
    }
  }
}
