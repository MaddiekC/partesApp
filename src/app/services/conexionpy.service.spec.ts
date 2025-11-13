import { TestBed } from '@angular/core/testing';

import { ConexionpyService } from './conexionpy.service';

describe('ConexionpyService', () => {
  let service: ConexionpyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConexionpyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
