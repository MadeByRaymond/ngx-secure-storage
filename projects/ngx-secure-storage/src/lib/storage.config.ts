import { InjectionToken } from '@angular/core';

export interface SecureStorageConfig {
  /**
   * The secret key used for AES encryption.
   * If left blank, encryption is bypassed (disabled).
   */
  encryptionKey: string;
  /**
   * The secret salt used to derive a strong key from your encryptionKey using `PBKDF2`.
   * If left blank, defaults to a default public salt.
   *
   * Note: For production, consider using a static salt or storing one per-user _based on your use-case_
   */
  salt?: string;
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

export const SECURE_STORAGE_CONFIG = new InjectionToken<SecureStorageConfig>(
  'SECURE_STORAGE_CONFIG'
);
