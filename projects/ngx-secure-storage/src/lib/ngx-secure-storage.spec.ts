import { TestBed } from '@angular/core/testing';

import { SecureStorageService } from './ngx-secure-storage';

describe('SecureStorageService', () => {
  let service: SecureStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SecureStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
