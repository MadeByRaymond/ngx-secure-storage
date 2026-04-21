import { InjectionToken } from '@angular/core';

/**
 * Configuration Interface for `ngx-secure-storage` Injection Token `SECURE_STORAGE_CONFIG`
 */
export interface StorageConfig {
  /**
   * The secret key used for AES encryption.
   * If left blank, encryption is bypassed (disabled).
   */
  encryptionKey: string;
  /**
   * If true, bypasses encryption entirely when `isDev` is true.
   * @default false
   */
  disableInDev?: boolean;
  /**
   * Flags the environment as development.
   * If omitted, the service will auto-detect based on localhost or loopback IPs.
   */
  isDev?: boolean;
  /**
   * Explicitly set if the app is running in a browser environment.
   * If omitted, it defaults to checking Angular's `PLATFORM_ID`.
   */
  isBrowser?: boolean;
  /**
   * A prefix appended to all storage keys to prevent collisions with other apps.
   * @default '__'
   */
  prefix?: string;
  /**
   * An array of exact storage keys that should always be forced into
   * `sessionStorage` instead of `localStorage`, overriding default behavior.
   *
   * Useful for keys you always need stored in the browser session storage
   * e.g: `PAYMENT_SESSION_INFORMATION`.
   *
   * Note that this is not the only way to use `sessionStorage`.
   * You can also pass into the `retrieve` and `store` methods, the param for `useSessionStorage`.
   */
  alwaysUseSessionStorageSet?: string[];
}

/**
 * `ngx-secure-storage` Injection Token `SECURE_STORAGE_CONFIG`.
 *
 * Use values with type `StorageConfig`.
 */
export const SECURE_STORAGE_CONFIG = new InjectionToken<StorageConfig>(
  'SECURE_STORAGE_CONFIG'
);
