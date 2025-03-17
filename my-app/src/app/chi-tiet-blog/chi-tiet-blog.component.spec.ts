import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChiTietBlogComponent } from './chi-tiet-blog.component';

describe('ChiTietBlogComponent', () => {
  let component: ChiTietBlogComponent;
  let fixture: ComponentFixture<ChiTietBlogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChiTietBlogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChiTietBlogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
