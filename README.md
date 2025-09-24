# Passenger

Passenger is a lightweight in-browser password generator and manager. It turns a single high-entropy master passkey plus a usage tag (for example `google:martha2011`) into a reproducible passphrase that you can paste wherever you need it. Nothing ever leaves your device—it runs entirely inside your browser using the Web Crypto API, so there is no server, sync service, or database to breach.

## How Passenger Works

1. **You provide:**
   - A master passkey you memorise and never share.
   - A usage tag that identifies where the password will be used (site, account, context).

2. **Passenger derives a per-usage secret:**
   - The master passkey is stretched with PBKDF2-HMAC-SHA-256 using 3,000,000 iterations. The salt is deterministic (`SHA-256("salt|" + usage)`), so the same inputs always regenerate the same secret without storing anything.

3. **HKDF splits that secret into two streams:**
   - A `password` stream becomes your human-friendly passphrase.
   - A `compliance` stream controls a numeric tail so the result satisfies common “must include digits” rules without weakening entropy.

4. **The passphrase is rendered in Bytewords:**
   - The password stream is mapped to the 256-word Bytewords list. The output looks like `Luau-Nail-Item-...`—easy to read, hard to brute force.
   - Four deterministic digits are appended with a hyphen (for example `Luau-Nail-Item-4823`).

Because every transformation is deterministic, you can regenerate the same password any time by re-entering the same passkey and usage tag. If either input changes, the output changes completely.

## Using Passenger

- Enter your master passkey in the top field. Use a long, unique phrase—you are the only one who needs to remember it.

- Enter a usage tag in lowercase without spaces (Passenger will sanitise it). Combine the service name with something that makes the context clear, such as `banking:joint-checking` or `aws:root-admin`.

- After a short pause, Passenger shows the generated passphrase and (by default) copies it to your clipboard. Toggle **Auto-Copy** off if you prefer manual copying.

- Paste the passphrase where it is needed. You can regenerate it on any device that runs Passenger by using the same passkey and usage tag.

## Security Model at a Glance

- **Local-only:** All cryptography runs in your browser. Passenger stores nothing and makes no network requests.

- **Modern primitives:** PBKDF2 and HKDF with SHA-256 are provided by the browser’s Web Crypto API; keys never touch JavaScript implementations.

- **Deterministic salts:** Salts derived from the usage tag prevent rainbow-table reuse while keeping results reproducible.

- **Entropy preservation:** Bytewords encoding keeps the full entropy of the derived bytes; the appended digits are drawn from an independent HKDF stream.

- **Clipboard caution:** If you leave Auto-Copy on, be mindful of other apps that can read your clipboard. Clear it once you are done if you are on a shared machine.

## Good Practices

- Protect your master passkey — treat it like the keys to your entire vault.

- Pick unambiguous usage tags, and keep a personal convention so you can remember them later.

- Consider printing or securely storing emergency reminders of your passkey and tag scheme in case you forget.

- Regenerate rather than reuse passwords. If a site is compromised, switch to a new usage tag (e.g. append `-v2`) and Passenger will give you a completely different password.

Passenger is designed for privacy-conscious users who want deterministic, high-entropy passwords without relying on cloud storage or proprietary extensions. Open the `index.html` file in any modern browser to start using it offline.
