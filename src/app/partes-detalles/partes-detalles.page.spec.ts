import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PartesDetallesPage } from './partes-detalles.page';

describe('PartesDetallesPage', () => {
  let component: PartesDetallesPage;
  let fixture: ComponentFixture<PartesDetallesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PartesDetallesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
