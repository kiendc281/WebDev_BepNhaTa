import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CongThucComponent } from './cong-thuc.component';

describe('CongThucComponent', () => {
  let component: CongThucComponent;
  let fixture: ComponentFixture<CongThucComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CongThucComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CongThucComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
