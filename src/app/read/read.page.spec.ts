import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ReadPage } from './read.page';

describe('ReadPage', () => {
  let component: ReadPage;
  let fixture: ComponentFixture<ReadPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReadPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ReadPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
