import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root',
})
export class LocalDbService {
  constructor(private db: DatabaseService) { }

  async guardarCabeceraLocal(data: any, syncStatus: number = 0): Promise<number> {
    const sql = `INSERT INTO tran_cparte (cod_hacienda, fecha_parte, estado, observacion, sync) 
               VALUES (?, ?, ?, ?, ?)`;

    const result = await this.db.execute(sql, [
      data.codHacienda,
      data.fechaParte,
      'A',
      data.observacion,
      syncStatus
    ]);
    return result.changes?.lastId ?? 0;
  }

  async guardarDetallesLocal(secParte: number, detalles: any[]) {
    for (let d of detalles) {
      const sql = `INSERT INTO tran_dparte (sec_parte, secuencia, cod_trabj, lote_id, nom_seccion, cod_labor, cantidad, fecha_inicio, fecha_fin, sync) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`;
      await this.db.execute(sql, [
        secParte,
        d.secuencia,
        d.codTrabaj,
        d.lote,
        d.nomSeccion,
        d.labor,
        d.cantidad,
        d.fechaInicio,
        d.fechaFin
      ]);
    }
  }

  async marcarComoSincronizado(idLocal: number) {
    const sql = `UPDATE tran_cparte SET sync = 1 WHERE id_local = ?`;
    await this.db.execute(sql, [idLocal]);
  }

  async obtenerHaciendasLocal(): Promise<any[]> {
    const sql = 'SELECT * FROM rh_mhaci';
    const result = await this.db.query(sql);
    console.log('HACIENDA', result.values);
    return result.values || [];
  }
  async obtenerTrabajadorLocal(): Promise<any[]> {
    const sql = 'SELECT * FROM rh_mtrab';
    const result = await this.db.query(sql);
    console.log('TRABAJADOR', result.values);
    return result.values || [];
  }
  // async obtenerLaborLocal(): Promise<any[]> {
  //   const sql = `
  //   SELECT * FROM labor 
  //   WHERE idFuerzaLab != 17 
  //   AND estado = 'A'
  // `;
  //   const result = await this.db.query(sql);
  //   console.log('LABOR', result.values);
  //   return result.values || [];
  // }
  async obtenerLaborLocal(haciendaId: number = 0): Promise<any[]> {
    const sql = `
    SELECT * FROM labor 
    LEFT JOIN area_grupo_labor ar ON labor.idGrupo = ar.idGrupo 
    WHERE ar.idArea = ? 
    AND idFuerzaLab != 17 
    AND labor.estado = 'A'
    AND ar.estado = 'A'
  `;
    const result = await this.db.query(sql, [haciendaId]);
    console.log('LABOR', result.values);
    return result.values || [];
  }
  async obtenerLoteLocal(): Promise<any[]> {
    const sql = `
    SELECT lot.LOTE_ID, lots.NOM_SECCION
    FROM rh_mlotes lot 
    LEFT JOIN rh_mlotseccion lots ON lot.LOTE_ID = lots.LOTE_ID`;
    const result = await this.db.query(sql);
    console.log('LOTE', result.values);
    return result.values || [];
  }
  // async obtenerLoteLocal(): Promise<any[]> {
  //   const sql = 'SELECT * FROM rh_mlotes';
  //   const result = await this.db.query(sql);
  //   console.log('LOTE', result.values);
  //   return result.values || [];
  // }
  async obtenerMedidaLocal(): Promise<any[]> {
    const sql = 'SELECT * FROM unidad_medida';
    const result = await this.db.query(sql);
    console.log('MEDIDA', result.values);
    return result.values || [];
  }
  async obtenerLoteSeccionLocal(): Promise<any[]> {
    const sql = 'SELECT * FROM rh_mlotseccion';
    const result = await this.db.query(sql);
    console.log('LOTE SECCION', result.values);
    return result.values || [];
  }

  async obtenerMisPartesLocales() {
    const sql = `
    SELECT *, 
    (SELECT COUNT(*) FROM tran_dparte WHERE tran_dparte.sec_parte = tran_cparte.sec_parte) as totalDetalles
    FROM tran_cparte 
    ORDER BY fecha_parte DESC`;
    const res = await this.db.query(sql);
    return res.values || [];
  }

  async listarPartesLocales() {
    const sql = `
    SELECT 
      c.id_local,
      c.codigo,
      c.fecha_parte,
      h.cod_hacienda,
      c.estado,
      c.sync,
      (SELECT COUNT(*) FROM tran_dparte d WHERE d.sec_parte = c.id_local) as totalDetalles
    FROM tran_cparte c
    LEFT JOIN rh_mhaci h ON c.cod_hacienda = h.cod_hacienda
    ORDER BY c.fecha_parte DESC, c.id_local DESC
  `;
    const res = await this.db.query(sql);
    console.log('listarPartesLocales', res.values);
    return res.values || [];
  }

  async getEmpPorAsisLocal(fecha: string): Promise<any[]> {
    console.log('fecha consultada', fecha);
    const sql = `
    SELECT DISTINCT t.COD_TRABAJ, t.NOMBRE_CORTO, t.fechasub
    FROM rh_mtrab t
    INNER JOIN det_asistencia a ON t.COD_TRABAJ = a.cod_trabaj
    WHERE a.fecha = date(?)
    ORDER BY t.nombre_corto ASC
  `;
    const result = await this.db.query(sql, [fecha]);
    console.log('getEmpPorAsisLocal', result.values);
    return result.values || [];
  }

  async listarDetLocales(id: number) {
    const sql = `
    SELECT 
      c.id_detalle,   
      c.secuencia,  
      c.sec_parte,
      c.cod_trabj,
      c.lote_id,
      c.nom_seccion,
      c.cod_labor,
      c.cantidad,
      c.fecha_inicio,
      c.fecha_fin,
      c.sync
    FROM tran_dparte c
    LEFT JOIN rh_mlotes h ON c.lote_id = h.lote_id
    WHERE c.sec_parte = ?
    ORDER BY c.id_detalle DESC
  `;
    const res = await this.db.query(sql, [id]);
    console.log('listarDetLocales', res.values);
    return res.values || [];
  }

  async updateDet(payload: any) {
    const sql = `
    UPDATE tran_dparte
    SET cod_trabj = ?, 
        lote_id = ?, 
        nom_seccion = ?,
        cod_labor = ?,
        cantidad = ?,
        fecha_inicio = ?,
        fecha_fin = ?
    WHERE sec_parte = ? AND id_detalle = ?
  `;
    await this.db.run(sql, [
      payload.codTrabaj,
      payload.lote,
      payload.nomSeccion,
      payload.labor,
      payload.cantidad,
      payload.fechaInicio,
      payload.fechaFin,
      payload.secParte,
      payload.idDetalle
    ]);
  }

  async deleteParte(idLocal: number) {
    const sqlDet = `DELETE FROM tran_dparte WHERE sec_parte = ?`;
    await this.db.run(sqlDet, [idLocal]);

    const sqlCab = `DELETE FROM tran_cparte WHERE id_local = ?`;
    await this.db.run(sqlCab, [idLocal]);

    console.log(`Parte local ${idLocal} y sus detalles han sido eliminados.`);
  }
}
