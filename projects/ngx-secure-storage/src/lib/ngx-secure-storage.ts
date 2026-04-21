import {Inject, Injectable, Optional, PLATFORM_ID} from '@angular/core';
import {SECURE_STORAGE_CONFIG, StorageConfig} from './storage.config';
import {isPlatformBrowser} from '@angular/common';
import * as CryptoJS from 'crypto-es';

/**
 * @prop useSessionStorage - Set to `true` to save to `sessionStorage`.
 * @prop ttl - Time-to-live in milliseconds. Item will be deleted after this duration.
 */
interface StoreOptions {
  useSessionStorage?: boolean;
  ttl?: number
}

@Injectable({
  providedIn: 'root',
})
export class SecureStorageService {
  private readonly prefix: string;
  private readonly alwaysUseSessionStorageSet: string[];
  private readonly encryptionKey: string;
  private readonly disableInDev: boolean;
  private readonly isDev: boolean;
  private readonly isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Optional() @Inject(SECURE_STORAGE_CONFIG) config: StorageConfig
  ) {
    if (!config) {
      console.warn('StorageService: SECURE_STORAGE_CONFIG is missing. Falling back to defaults.');
    }

    // Assign config values or safe defaults
    this.prefix = config?.prefix || '__';
    this.encryptionKey = config?.encryptionKey || '';
    this.isBrowser = config?.isBrowser ?? isPlatformBrowser(this.platformId);
    this.isDev = config?.isDev ?? (this.isBrowser ? (() => {
        const hostname = window.location.hostname;
        return (
          hostname === 'localhost' ||
          hostname === '[::1]' || // IPv6 localhost
          hostname.startsWith('127.') // Covers 127.0.0.1 and similar loopback IPs
        );
      })() : false);
    this.disableInDev = config?.disableInDev || false;
    this.alwaysUseSessionStorageSet = config?.alwaysUseSessionStorageSet || [];

    if (!this.encryptionKey) {
      console.warn('Encryption key missing. Storage encryption has been disabled.');
    }
  }

  /**
   * Generates a 256-bit key using PBKDF2.
   * This is much more secure than using the raw string directly.
   */
  private getDerivedKey(salt:any) {
    return CryptoJS.PBKDF2(this.encryptionKey, salt, {
      keySize: 256 / 32,
      iterations: 1000 // Balance between security and performance
    });
  }

  // Encrypt data
  private encrypt(data: string): string {
    if ((this.isDev && this.disableInDev) || !this.encryptionKey) return data;

    // 1. Generate a fresh random Salt (16 bytes / 4 words)
    const salt = CryptoJS.WordArray.random(128 / 8);

    // 2. Generate a fresh random Initialization Vector (IV)
    const iv = CryptoJS.WordArray.random(128 / 8);

    // 3. Encrypt using the derived key and the random IV
    const encrypted = CryptoJS.AES.encrypt(data, this.getDerivedKey(salt), {
      iv: iv,
      mode: CryptoJS.CBC,
      padding: CryptoJS.Pkcs7
    });

    // 4. Combine Salt + IV + Ciphertext WordArrays and encode the whole block as Base64
    const combined = salt.concat(iv).concat(encrypted.ciphertext!);
    return combined.toString(CryptoJS.Base64);
  }

  // Decrypt data
  private decrypt(data: string){
    if ((this.isDev && this.disableInDev) || !this.encryptionKey) return data;
    if (!data) return null;

    try {
      // 1. Extract the Salt, IV and the ciphertext
      // 1a. Decode the combined Base64 string into a WordArray
      const combined = CryptoJS.Base64.parse(data);

      // 1b. Extract the Salt (first 16 bytes / 4 words)
      const salt = CryptoJS.WordArray.create(combined.words.slice(0, 4));

      // 1c. Extract the IV (next 16 bytes / 4 words)
      const iv = CryptoJS.WordArray.create(combined.words.slice(4, 8));

      // 1d. Extract everything else as the ciphertext
      const ciphertext = CryptoJS.WordArray.create(combined.words.slice(8));


      // 2. Decrypt using the same derived key and the extracted IV and salt
      const bytes = CryptoJS.AES.decrypt({ ciphertext: ciphertext } as any, this.getDerivedKey(salt), {
        iv: iv,
        mode: CryptoJS.CBC,
        padding: CryptoJS.Pkcs7
      });

      const decrypted = bytes.toString(CryptoJS.Utf8);
      return decrypted || null;
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  /**
   * Encrypts and saves data into the browser's storage using an options object.
   * @param key - The unique identifier for the data.
   * @param value - The raw data or object to store.
   * @param options - Configuration object (useSessionStorage, ttl).
   */
  store(key: string, value: any, options?:StoreOptions ): void;

  /**
   * Encrypts and saves data into the browser's storage using positional arguments.
   * @param key - The unique identifier for the data.
   * @param value - The raw data or object to store.
   * @param useSessionStorage - Set to `true` to save to `sessionStorage`.
   * @param ttl - Time-to-live in milliseconds. Item will be deleted after this duration.
   */
  store(key: string, value: any, useSessionStorage?: boolean, ttl?: number): void;

  /**
   * Encrypts and saves data into the browser's storage.
   */
  store(
    key: string,
    value: any,
    optionsOrUseSessionStorage?: boolean | StoreOptions,
    ttlArg?: number
  ): void {
    if (!this.isBrowser) return;

    let useSessionStorage = false;
    let ttl: number | undefined;

    // Detect which overload is being used
    if (typeof optionsOrUseSessionStorage === 'object' && optionsOrUseSessionStorage !== null) {
      useSessionStorage = !!optionsOrUseSessionStorage?.useSessionStorage;
      ttl = optionsOrUseSessionStorage?.ttl;
    } else {
      useSessionStorage = !!optionsOrUseSessionStorage;
      ttl = ttlArg;
    }
    const useSessionStore = useSessionStorage || this.alwaysUseSessionStorageSet.includes(key);

    const isObject = (typeof value === 'object' && value !== null);
    const isNotEncrypted = (this.isDev && this.disableInDev);

    // Create a storage envelope to hold the data and the encrypted expiry timestamp
    const envelope = {
      data: (!isObject || isNotEncrypted) ? value : JSON.stringify(value),
      expiry: ttl ? Date.now() + ttl : null,
      isObject
    };

    const encryptedValue = this.encrypt(JSON.stringify(envelope));
    const storage = useSessionStore ? sessionStorage : localStorage;

    storage.setItem(`${this.prefix}${key}`, encryptedValue);
  }


  /**
   * Retrieves and decrypts a value from the browser's storage.
   * @param key - The unique identifier of the stored data.
   * @param useSessionStorage - Set to `true` to force reading from `sessionStorage`. If `false`, it defaults to `localStorage` (unless the key is in `alwaysUseSessionStorageSet`).
   * @returns The decrypted string, the parsed JSON object, or `null` if the item doesn't exist or decryption fails.
   */
  retrieve(key: string, useSessionStorage:boolean = false) {
    if (!this.isBrowser) return null;

    try {
      const useSessionStore = useSessionStorage || this.alwaysUseSessionStorageSet.includes(key);
      const storage = useSessionStore ? sessionStorage : localStorage;

      const encryptedValue = storage.getItem(`${this.prefix}${key}`);
      if (!encryptedValue) return null;

      const decryptedValue = this.decrypt(encryptedValue);
      if (!decryptedValue) return null;

      const envelope = JSON.parse(decryptedValue);

      // Check for expiry
      if (!!envelope?.expiry && (Date.now() > envelope.expiry)) {
        this.delete(key);
        return null;
      }

      const isNotEncrypted = (this.isDev && this.disableInDev);
      const isSavedAsRawValue = (isNotEncrypted || !(envelope?.isObject))

      const value = envelope.data;
      return isSavedAsRawValue ? value : JSON.parse(value || 'null');

    } catch (error) {
      console.error(error);
    }

    return null;
  }

  /**
   * Removes a specific item from both `localStorage` and `sessionStorage`.
   * @param key - The unique identifier of the data to remove (without the prefix).
   */
  delete(key: string) {
    if (this.isBrowser) {
      localStorage.removeItem(`${this.prefix}${key}`);
      sessionStorage.removeItem(`${this.prefix}${key}`);
    }
  }

  /**
   * Scans all service-defined storage items and removes those that have expired.
   */
  clearExpired() {
    return new Promise<void>(resolve => {
      if (!this.isBrowser) {
        resolve();
        return;
      }

      [localStorage, sessionStorage].forEach(storage => {
        Object.keys(storage).forEach(fullKey => {
          if (fullKey.startsWith(this.prefix)) {
            const keyWithoutPrefix = fullKey.replace(this.prefix, '');
            // Calling retrieve() automatically handles the deletion logic if expired
            this.retrieve(keyWithoutPrefix);
          }
        });
      });

      resolve();
    });
  }


  /**
   * Removes all storage items from both `localStorage` and `sessionStorage`.
   *
   * It can be set to be specific to just `ngx-secure-storage` service defined keys _only_,
   * or your entire application storage items.
   *
   * @param entireStorage - Choose if you want the entire local and session storage to be cleared.
   * Default is `false` so only keys defined by this service are removed/cleared.
   */
   clearAll(entireStorage = false) {
    return new Promise<void>(resolve => {
      if (!this.isBrowser) {
        resolve();
        return;
      }

      if (entireStorage) {
        localStorage.clear();
        sessionStorage.clear();
      } else {
        [localStorage, sessionStorage].forEach(storage => {
          Object.keys(storage).forEach(key => {
            if (key.startsWith(this.prefix)) {
              storage.removeItem(key);
            }
          });
        })
      }

      resolve();
    });
  }
}
