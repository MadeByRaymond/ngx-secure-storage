import { getTestBed, TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { SecureStorageService } from './ngx-secure-storage';
import { SECURE_STORAGE_CONFIG } from './storage.config';

// 🚀 Safely initialize the Angular testing environment
const testBed = getTestBed();
if (!testBed.platform) {
  testBed.initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting()
  );
}

describe('SecureStorageService', () => {
  let service: SecureStorageService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        SecureStorageService,
        {
          provide: SECURE_STORAGE_CONFIG,
          useValue: {
            encryptionKey: 'test-secret-key',
            prefix: 'TEST_',
            isDev: false // Force production mode so encryption actually runs
          }
        }
      ]
    });
    service = TestBed.inject(SecureStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should encrypt data before saving to localStorage', () => {
    const testData = 'Sensitive User Data';
    service.store('USER_DATA', testData);

    // Check the raw localStorage to ensure it is NOT plain text
    const rawStoredValue = localStorage.getItem('TEST_USER_DATA');

    expect(rawStoredValue).toBeTruthy();
    expect(rawStoredValue).not.toContain(testData); // Proves it was encrypted
  });

  it('should encrypt data before saving to sessionStorage', () => {
    const testData = 'Sensitive User Data';
    service.store('USER_DATA', testData, { useSessionStorage: true });

    // Check the raw sessionStorage to ensure it is NOT plain text
    const rawStoredValue = sessionStorage.getItem('TEST_USER_DATA');

    expect(rawStoredValue).toBeTruthy();
    expect(rawStoredValue).not.toContain(testData); // Proves it was encrypted
  });

  it('should successfully retrieve and decrypt data', () => {
    service.store('TOKEN', '12345-ABCDE');

    const retrieved = service.retrieve('TOKEN');
    expect(retrieved).toBe('12345-ABCDE');
  });

  it('should store and automatically parse complex JSON objects', () => {
    const userObj = { name: 'Daniel', role: 'Admin' };

    service.store('USER_OBJ', userObj);

    // Pass true as the second argument to tell retrieve() to parse it
    const retrieved = service.retrieve('USER_OBJ');

    expect(retrieved).toEqual(userObj);
    expect(retrieved.name).toBe('Daniel');
  });

  it('should save to sessionStorage when specified', () => {
    service.store('TEMP_DATA', 'SessionOnly', { useSessionStorage: true });

    expect(sessionStorage.getItem('TEST_TEMP_DATA')).toBeTruthy();
    expect(localStorage.getItem('TEST_TEMP_DATA')).toBeNull();
  });

  it('should handle TTL (Time-To-Live) expiration correctly with setTimeout', async () => {
    // 1. Set a very short TTL (50ms) so the test runs instantly
    const ttlTime = 50;

    // 2. Store an item with the short TTL
    service.store('EXPIRES_SOON', 'ExpiringData', { ttl: ttlTime });

    // 3. Immediately retrieve it (should exist)
    expect(service.retrieve('EXPIRES_SOON')).toBe('ExpiringData');

    // 4. Create an async delay that waits slightly longer than the TTL (e.g., 100ms)
    await new Promise(resolve => setTimeout(resolve, ttlTime + 50));

    // 5. Retrieve it again (should be null and deleted from storage)
    expect(service.retrieve('EXPIRES_SOON')).toBeNull();
    expect(localStorage.getItem('TEST_EXPIRES_SOON')).toBeNull();
  });

  it('should clear only service-defined keys using clearAll(false)', async () => {
    // Add external data not managed by the service
    localStorage.setItem('EXTERNAL_KEY', 'Do Not Delete Me');

    // Add service data
    service.store('MY_KEY', 'Delete Me');

    await service.clearAll();

    expect(service.retrieve('MY_KEY')).toBeNull(); // Service data is gone
    expect(localStorage.getItem('EXTERNAL_KEY')).toBe('Do Not Delete Me'); // External data remains
  });

  it('should explicitly clear only expired items using clearExpired()', async () => {
    // 1. Store mixed data types
    service.store('EXPIRES_FAST', 'I will disappear', { ttl: 50 }); // Expires in 50ms
    service.store('EXPIRES_SLOW', 'I will stay', { ttl: 10000 });   // Expires in 10s
    service.store('NO_EXPIRY', 'I live forever');                   // Never expires

    // 2. Wait for 100ms (This pushes EXPIRES_FAST past its TTL)
    await new Promise(resolve => setTimeout(resolve, 100));

    // 3. Run the garbage collection
    await service.clearExpired();

    // 4. Assert EXPIRES_FAST is completely gone from the raw browser storage
    expect(localStorage.getItem('TEST_EXPIRES_FAST')).toBeNull();

    // 5. Assert the other items are still perfectly intact
    expect(service.retrieve('EXPIRES_SLOW')).toBe('I will stay');
    expect(service.retrieve('NO_EXPIRY')).toBe('I live forever');
  });
});
