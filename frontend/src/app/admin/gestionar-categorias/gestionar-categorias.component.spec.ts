import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionarCategoriasComponent } from './gestionar-categorias.component';

describe('GestionarCategoriasComponent', () => {
  let component: GestionarCategoriasComponent;
  let fixture: ComponentFixture<GestionarCategoriasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionarCategoriasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionarCategoriasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});