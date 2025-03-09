import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChiTietCongThucComponent } from './chi-tiet-cong-thuc.component';

describe('ChiTietCongThucComponent', () => {
  let component: ChiTietCongThucComponent;
  let fixture: ComponentFixture<ChiTietCongThucComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChiTietCongThucComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChiTietCongThucComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
