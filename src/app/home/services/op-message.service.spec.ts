import { TestBed } from '@angular/core/testing';

import { OpMessageService } from './op-message.service';

describe('OpMessageService', () => {
  let service: OpMessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpMessageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
