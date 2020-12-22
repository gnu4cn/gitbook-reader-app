import { TestBed } from '@angular/core/testing';

import { CateService } from './cate.service';

describe('CateService', () => {
  let service: CateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
