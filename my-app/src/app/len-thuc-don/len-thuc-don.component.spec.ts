import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LenThucDonComponent } from './len-thuc-don.component';

describe('LenThucDonComponent', () => {
  let component: LenThucDonComponent;
  let fixture: ComponentFixture<LenThucDonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LenThucDonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LenThucDonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
