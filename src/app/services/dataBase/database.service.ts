import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db!: SQLiteDBConnection;

  constructor() { }

  async inicializarDB() {
    try {
      this.db = await this.sqlite.createConnection('PartesApp.db', false, 'no-encryption', 1, false);
      await this.db.open();
      console.log('SQLite Conectado');

      // Definir el esquema de las tablas
      const schema = `
      CREATE TABLE IF NOT EXISTS tran_cparte (
        id_local INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo INTEGER, 
        cod_hacienda INTEGER,
        fecha_parte TEXT,
        estado TEXT,
        observacion TEXT,
        sync INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS tran_dparte (
        id_detalle INTEGER PRIMARY KEY AUTOINCREMENT,
        sec_parte INTEGER,
        secuencia INTEGER,
        cod_trabj INTEGER,
        cod_labor INTEGER,
        lote_id INTEGER,
        nom_seccion TEXT,
        cantidad INTEGER,
        fecha_inicio TEXT,
        fecha_fin TEXT,
        sync INTEGER DEFAULT 0
      );
    `;

      // Ejecutar la creación de tablas
      await this.db.execute(schema);
      console.log('Tablas verificadas/creadas con éxito');

      //Inspecionar campos de tablas
      const res = await this.db.query("PRAGMA table_info(tran_cparte);");
      console.log('--- Estructura de la tabla tran_cparte ---');
      res.values?.forEach(col => {
        console.log(`Campo: ${col.name} | Tipo: ${col.type} | PK: ${col.pk === 1 ? 'Sí' : 'No'}`);
      });

      const res2 = await this.db.query("PRAGMA table_info(tran_dparte);");
      console.log('--- Estructura de la tabla tran_dparte ---');
      res2.values?.forEach(col => {
        console.log(`Campo: ${col.name} | Tipo: ${col.type} | PK: ${col.pk === 1 ? 'Sí' : 'No'}`);
      });

    } catch (err) {
      console.error('Error fatal al conectar SQLite:', err);
    }
  }

  async execute(sql: string, params: any[] = []) {
    return await this.db.run(sql, params);
  }

  async query(sql: string, params: any[] = []) {
    return await this.db.query(sql, params);
  }

  async executeSet(set: any[]) {
    return await (this.db as any)['executeSet'](set);
  }

  async run(sql: string, params: any[] = []) {
    try {
      if (!this.db) {
        throw new Error("Base de datos no inicializada");
      }
      const result = await this.db.run(sql, params);

      console.log('Operación exitosa. Cambios:', result.changes?.changes);
      return result;
    } catch (err) {
      console.error('Error al ejecutar SQL (run):', err);
      throw err;
    }
  }
}