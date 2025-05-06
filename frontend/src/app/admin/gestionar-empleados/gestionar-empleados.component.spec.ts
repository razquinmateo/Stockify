import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionarEmpleadosComponent } from './gestionar-empleados.component';

describe('GestionarEmpleadosComponent', () => {
  let component: GestionarEmpleadosComponent;
  let fixture: ComponentFixture<GestionarEmpleadosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionarEmpleadosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionarEmpleadosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});