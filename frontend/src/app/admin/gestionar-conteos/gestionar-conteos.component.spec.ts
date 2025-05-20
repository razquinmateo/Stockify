import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionarConteosComponent } from './gestionar-conteos.component';

describe('GestionarConteosComponent', () => {
  let component: GestionarConteosComponent;
  let fixture: ComponentFixture<GestionarConteosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionarConteosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionarConteosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
