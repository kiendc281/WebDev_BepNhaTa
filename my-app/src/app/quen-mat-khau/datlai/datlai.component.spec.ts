import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatlaiComponent } from './datlai.component';

describe('DatlaiComponent', () => {
  let component: DatlaiComponent;
  let fixture: ComponentFixture<DatlaiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatlaiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DatlaiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
