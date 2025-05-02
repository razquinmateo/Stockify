import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerSucursalesComponent } from './ver-sucursales.component';

describe('VerSucursalesComponent', () => {
  let component: VerSucursalesComponent;
  let fixture: ComponentFixture<VerSucursalesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerSucursalesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerSucursalesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
