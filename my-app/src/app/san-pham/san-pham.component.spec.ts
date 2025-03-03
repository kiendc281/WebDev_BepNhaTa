import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SanPhamComponent } from './san-pham.component';

describe('SanPhamComponent', () => {
  let component: SanPhamComponent;
  let fixture: ComponentFixture<SanPhamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SanPhamComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SanPhamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
