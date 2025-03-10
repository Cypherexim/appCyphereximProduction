import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadModelComponent } from './download-model.component';

describe('DownloadModelComponent', () => {
  let component: DownloadModelComponent;
  let fixture: ComponentFixture<DownloadModelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DownloadModelComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DownloadModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
