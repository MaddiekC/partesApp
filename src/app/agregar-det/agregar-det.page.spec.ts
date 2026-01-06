import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgregarDetPage } from './agregar-det.page';

describe('AgregarDetPage', () => {
  let component: AgregarDetPage;
  let fixture: ComponentFixture<AgregarDetPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AgregarDetPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
