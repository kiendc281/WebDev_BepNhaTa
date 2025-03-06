import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NhapmaComponent } from './nhapma.component';

describe('NhapmaComponent', () => {
  let component: NhapmaComponent;
  let fixture: ComponentFixture<NhapmaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NhapmaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NhapmaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
