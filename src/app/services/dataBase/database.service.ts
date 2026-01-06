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
    // 1. Crear conexión
    this.db = await this.sqlite.createConnection(
      'PartesApp.db',
      false,
      'no-encryption',
      1,
      false
    );

    // 2. Abrir la base de datos
    await this.db.open();
  }

  async execute(sql: string, params: any[] = []) {
    return await this.db.run(sql, params);
  }

  async query(sql: string, params: any[] = []) {
    // Para SELECT
    return await this.db.query(sql, params);
  }
}