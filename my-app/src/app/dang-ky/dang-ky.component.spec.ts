import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DangKyComponent } from './dang-ky.component';

describe('DangKyComponent', () => {
  let component: DangKyComponent;
  let fixture: ComponentFixture<DangKyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DangKyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DangKyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
