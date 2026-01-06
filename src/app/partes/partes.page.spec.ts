import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PartesPage } from './partes.page';

describe('PartesPage', () => {
  let component: PartesPage;
  let fixture: ComponentFixture<PartesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PartesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
