import { TestBed } from '@angular/core/testing';

import { WriterService } from './writer.service';

describe('WriterService', () => {
  let service: WriterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WriterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
