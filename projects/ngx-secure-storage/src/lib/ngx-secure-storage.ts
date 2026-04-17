import {Inject, Injectable, Optional, PLATFORM_ID} from '@angular/core';
import {SECURE_STORAGE_CONFIG, SecureStorageConfig} from './storage.config';
import {isPlatformBrowser} from '@angular/common';
import * as CryptoJS from 'crypto-ts';

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
    @Optional() @Inject(SECURE_STORAGE_CONFIG) config: SecureStorageConfig
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
  }

  // Encrypt data
  private encrypt(data: string): string {
    if ((this.isDev && this.disableInDev) || !this.encryptionKey) return data;
    return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
  }

  // Decrypt data
  private decrypt(data: string){
    if ((this.isDev && this.disableInDev) || !this.encryptionKey) return data;
    try {
      const bytes = CryptoJS.AES.decrypt(data, this.encryptionKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  /**
   * Encrypts and saves data into the browser's storage.
   * @param key - The unique identifier for the data. The config prefix is automatically appended.
   *
   * @param value - The raw data or object to store.
   *
   * @param stringify - Set to `true` if you are storing an object/array so it can be JSON stringified before encryption.
   *
   * @param useSessionStorage - Set to `true` to save to `sessionStorage`. If `false`, it defaults to `localStorage` (unless the key is in `alwaysUseSessionStorageSet`).
   */
  store(key: string, value: any, stringify:boolean = false, useSessionStorage:boolean = false) {
    const useSessionStore = useSessionStorage || this.alwaysUseSessionStorageSet.includes(key);
    const encryptedValue = this.encrypt(stringify ? JSON.stringify(value) : value);

    if (this.isBrowser) {
      if (useSessionStore) {
        sessionStorage.setItem(`${this.prefix}${key}`, encryptedValue);
        return;
      }

      localStorage.setItem(`${this.prefix}${key}`, encryptedValue);
    }
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
   * Retrieves and decrypts a value from the browser's storage.
   * @param key - The unique identifier of the stored data.
   * @param parseToJSON - Set to `true` if the stored data was stringified and needs to be parsed back into a JS Object/Array.
   * @param useSessionStorage - Set to `true` to force reading from `sessionStorage`. If `false`, it defaults to `localStorage` (unless the key is in `alwaysUseSessionStorageSet`).
   * @returns The decrypted string, the parsed JSON object, or `null` if the item doesn't exist or decryption fails.
   */
  retrieve(key: string, parseToJSON = false, useSessionStorage:boolean = false) {
    const useSessionStore = useSessionStorage || this.alwaysUseSessionStorageSet.includes(key);

    if (this.isBrowser) {
      try {
        const encryptedValue = useSessionStore
          ? sessionStorage.getItem(`${this.prefix}${key}`)
          : localStorage.getItem(`${this.prefix}${key}`);

        if (encryptedValue) {
          const decryptedValue = this.decrypt(encryptedValue);
          return !!parseToJSON ? JSON.parse(decryptedValue || 'null') : decryptedValue;
        }

        return null;

      } catch (error) {
        console.error(error);
        return null
      }
    }

    return null;

  }
}
