# ngx-secure-storage

> A lightweight, SSR-compatible Angular service to securely store, retrieve, and manage encrypted data in `localStorage` and `sessionStorage` using AES encryption.

![npm](https://img.shields.io/npm/v/ngx-secure-storage)
![Angular](https://img.shields.io/badge/angular-compatible-brightgreen)
![NPM Downloads](https://img.shields.io/npm/d18m/ngx-secure-storage)
![License](https://img.shields.io/npm/l/ngx-secure-storage)

**The best way to quickly integrate secure, encrypted client-side storage in Angular.**

Note that this package has been optimized to work best with Angular, but you can still use [secure-storage-ts](https://www.npmjs.com/package/secure-storage-ts) for your project if you prefer to work with vanilla JS/TS.

---

## 🚀 Features

- ✅ **AES Encryption:** Secures data under the hood using `crypto-es`.
- ✅ **TTL (Time-To-Live):** Set expiry times on your storage items. They automatically clear out when expired!
- ✅ **SSR-Compatible:** Safely verifies the browser environment before accessing storage.
- ✅ **Smart Dev Mode:** Auto-detects `localhost` to optionally bypass encryption for easier debugging.
- ✅ **Storage Routing:** Easily route specific keys permanently to `sessionStorage`.
- ✅ **Prefixing:** Auto-appends prefixes to keys to prevent collisions with other apps.
- ✅ **Automatic Parsing:** Built-in JSON stringify and parse support for complex objects.

---

## 📦 Installation

Since this package relies on `crypto-es` for robust encryption, ensure you install it as well _(however for NPM 7+, peer-dependencies should be installed automatically)_:

```bash
npm install ngx-secure-storage
```

---

## 🔧 Setup
You can configure the service globally by providing the `SECURE_STORAGE_CONFIG` token in your `AppModule` (or `app.config.ts` for standalone applications).

```ts
import { StorageConfig, SECURE_STORAGE_CONFIG } from 'ngx-secure-storage';

@NgModule({
  providers: [
    {
      provide: SECURE_STORAGE_CONFIG,
      useValue: {
        encryptionKey: environment.storageKey, // Your secret AES key
        salt: environment.storageSalt, // Custom salt for PBKDF2 (optional but recommended)
        prefix: 'MY_APP_',
        disableInDev: true, // Bypasses encryption on localhost
        isDev: environment.isDev, // Check if is running locally or in development
        alwaysUseSessionStorageSet: ['PAYMENT_INFO', 'TEMP_TOKEN'],
        // ...other configuration settings
      } as StorageConfig
    }
  ]
})
export class AppModule {}
```

Or for standalone applications, in `app.config.ts`:

```ts
import { StorageConfig, SECURE_STORAGE_CONFIG } from 'ngx-secure-storage';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other angular providers
    {
      provide: SECURE_STORAGE_CONFIG,
      useValue: {
        encryptionKey: environment.storageKey, // Your secret AES key
        // ...other configuration settings
      } as StorageConfig
    },
  ],
};
```
### Additional Configurations:
Configuration settings can be provided to customize how data is encrypted and stored:

| Property                     | Description                                                                                                                                   | Required? | Default                 |
|------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|-----------|-------------------------|
| `encryptionKey`              | The secret key used for AES encryption. If left empty, encryption is bypassed.                                                         b      | Yes       | `''`                    |
| `salt`                       | The secret salt used to derive a strong key from your encryptionKey using `PBKDF2`. For production, consider using a static or per-user salt. | optional  | _Internal default salt_ |
| `disableInDev`               | If true, bypasses encryption entirely when running in a development environment.                                                              | optional  | `false`                 |
| `isDev`                      | Flags the environment as dev. If omitted, the service auto-detects based on localhost or loopback IPs.                                        | optional  | _Auto-detected_         |
| `isBrowser`                  | Explicitly set if the app is in a browser. If omitted, it defaults to checking Angular's `PLATFORM_ID`.                                       | optional  | _Auto-detected_         |
| `prefix`                     | A prefix appended to all storage keys to prevent collisions.                                                                                  | optional  | `__`                    |
| `alwaysUseSessionStorageSet` | An array of exact keys that should always be forced into `sessionStorage` instead of `localStorage`.                                          | optional  | `[]`                    |

<i>💡 Tip: Importing `StorageConfig` in your useValue ensures type-safety and IntelliSense autocompletion when setting configuration properties.</i>

---

## 🧠 Usage

Inject the service into your components or other services to easily store and retrieve data.
```ts
import { SecureStorageService } from 'ngx-secure-storage';

export class StorageComponent {
  stored_data;

  constructor(private storage: SecureStorageService) { }

  storeData(key:string, data:any){
    this.storage.store(key, data, false, 3600000);
  }

  getData(key:string){
    this.stored_data = this.storage.retrieve(key);
  }

  deleteData(key:string){
    this.storage.delete(key);
    this.stored_data = null;
  }

  clearDataStore() {
    this.storage.clearAll();
  }
}
```

---

### Full Usage Example:
```ts
import { Component, OnInit } from '@angular/core';
import { SecureStorageService } from 'ngx-secure-storage';

@Component({
  selector: 'app-user-profile',
  template: `...`
})
export class UserProfileComponent implements OnInit {

  constructor(private storage: SecureStorageService) {}

  ngOnInit() {
    // 1. Store a simple string
    this.storage.store('USER_THEME', 'dark');

    // 2. Store a complex object WITH a Time-To-Live (expires in 1 hour)
    const userData = { name: 'Daniel', role: 'Admin' };
    this.storage.store('USER_DATA', userData, {
      ttl: 3600000, // Time-to-live in milliseconds
    });

    // 3. Retrieve and automatically parse the JSON object
    // (If 1 hour has passed, this will automatically delete the item and return null)
    const retrievedUser = this.storage.retrieve('USER_DATA');
    console.log(retrievedUser?.name); // 'Daniel'
  }

  logout() {
    // 4. Delete data
    this.storage.delete('USER_DATA');
    this.storage.delete('USER_THEME');
  }

  cleanup() {
    // 5. Clear out all items that have passed their TTL expiry
    this.storage.clearExpired();

    // OR: Safely wipe all keys created by this service (ignores other app data)
    this.storage.clearAll();
  }
}
```

---

## 🔑 Methods

| Method                | Parameters                                                                                                                                                                                                                                                                                                                                                                                                                 | Description                                                                                                                                            |
|-----------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| store(`...params`)    | - `key` - The unique identifier for the data. The config prefix is automatically appended. <br/><br/>- `value` - The raw data or object to store. <br/><br/>- `useSessionStorage` - Set to `true` to save to _sessionStorage_. If `false`, it defaults to _localStorage_ (unless the key is in `alwaysUseSessionStorageSet`).  <br/><br/>- `ttl` - Time-to-live in milliseconds. Item will be deleted after this duration. | Encrypts and saves data. <br/><br/>You can also just pass the `options` object which accepts `{ useSessionStorage, ttl }`, after the `value` params    |
| retrieve(`...params`) | - `key` - The unique identifier of the stored data. <br/><br/>- `useSessionStorage` - Set to `true` to force reading from _sessionStorage_. If `false`, it defaults to _localStorage_ (unless the key is in `alwaysUseSessionStorageSet`).                                                                                                                                                                                 | Retrieves and decrypts data. Auto-deletes and returns null if the item's TTL has expired.                                                              |
| delete(`...params`)   | `key` - The unique identifier of the data to remove (without the prefix).                                                                                                                                                                                                                                                                                                                                                  | Removes the specified key from both localStorage and sessionStorage.                                                                                   |
| clearExpired()        | _none_                                                                                                                                                                                                                                                                                                                                                                                                                     | Scans all service-defined storage items and permanently removes any that have passed their TTL. Returns a Promise.                                     |
| clearAll(`...params`) | `entireStorage` - Choose if you want the entire local and session storage to be cleared. <br/>Default is `false` so only keys defined by this service are removed/cleared.                                                                                                                                                                                                                                                 | Removes all storage items. Defaults to false (only clears items with your configured prefix). If true, runs a global .clear() on all browser storage.  |

---

## ⚙️ Configuration Summary

| Feature        | Customizable                     | Default Behavior                             |
|----------------|----------------------------------|----------------------------------------------|
| Encryption     | ✅ `encryptionKey`                | Encrypts via `crypto-es` AES                 |
| Dev Mode       | ✅ `disableInDev`, `isDev`        | Auto-detects `localhost` / `127.0.0.1`       |
| Storage Target | ✅ `alwaysUseSessionStorageSet`   | Defaults to `localStorage` unless overridden |
| SSR Safety     | ✅ `isBrowser`                    | Uses Angular's `@Inject(PLATFORM_ID)`        |

---

## 🧪 Development

```bash
# Run tests
ng test ngx-secure-storage

# Build for production
ng build ngx-secure-storage
```

---

## 🔧 Troubleshooting

If you are getting an error like this:

``
Module not found: Error: Can't resolve 'crypto-es' in ...
``.

Simply install the `crypto-es` package and this would be resolved:
```bash
npm install crypto-es
```

The reason is that for older npm version `NPM < 7`, peer-dependencies may not install automatically. 

Or if you install packages using the flags `--legacy-peer-deps` or `--force`, this would essentially tell npm
to fallback to an earlier (legacy) version which does not automatically install peer-dependencies. You would 
have to now manually define the peer deps from the package to install. In this case `crypto-es`.

---

## 🔒 License

Apache-2.0 © MadeByRaymond (Daniel Obiekwe)

---

## ❤️ Support

If you find this package helpful, you can support our projects here:

[![Buy Me a Smoothie](https://img.buymeacoffee.com/button-api/?text=Buy%20Me%20a%20Smoothie&emoji=🍹&slug=MadeByRaymond&button_colour=FFDD00&font_colour=000000&font_family=Comic&outline_colour=000000&coffee_colour=ffffff)](https://www.buymeacoffee.com/MadeByRaymond)
