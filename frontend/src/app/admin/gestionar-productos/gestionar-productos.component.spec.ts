import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionarProductosComponent } from './gestionar-productos.component';

describe('GestionarProductosComponent', () => {
  let component: GestionarProductosComponent;
  let fixture: ComponentFixture<GestionarProductosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionarProductosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionarProductosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
