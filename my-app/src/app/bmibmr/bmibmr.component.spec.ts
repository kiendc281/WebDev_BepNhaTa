import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BmibmrComponent } from './bmibmr.component';

describe('BmibmrComponent', () => {
  let component: BmibmrComponent;
  let fixture: ComponentFixture<BmibmrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BmibmrComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BmibmrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
