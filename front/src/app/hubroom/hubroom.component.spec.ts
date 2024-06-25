import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HubroomComponent } from './hubroom.component';

describe('HubroomComponent', () => {
  let component: HubroomComponent;
  let fixture: ComponentFixture<HubroomComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HubroomComponent]
    });
    fixture = TestBed.createComponent(HubroomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
