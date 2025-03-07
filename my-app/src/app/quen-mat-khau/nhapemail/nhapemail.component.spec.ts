import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NhapemailComponent } from './nhapemail.component';

describe('NhapemailComponent', () => {
  let component: NhapemailComponent;
  let fixture: ComponentFixture<NhapemailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NhapemailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NhapemailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
