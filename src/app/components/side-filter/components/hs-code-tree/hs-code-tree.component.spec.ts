import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HsCodeTreeComponent } from './hs-code-tree.component';

describe('HsCodeTreeComponent', () => {
  let component: HsCodeTreeComponent;
  let fixture: ComponentFixture<HsCodeTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HsCodeTreeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HsCodeTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
