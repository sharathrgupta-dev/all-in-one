export interface Faq {
  q: string;
  a: string;
}

export const TOOL_FAQS: Record<string, Faq[]> = {
  "json-formatter": [
    {
      q: "What is a JSON formatter?",
      a: "A JSON formatter parses raw JSON text and outputs it with consistent indentation and line breaks, making nested objects and arrays easy to read. It also validates the syntax and reports errors with the exact line and column number.",
    },
    {
      q: "Why is my JSON invalid?",
      a: "The most common causes are: trailing commas after the last item in an object or array, single-quoted strings instead of double-quoted, unquoted property keys, or comments (JSON does not support comments). The formatter highlights the exact position of the error.",
    },
    {
      q: "Can I format minified or compressed JSON?",
      a: "Yes. Paste any minified JSON — even a single-line blob with no whitespace — and the formatter will expand it into a readable, properly indented structure. You can also go the other way and minify readable JSON to a single line.",
    },
    {
      q: "Is my JSON data safe to paste here?",
      a: "Completely. The JSON formatter runs entirely in your browser using JavaScript. No data is sent to any server, stored, or logged. You can verify this by checking the browser Network tab — no requests are made when you format.",
    },
    {
      q: "What is the difference between pretty-printing and minifying JSON?",
      a: "Pretty-printing adds whitespace (indentation and newlines) to make the JSON human-readable. Minifying removes all unnecessary whitespace to reduce file size — useful for API responses and production builds where every byte counts.",
    },
  ],

  json: [
    {
      q: "What is a JSON formatter?",
      a: "A JSON formatter takes compact, unindented JSON and adds whitespace, line breaks, and indentation to make it human-readable. It is the opposite of a JSON minifier, which removes all whitespace to reduce file size.",
    },
    {
      q: "Is my JSON data safe to paste here?",
      a: "Yes. All processing happens in your browser using JavaScript. Your JSON is never sent to a server, stored, or logged. The DevBench JSON toolkit is 100% client-side.",
    },
    {
      q: "What is the difference between format and minify?",
      a: "Format (beautify) adds indentation and newlines — ideal for debugging and reading. Minify removes all whitespace — ideal for production API responses and config files where smaller payload size matters.",
    },
    {
      q: 'What causes "unexpected token" errors in JSON?',
      a: "The most common causes are: trailing commas after the last property or array item, single quotes instead of double quotes, unquoted object keys, JavaScript-style comments (JSON does not support // or /* */), and undefined or NaN values which are not valid JSON.",
    },
  ],

  "base64-encode": [
    {
      q: "What is Base64 encoding?",
      a: "Base64 is an encoding scheme that converts binary data (or any text) into a string of 64 ASCII characters (A–Z, a–z, 0–9, +, /). It is used to safely transmit binary data over channels that only support text, such as email bodies or JSON payloads.",
    },
    {
      q: "Is Base64 the same as encryption?",
      a: "No. Base64 is encoding, not encryption — it is fully reversible without any key. Anyone who sees a Base64 string can decode it instantly. Never use Base64 to hide sensitive data; use a proper encryption algorithm like AES-256 instead.",
    },
    {
      q: "When is Base64 commonly used?",
      a: "Base64 is used for: embedding images in HTML/CSS as data URIs (data:image/png;base64,...), storing binary data in JSON, encoding email attachments (MIME), passing binary payloads in URLs, and storing cryptographic keys in PEM format.",
    },
    {
      q: "How do I decode a Base64 string in JavaScript?",
      a: "Use the built-in `atob()` function: `atob('SGVsbG8=')` returns 'Hello'. To encode, use `btoa('Hello')`. For binary files or non-ASCII text, use a Uint8Array and TextDecoder for correct Unicode handling.",
    },
    {
      q: "What is the difference between Base64 and Base64URL?",
      a: "Base64URL is a URL-safe variant that replaces + with - and / with _ and omits the = padding character. It is used in JWTs, OAuth tokens, and anywhere the standard + and / characters would need percent-encoding in a URL.",
    },
  ],

  "base64-decode": [
    {
      q: "Is Base64 a form of encryption?",
      a: "No. Base64 is an encoding scheme, not encryption. Anyone with the encoded string can decode it instantly without a key. For actual encryption, use the AES-256-GCM Encryptor tool on DevBench.",
    },
    {
      q: "Why does Base64 output end with == or =?",
      a: "Base64 encodes groups of 3 bytes into 4 characters. When the input length is not divisible by 3, one or two padding characters (=) are added to complete the final group to a multiple of 4.",
    },
    {
      q: "What is the difference between Base64 and Base64URL?",
      a: "Standard Base64 uses + and / characters which have special meaning in URLs. Base64URL replaces + with -, / with _, and removes padding (=). It is safe to use in URLs, query strings, and JWT tokens without percent-encoding.",
    },
  ],

  "regex-tester": [
    {
      q: "What regex flavour does this tool use?",
      a: "The tester uses JavaScript's built-in RegExp engine (ECMAScript 2022+), which supports named capturing groups, lookbehind assertions, Unicode property escapes (\\p{L}), the dotAll (s) flag, and the sticky (y) flag. It does not support PCRE-only features like \\K or recursive patterns.",
    },
    {
      q: "What does the g (global) flag do?",
      a: "Without the g flag, a regex stops after the first match. With g, it finds all non-overlapping matches in the string. Most operations in this tester (match count, highlighting, substitution) implicitly behave as if g is set regardless of the flag selection.",
    },
    {
      q: "How do I match a literal dot or other special character?",
      a: "Escape it with a backslash: \\. matches a literal dot (without the backslash, . matches any character except newline). Other characters that need escaping: \\ ^ $ . | ? * + ( ) [ ] { }.",
    },
    {
      q: "What is a capturing group and how do I use it?",
      a: "Parentheses create a capturing group: (\\d{4}) captures four digits. In the substitution field, reference it as $1 (first group), $2 (second), etc. Use (?:...) for a non-capturing group when you need grouping for repetition but not the captured value.",
    },
    {
      q: "What is the difference between \\d and [0-9]?",
      a: "In JavaScript without the u or v flag, they are equivalent for ASCII digits. With the Unicode (u) flag and Unicode property escapes, \\d still matches only ASCII 0–9, whereas \\p{Decimal_Number} matches decimal digits from all scripts. For most use cases they are interchangeable.",
    },
  ],

  "jwt-debugger": [
    {
      q: "What is a JWT (JSON Web Token)?",
      a: "A JSON Web Token (JWT) is a compact, URL-safe token format defined in RFC 7519. It consists of three Base64url-encoded sections: header, payload, and signature. JWTs are most commonly used as bearer tokens in HTTP Authorization headers.",
    },
    {
      q: "Is it safe to paste my JWT here?",
      a: "Yes. The DevBench JWT Debugger runs entirely in your browser using JavaScript. Your token is never sent to a server, stored, or logged.",
    },
    {
      q: "What is the difference between HS256 and RS256?",
      a: "HS256 uses a shared symmetric secret key known by both issuer and verifier. RS256 uses an RSA key pair: the token is signed with a private key and anyone with the public key can verify it. RS256 is more common in OAuth 2.0 and OpenID Connect identity providers.",
    },
    {
      q: "What does 'signature verification failed' mean?",
      a: "It means the secret or public key you entered does not match the key used to sign the token. The token may have been signed with a different secret, or the token has been tampered with.",
    },
    {
      q: "What is the exp claim and what happens when a JWT expires?",
      a: "The exp (expiration time) claim is a Unix timestamp after which the token must not be accepted. When a JWT expires, the server should reject it and return a 401 Unauthorized response. The client must then obtain a new token.",
    },
  ],

  "hash-generator": [
    {
      q: "What is the difference between MD5, SHA-1, and SHA-256?",
      a: "MD5 produces a 128-bit (32 hex character) digest and is cryptographically broken — do not use it for security. SHA-1 produces 160 bits (40 hex chars) and is also deprecated for digital signatures. SHA-256 is part of SHA-2 and remains secure — it is the standard for file integrity checks, TLS certificates, and HMAC signing in JWTs.",
    },
    {
      q: "Can I use this to hash passwords?",
      a: "No. MD5, SHA-1, SHA-256, and SHA-512 are fast by design, which makes them easy to brute-force as password hashes. For password storage, use a slow key-derivation function designed for the purpose: bcrypt, Argon2, or scrypt. These add configurable computational cost and a built-in salt.",
    },
    {
      q: "What is a hash used for in practice?",
      a: "Common uses: verifying file download integrity (comparing the SHA-256 hash of a downloaded file against the publisher's stated checksum), Subresource Integrity (SRI) hashes in HTML script/link tags, cache-busting by hashing file content, generating unique fingerprints for objects, and signing API requests with HMAC-SHA256.",
    },
    {
      q: "How do I verify a file checksum?",
      a: "Click 'Upload file' in the Hash Generator, select your file, and copy the resulting hash. Compare it character-by-character (or paste it into the Compare field) against the hash the software publisher provides on their download page. If they match, the file is intact and unmodified.",
    },
    {
      q: "Is my data safe to paste here?",
      a: "Yes. All hashing is computed using the browser's Web Crypto API (SubtleCrypto) — your text or file never leaves your device and is not sent to any server. You can confirm this by checking the Network tab in browser DevTools — no requests are made when you hash.",
    },
  ],

  "password-generator": [
    {
      q: "How strong is a randomly generated password?",
      a: "Strength depends on length and character variety. A 16-character password drawn from uppercase, lowercase, digits, and symbols has ~98 bits of entropy — at one trillion guesses per second it would take billions of years to brute-force. The entropy bar in the generator shows this estimate live as you adjust settings.",
    },
    {
      q: "Is it safe to use passwords generated here?",
      a: "Yes. This generator uses crypto.getRandomValues() — the browser's cryptographically secure random number generator (CSPRNG). Passwords are generated entirely in your browser and are never sent to, stored on, or logged by any server. You can verify by checking the Network tab in DevTools.",
    },
    {
      q: "What is the minimum recommended password length?",
      a: "NIST SP 800-63B recommends at least 8 characters, but modern security guidance suggests 16+ characters for accounts that matter, and 24+ for high-value accounts. Length is the single biggest factor in password strength — a 20-character all-lowercase password is stronger than a 10-character mixed-case password.",
    },
    {
      q: "Should I include symbols in my password?",
      a: "Yes, if the target system allows them. Adding symbols increases the character pool from 62 (alphanumeric) to 72–94 characters, adding about 0.5–0.9 extra bits of entropy per character. However, many legacy systems restrict symbols — use the character set toggles to match what the target site accepts.",
    },
    {
      q: "What should I do with the generated password?",
      a: "Store it in a password manager (1Password, Bitwarden, Dashlane). Never store passwords in plaintext files, spreadsheets, or browser autofill beyond the password manager. Enable two-factor authentication on the account as an additional layer.",
    },
  ],

  "url-encode": [
    {
      q: "What is URL encoding (percent-encoding)?",
      a: "URL encoding converts characters that are not allowed or have special meaning in a URL into a %XX format, where XX is the UTF-8 byte value in hexadecimal. For example, a space becomes %20, & becomes %26, and the euro sign becomes %E2%82%AC. This ensures the URL is valid and unambiguous for any HTTP parser.",
    },
    {
      q: "When do I need to URL-encode a string?",
      a: "Any time you're building a URL dynamically and embedding untrusted or user-supplied values. Examples: constructing a search query string (?q=user+input), embedding a redirect URL as a parameter (?next=/some/path?key=val), or passing OAuth state parameters. Forgetting to encode can break the URL or introduce security issues.",
    },
    {
      q: "What is the difference between encodeURIComponent and encodeURI?",
      a: "encodeURIComponent encodes everything except A-Z a-z 0-9 and - _ . ! ~ * ' ( ). Use it for individual query parameter values. encodeURI encodes everything except those characters plus the structural URL characters : / ? # [ ] @ ! $ & ' ( ) * + , ; =. Use it for a complete URL that may contain spaces but whose structure should be preserved.",
    },
    {
      q: "Does the + sign mean a space?",
      a: "In application/x-www-form-urlencoded encoding (HTML form data), + represents a space. In standard percent-encoding (RFC 3986), a space is %20 and + is a literal plus sign. This tool uses standard percent-encoding (%20 for space) unless you choose the form-encoded mode.",
    },
    {
      q: "How do I decode a percent-encoded string?",
      a: "Use the URL Decode tool (linked in the toolbar). In JavaScript, use decodeURIComponent() for component values or decodeURI() for a full URL. These are the exact inverses of their encode counterparts.",
    },
  ],

  "url-decode": [
    {
      q: "What does URL decoding do?",
      a: "URL decoding reverses percent-encoding — it converts %20 back to a space, %26 back to &, %2F back to /, and so on. It also optionally converts + signs back to spaces, which is needed for application/x-www-form-urlencoded data submitted by HTML forms.",
    },
    {
      q: "Why are URLs percent-encoded in the first place?",
      a: "URLs can only legally contain a limited ASCII subset. Characters outside that set — spaces, non-Latin letters, and some punctuation — must be encoded to avoid ambiguity. The browser encodes URLs automatically when you type them, but when you copy a URL from a database column or API response, you often get the raw encoded string.",
    },
    {
      q: "What is double-encoding and how do I fix it?",
      a: "Double-encoding happens when a URL is encoded twice — %20 becomes %2520 (the % is itself encoded to %25). To fix it, decode twice: first pass through decodes %2520 to %20, second pass decodes %20 to a space. The URL Decoder handles this automatically if you enable the 'Double-decode' option.",
    },
    {
      q: "Is there a difference between decodeURI and decodeURIComponent in JavaScript?",
      a: "Yes. decodeURI leaves structural characters (:, /, ?, #, etc.) encoded because they form the URL structure. decodeURIComponent decodes everything — use it for individual query parameter values. Calling decodeURIComponent on a full URL will decode structural separators and likely break the URL.",
    },
  ],

  "aes-encrypt": [
    {
      q: "What encryption algorithm is used?",
      a: "AES-256-GCM — the same algorithm used by TLS 1.3, Signal, and most modern secure systems. The 256 means a 256-bit key; GCM (Galois/Counter Mode) provides authenticated encryption, meaning any tampering with the ciphertext is detected on decryption. A 256-bit key derived from your password via PBKDF2 with 310,000 iterations is used.",
    },
    {
      q: "Is my data safe to encrypt here?",
      a: "Yes. All encryption and decryption runs in your browser using the Web Crypto API — your plaintext, password, and ciphertext never leave your device. You can verify this by checking the browser Network tab while encrypting.",
    },
    {
      q: "What should I use as a password?",
      a: "Use a long, random password (20+ characters). The tool uses PBKDF2 with 310,000 iterations to derive the encryption key — this slows down dictionary attacks on the password. But a weak password (common words, short strings) can still be brute-forced. Generate a strong password with the Password Generator tool.",
    },
    {
      q: "Can I decrypt a ciphertext from another AES tool?",
      a: "Only if the other tool uses the same algorithm (AES-256-GCM), key derivation method (PBKDF2-SHA-256 with the same iteration count), and the same output format for the salt and IV. The ciphertext format is not standardised across tools, so cross-tool decryption is generally not possible without knowing the exact implementation.",
    },
    {
      q: "What is GCM mode and why does it matter?",
      a: "GCM (Galois/Counter Mode) provides authenticated encryption — it produces a ciphertext plus an authentication tag. When decrypting, the tag is verified first. If even one byte of the ciphertext has been tampered with, decryption fails before any data is returned. This protects against ciphertext manipulation attacks that affect unauthenticated modes like AES-CBC.",
    },
  ],

  "curl-to-fetch": [
    {
      q: "How do I copy a cURL command from the browser?",
      a: "In Chrome, Firefox, or Edge: open DevTools → Network tab, click any request, right-click it, and choose 'Copy → Copy as cURL' (Chrome) or 'Copy as cURL (bash)' (Firefox). Paste that directly into this converter.",
    },
    {
      q: "What cURL flags are supported?",
      a: "The converter handles the most common flags: -X (method), -H (headers), -d / --data / --data-raw (body), -u (basic auth), --json (sets Content-Type and Accept to application/json), and --compressed. Uncommon flags like --limit-rate, --retry, or --cacert are noted as unsupported comments in the output.",
    },
    {
      q: "Does it handle JSON request bodies correctly?",
      a: "Yes. If the body is valid JSON, it is formatted as JSON.stringify(data) in the fetch call. If the Content-Type is application/x-www-form-urlencoded, the body is converted to a URLSearchParams object.",
    },
    {
      q: "Can I convert to Node.js fetch or just browser fetch?",
      a: "The output uses the standard Fetch API which works identically in modern browsers and in Node.js 18+ (which ships with the native fetch API). For older Node.js versions, you can swap fetch() for node-fetch with no other changes.",
    },
  ],

  "uuid-generator": [
    {
      q: "What is a UUID?",
      a: "A Universally Unique Identifier (UUID) is a 128-bit label standardised in RFC 4122. It is displayed as 32 hexadecimal digits grouped in the format 8-4-4-4-12 (e.g. 550e8400-e29b-41d4-a716-446655440000). UUIDs are used as primary keys in databases, correlation IDs in distributed systems, and anywhere a collision-resistant ID is needed.",
    },
    {
      q: "What is UUID v4 and why is it the most common?",
      a: "UUID v4 is randomly generated — 122 bits of randomness with 6 bits reserved for the version and variant fields. It requires no coordination between generators and has a collision probability of roughly 1 in 5.3 × 10^36 per pair, making it safe to generate without a central registry.",
    },
    {
      q: "Are UUIDs truly unique?",
      a: "For practical purposes, yes. UUID v4 has 2^122 ≈ 5.3 × 10^36 possible values. If you generated one billion UUIDs per second for 100 years, the probability of a single collision would still be less than 0.000000006%. For sequential IDs with guaranteed uniqueness, use a database auto-increment or UUID v7 (time-ordered).",
    },
    {
      q: "Is a UUID the same as a GUID?",
      a: "Yes. GUID (Globally Unique Identifier) is Microsoft's term for the same concept, used in COM, .NET, and Windows APIs. The format and algorithm are identical to RFC 4122 UUIDs — the names are interchangeable in practice.",
    },
    {
      q: "How do I generate a UUID in JavaScript or Python?",
      a: "JavaScript (modern browsers and Node.js 19+): crypto.randomUUID(). Node.js (older): import { v4 as uuidv4 } from 'uuid'. Python: import uuid; uuid.uuid4(). Go: github.com/google/uuid. All these produce RFC 4122-compliant v4 UUIDs.",
    },
  ],
};
