import Link from "next/link";

const prose = "text-sm sm:text-base text-muted-foreground leading-relaxed";
const h2 = "text-xl font-semibold text-foreground mt-8 mb-3";
const h3 = "text-base font-semibold text-foreground mt-5 mb-2";
const ul = "list-disc list-outside pl-5 space-y-1.5 text-sm sm:text-base text-muted-foreground";
const ol = "list-decimal list-outside pl-5 space-y-1.5 text-sm sm:text-base text-muted-foreground";
const code = "font-mono text-xs bg-muted px-1.5 py-0.5 rounded";
const table = "w-full text-sm border-collapse my-4";
const th = "text-left px-3 py-2 bg-muted font-semibold text-foreground border border-border";
const td = "px-3 py-2 border border-border text-muted-foreground";

function UuidVsUlidVsNanoid() {
  return (
    <div className="space-y-4">
      <p className={prose}>
        Every developer reaches for <code className={code}>UUID v4</code> without thinking — it's in every language's standard library and universally supported. But UUID has real problems: it's 36 characters, not sortable, and can fragment B-tree indexes. ULID and Nano ID solve these. Here's when each one is the right tool.
      </p>

      <h2 className={h2}>UUID v4 — the safe default</h2>
      <p className={prose}>
        UUID v4 is a 128-bit random number formatted as <code className={code}>xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx</code> — 32 hex digits and 4 dashes. The probability of a collision is 1 in 2¹²², which is astronomically small.
      </p>
      <p className={prose}>
        Use UUID v4 when:
      </p>
      <ul className={ul}>
        <li>You need maximum ecosystem compatibility — PostgreSQL has a native <code className={code}>uuid</code> type, MySQL supports it, ORMs know how to handle it</li>
        <li>IDs are not exposed in URLs (so the 36-char length doesn't matter)</li>
        <li>Your database table is append-heavy and you're using <code className={code}>uuid_generate_v4()</code> or <code className={code}>gen_random_uuid()</code> at the DB level</li>
      </ul>
      <p className={prose}>
        <strong>The real problem with UUID v4</strong> is index fragmentation. Because UUIDs are random, each insert lands at a random position in your B-tree index — causing page splits and cache misses at scale. This matters at millions of rows, not thousands.
      </p>

      <h2 className={h2}>ULID — when insertion order matters</h2>
      <p className={prose}>
        ULID (Universally Unique Lexicographically Sortable Identifier) looks like this: <code className={code}>01ARZ3NDEKTSV4RRFFQ69G5FAV</code>. It's 26 characters in Crockford Base32 encoding.
      </p>
      <p className={prose}>
        The key property: the first 10 characters encode a millisecond timestamp. This means ULIDs generated close together sort together — inserts land near the end of the B-tree index rather than scattered randomly. <strong>This is much better for write-heavy workloads.</strong>
      </p>
      <ul className={ul}>
        <li>Time-sortable — rows with adjacent ULIDs were inserted at nearly the same time</li>
        <li>26 characters vs 36 for UUID (no dashes)</li>
        <li>Case-insensitive — the alphabet excludes I, L, O, U to avoid visual ambiguity</li>
        <li>128-bit entropy total (48 bits time + 80 bits random)</li>
      </ul>
      <p className={prose}>
        Use ULID for database primary keys where you care about index performance, or when you want IDs to carry implicit ordering by creation time (e.g., paginating by ID instead of a separate <code className={code}>created_at</code> column).
      </p>

      <h2 className={h2}>Nano ID — compact and URL-safe</h2>
      <p className={prose}>
        Nano ID generates short, URL-safe identifiers: <code className={code}>V1StGXR8_Z5jdHi6B-myT</code>. The default length is 21 characters using a 64-character alphabet (<code className={code}>A-Za-z0-9_-</code>).
      </p>
      <ul className={ul}>
        <li>21 characters by default (configurable down to 6, up to anything)</li>
        <li>URL-safe alphabet — no encoding needed in query strings or paths</li>
        <li>No timestamp component — purely random</li>
        <li>~126 bits of entropy at the default length (comparable to UUID v4)</li>
      </ul>
      <p className={prose}>
        Use Nano ID for short IDs that appear in URLs, API keys, session tokens, share links, and anywhere compact size matters more than sortability.
      </p>

      <h2 className={h2}>Quick comparison</h2>
      <table className={table}>
        <thead>
          <tr>
            <th className={th}>Property</th>
            <th className={th}>UUID v4</th>
            <th className={th}>ULID</th>
            <th className={th}>Nano ID</th>
          </tr>
        </thead>
        <tbody>
          <tr><td className={td}>Length</td><td className={td}>36 chars</td><td className={td}>26 chars</td><td className={td}>21 chars</td></tr>
          <tr><td className={td}>Sortable</td><td className={td}>No</td><td className={td}>Yes (by time)</td><td className={td}>No</td></tr>
          <tr><td className={td}>URL-safe</td><td className={td}>Yes (with dashes)</td><td className={td}>Yes</td><td className={td}>Yes</td></tr>
          <tr><td className={td}>DB index friendly</td><td className={td}>Poor at scale</td><td className={td}>Excellent</td><td className={td}>Poor at scale</td></tr>
          <tr><td className={td}>Ecosystem support</td><td className={td}>Universal</td><td className={td}>Good</td><td className={td}>Good</td></tr>
        </tbody>
      </table>

      <h2 className={h2}>The verdict</h2>
      <p className={prose}>
        Default to UUID v4 if you're unsure — compatibility wins. Switch to ULID if you're building a write-heavy service and B-tree index performance matters. Use Nano ID when IDs appear in user-visible URLs and compactness is a priority.
      </p>
    </div>
  );
}

function JwtExplained() {
  return (
    <div className="space-y-4">
      <p className={prose}>
        A JSON Web Token is three Base64URL-encoded strings joined by dots: <code className={code}>header.payload.signature</code>. The compact format makes JWTs easy to embed in HTTP headers, URL query strings, and cookies. But that compactness hides a lot of nuance — especially around security.
      </p>

      <h2 className={h2}>The header</h2>
      <p className={prose}>
        The header is a JSON object describing the token type and the signing algorithm. Decoded, it typically looks like:
      </p>
      <pre className="bg-muted rounded-lg px-4 py-3 text-xs font-mono overflow-x-auto my-3">
{`{
  "alg": "HS256",
  "typ": "JWT"
}`}
      </pre>
      <p className={prose}>
        The <code className={code}>alg</code> field is critical. Common values:
      </p>
      <ul className={ul}>
        <li><code className={code}>HS256</code> — HMAC-SHA256. Symmetric: the same secret is used to sign and verify. Simple but the secret must be shared between services.</li>
        <li><code className={code}>RS256</code> — RSA-SHA256. Asymmetric: sign with a private key, verify with a public key. Better for microservices — only the auth server needs the private key.</li>
        <li><code className={code}>ES256</code> — ECDSA with P-256. Like RS256 but smaller key sizes and faster operations.</li>
        <li><code className={code}>none</code> — No signature. <strong>Never accept this in production.</strong> Attackers can forge tokens with <code className={code}>"alg": "none"</code> if your library doesn't explicitly reject it.</li>
      </ul>

      <h2 className={h2}>The payload</h2>
      <p className={prose}>
        The payload contains claims — statements about the token subject. Standard registered claims:
      </p>
      <ul className={ul}>
        <li><code className={code}>sub</code> — subject: the user ID or entity this token represents</li>
        <li><code className={code}>iss</code> — issuer: the service that issued the token (e.g. <code className={code}>https://auth.example.com</code>)</li>
        <li><code className={code}>aud</code> — audience: the intended recipient service(s)</li>
        <li><code className={code}>exp</code> — expiry: Unix timestamp after which the token is invalid</li>
        <li><code className={code}>iat</code> — issued at: when the token was created</li>
        <li><code className={code}>nbf</code> — not before: token is invalid before this time</li>
        <li><code className={code}>jti</code> — JWT ID: unique identifier for this token (enables revocation)</li>
      </ul>
      <p className={prose}>
        <strong>Important:</strong> The payload is Base64URL-encoded, not encrypted. Anyone with the token can read the payload — never put passwords, credit card numbers, or other secrets in a JWT payload.
      </p>

      <h2 className={h2}>The signature</h2>
      <p className={prose}>
        The signature prevents tampering. For HS256, it is computed as:
      </p>
      <pre className="bg-muted rounded-lg px-4 py-3 text-xs font-mono overflow-x-auto my-3">
{`HMAC-SHA256(
  base64url(header) + "." + base64url(payload),
  secret
)`}
      </pre>
      <p className={prose}>
        If an attacker changes any bit of the header or payload, the signature won't verify. This is what makes JWTs tamper-evident — not confidential.
      </p>

      <h2 className={h2}>Common JWT pitfalls</h2>
      <ul className={ul}>
        <li><strong>Algorithm confusion attack</strong> — if your library accepts both HS256 and RS256, an attacker can take an RS256 public key (which is public), sign a token with it using HS256, and the library may accept it if it doesn't check the expected algorithm explicitly.</li>
        <li><strong>Not validating expiry</strong> — always check <code className={code}>exp</code>. A valid signature doesn't mean a token is still valid.</li>
        <li><strong>Not validating audience</strong> — a token issued for Service A should be rejected by Service B. Check <code className={code}>aud</code>.</li>
        <li><strong>Weak secrets for HS256</strong> — a short or guessable HMAC secret can be brute-forced. Use at least 256 bits of random entropy.</li>
        <li><strong>Storing in localStorage</strong> — accessible to any JavaScript on the page. Prefer httpOnly cookies for tokens that authorize actions.</li>
      </ul>

      <h2 className={h2}>JWT vs sessions</h2>
      <p className={prose}>
        JWTs are stateless — the server doesn't store anything. Sessions are stateful — the server stores session data and gives the client an opaque ID. JWTs scale horizontally without a shared session store, but can't be individually revoked (you have to wait for <code className={code}>exp</code> or implement a token blocklist — which adds state back anyway). For most applications, server-side sessions with a fast store (Redis) are simpler and more secure.
      </p>
    </div>
  );
}

function EncodeUriComponentVsEncodeUri() {
  return (
    <div className="space-y-4">
      <p className={prose}>
        JavaScript has two built-in URL encoding functions and developers mix them up constantly. Using the wrong one either produces broken URLs or silently leaves characters unencoded that should be escaped. Here's the precise rule for each.
      </p>

      <h2 className={h2}>What is percent-encoding?</h2>
      <p className={prose}>
        URLs can only contain a limited set of ASCII characters. Any other character — including spaces, non-Latin letters, and many punctuation marks — must be converted to a <code className={code}>%XX</code> sequence where <code className={code}>XX</code> is the character's hexadecimal UTF-8 byte value. A space becomes <code className={code}>%20</code>, a euro sign € becomes <code className={code}>%E2%82%AC</code>.
      </p>

      <h2 className={h2}>encodeURIComponent — for individual values</h2>
      <p className={prose}>
        <code className={code}>encodeURIComponent()</code> encodes everything <em>except</em>:
      </p>
      <pre className="bg-muted rounded-lg px-4 py-3 text-xs font-mono overflow-x-auto my-3">
{`A-Z a-z 0-9 - _ . ! ~ * ' ( )`}
      </pre>
      <p className={prose}>
        This means it encodes structural URL characters like <code className={code}>/ ? # @ &amp; = + :</code>. That's intentional — you're encoding a <em>value</em>, not a URL, so those characters should be escaped so they can't be misinterpreted as URL structure.
      </p>
      <pre className="bg-muted rounded-lg px-4 py-3 text-xs font-mono overflow-x-auto my-3">
{`const query = encodeURIComponent("hello world & more");
// → "hello%20world%20%26%20more"

const url = \`https://api.example.com/search?q=\${query}\`;
// → "https://api.example.com/search?q=hello%20world%20%26%20more"`}
      </pre>
      <p className={prose}><strong>Use this for:</strong> query parameter values, path segment values, form field data.</p>

      <h2 className={h2}>encodeURI — for complete URLs</h2>
      <p className={prose}>
        <code className={code}>encodeURI()</code> encodes everything <em>except</em> characters that are legal in a complete URL:
      </p>
      <pre className="bg-muted rounded-lg px-4 py-3 text-xs font-mono overflow-x-auto my-3">
{`A-Z a-z 0-9 - _ . ! ~ * ' ( ) ; / ? : @ & = + $ , #`}
      </pre>
      <p className={prose}>
        It deliberately leaves <code className={code}>/ ? # &amp; = + :</code> intact because it assumes those are structural URL characters, not data values.
      </p>
      <pre className="bg-muted rounded-lg px-4 py-3 text-xs font-mono overflow-x-auto my-3">
{`const url = encodeURI("https://example.com/path with spaces?q=hello");
// → "https://example.com/path%20with%20spaces?q=hello"
// Note: the ? and = are preserved (they're structure)
// But the space in the path is encoded`}
      </pre>
      <p className={prose}><strong>Use this for:</strong> encoding a complete URL that may contain spaces or non-ASCII characters, but whose structure (<code className={code}>://</code>, <code className={code}>?</code>, <code className={code}>&amp;</code>, <code className={code}>=</code>) should be preserved.</p>

      <h2 className={h2}>The most common mistake</h2>
      <p className={prose}>
        Using <code className={code}>encodeURI()</code> for query parameter values. If your value contains <code className={code}>&amp;</code> (e.g. a company name "AT&amp;T"), <code className={code}>encodeURI()</code> won't encode it — breaking the query string. Always use <code className={code}>encodeURIComponent()</code> for values.
      </p>

      <h2 className={h2}>The modern alternative: URLSearchParams</h2>
      <p className={prose}>
        In modern JavaScript, you rarely need either function directly. Use <code className={code}>URLSearchParams</code> which handles encoding automatically:
      </p>
      <pre className="bg-muted rounded-lg px-4 py-3 text-xs font-mono overflow-x-auto my-3">
{`const params = new URLSearchParams({
  q: "hello world & more",
  page: "1",
});
const url = \`https://api.example.com/search?\${params}\`;
// → "https://api.example.com/search?q=hello+world+%26+more&page=1"`}
      </pre>
      <p className={prose}>
        Note that <code className={code}>URLSearchParams</code> uses <code className={code}>+</code> for spaces (application/x-www-form-urlencoded) while <code className={code}>encodeURIComponent()</code> uses <code className={code}>%20</code>. Both are valid in query strings; most servers handle both.
      </p>
    </div>
  );
}

function CommonJsonErrors() {
  return (
    <div className="space-y-4">
      <p className={prose}>
        JSON is strict. Patterns that work fine in JavaScript object literals silently break JSON parsers. These are the seven errors that account for the vast majority of "Unexpected token" and "JSON parse error" messages.
      </p>

      <h2 className={h2}>1. Trailing comma</h2>
      <p className={prose}>
        The most common JSON error. JavaScript allows trailing commas; JSON does not.
      </p>
      <pre className="bg-muted rounded-lg px-4 py-3 text-xs font-mono overflow-x-auto my-3">
{`// ❌ Invalid JSON
{
  "name": "Alice",
  "age": 30,   ← trailing comma
}

// ✅ Valid JSON
{
  "name": "Alice",
  "age": 30
}`}
      </pre>

      <h2 className={h2}>2. Single-quoted strings</h2>
      <p className={prose}>
        JSON requires double quotes. Single quotes are a JavaScript convenience, not part of the JSON spec.
      </p>
      <pre className="bg-muted rounded-lg px-4 py-3 text-xs font-mono overflow-x-auto my-3">
{`// ❌ Invalid
{ 'name': 'Alice' }

// ✅ Valid
{ "name": "Alice" }`}
      </pre>

      <h2 className={h2}>3. Unquoted keys</h2>
      <p className={prose}>
        Object keys must be quoted strings in JSON. Unquoted keys are valid in JavaScript (<code className={code}>{`{ name: "Alice" }`}</code>) but invalid in JSON.
      </p>
      <pre className="bg-muted rounded-lg px-4 py-3 text-xs font-mono overflow-x-auto my-3">
{`// ❌ Invalid JSON
{ name: "Alice" }

// ✅ Valid JSON
{ "name": "Alice" }`}
      </pre>

      <h2 className={h2}>4. Comments</h2>
      <p className={prose}>
        JSON has no comment syntax. Neither <code className={code}>// single-line</code> nor <code className={code}>/* block */</code> comments are valid. If you need comments in config files, consider JSONC (JSON with Comments, used by VS Code), YAML, or TOML instead.
      </p>

      <h2 className={h2}>5. NaN, Infinity, and undefined</h2>
      <p className={prose}>
        These are valid JavaScript values but not valid JSON. <code className={code}>JSON.stringify()</code> silently converts them:
      </p>
      <ul className={ul}>
        <li><code className={code}>NaN</code> → <code className={code}>null</code></li>
        <li><code className={code}>Infinity</code> → <code className={code}>null</code></li>
        <li><code className={code}>undefined</code> → key is omitted entirely</li>
      </ul>
      <p className={prose}>This means round-tripping through JSON can silently lose or change data if your objects contain these values.</p>

      <h2 className={h2}>6. Unescaped control characters in strings</h2>
      <p className={prose}>
        Literal newlines, tabs, and other control characters (U+0000 to U+001F) inside string values must be escaped. A raw newline in a string value is invalid.
      </p>
      <pre className="bg-muted rounded-lg px-4 py-3 text-xs font-mono overflow-x-auto my-3">
{`// ❌ Invalid — literal newline in string
{ "message": "line one
line two" }

// ✅ Valid — escaped newline
{ "message": "line one\\nline two" }`}
      </pre>

      <h2 className={h2}>7. Numbers: hex, leading zeros, bare decimal point</h2>
      <p className={prose}>
        JSON numbers must be decimal only. Hexadecimal literals, octal literals, and numbers with a leading decimal point are not valid.
      </p>
      <pre className="bg-muted rounded-lg px-4 py-3 text-xs font-mono overflow-x-auto my-3">
{`// ❌ Invalid JSON numbers
{ "a": 0xFF, "b": 077, "c": .5, "d": 1. }

// ✅ Valid
{ "a": 255, "b": 63, "c": 0.5, "d": 1.0 }`}
      </pre>

      <h2 className={h2}>Quick fix</h2>
      <p className={prose}>
        Paste your broken JSON into the validator below — it highlights the exact line and column of the error and explains what went wrong.
      </p>
    </div>
  );
}

function RegexCheatSheet() {
  return (
    <div className="space-y-4">
      <p className={prose}>
        Most developers use regex for the same 15–20 patterns repeatedly. This reference covers the patterns that actually appear in production JavaScript code, with copy-ready snippets and notes on edge cases.
      </p>

      <h2 className={h2}>Syntax quick reference</h2>
      <table className={table}>
        <thead>
          <tr>
            <th className={th}>Pattern</th>
            <th className={th}>Meaning</th>
          </tr>
        </thead>
        <tbody>
          {[
            [".","Any character except newline (use s flag to include newlines)"],
            ["\\d / \\D","Digit / non-digit"],
            ["\\w / \\W","Word char (A-Za-z0-9_) / non-word"],
            ["\\s / \\S","Whitespace / non-whitespace"],
            ["^ / $","Start / end of string (m flag: start/end of line)"],
            ["* + ?","0 or more / 1 or more / 0 or 1"],
            ["{n} {n,} {n,m}","Exactly n / at least n / between n and m"],
            ["(abc)","Capture group — referenced as $1, $2..."],
            ["(?:abc)","Non-capturing group — groups but doesn't capture"],
            ["(?<name>abc)","Named capture group — referenced as $<name>"],
            ["a|b","Alternation: a or b"],
            ["[abc]","Character class: a, b, or c"],
            ["[^abc]","Negated class: anything except a, b, c"],
            ["\\b / \\B","Word boundary / non-word boundary"],
            ["(?=abc)","Positive lookahead: followed by abc"],
            ["(?!abc)","Negative lookahead: not followed by abc"],
          ].map(([pat, desc]) => (
            <tr key={pat}>
              <td className={td}><code className={code}>{pat}</code></td>
              <td className={td}>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className={h2}>Common patterns</h2>

      <h3 className={h3}>Email address (practical)</h3>
      <pre className="bg-muted rounded-lg px-4 py-3 text-xs font-mono overflow-x-auto my-2">
{`/^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$/`}
      </pre>
      <p className={prose}>Note: the only truly correct email regex spans thousands of characters. For most apps, validate server-side by sending a confirmation email.</p>

      <h3 className={h3}>URL</h3>
      <pre className="bg-muted rounded-lg px-4 py-3 text-xs font-mono overflow-x-auto my-2">
{`/^https?:\\/\\/[^\\s/$.?#].[^\\s]*$/i`}
      </pre>

      <h3 className={h3}>IPv4 address</h3>
      <pre className="bg-muted rounded-lg px-4 py-3 text-xs font-mono overflow-x-auto my-2">
{`/^(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$/`}
      </pre>

      <h3 className={h3}>ISO 8601 date (YYYY-MM-DD)</h3>
      <pre className="bg-muted rounded-lg px-4 py-3 text-xs font-mono overflow-x-auto my-2">
{`/^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$/`}
      </pre>

      <h3 className={h3}>UUID v4</h3>
      <pre className="bg-muted rounded-lg px-4 py-3 text-xs font-mono overflow-x-auto my-2">
{`/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`}
      </pre>

      <h3 className={h3}>Semantic version (semver)</h3>
      <pre className="bg-muted rounded-lg px-4 py-3 text-xs font-mono overflow-x-auto my-2">
{`/^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$/`}
      </pre>

      <h3 className={h3}>Hex color code</h3>
      <pre className="bg-muted rounded-lg px-4 py-3 text-xs font-mono overflow-x-auto my-2">
{`/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/`}
      </pre>

      <h3 className={h3}>Phone number (E.164 international format)</h3>
      <pre className="bg-muted rounded-lg px-4 py-3 text-xs font-mono overflow-x-auto my-2">
{`/^\\+[1-9]\\d{1,14}$/`}
      </pre>

      <h3 className={h3}>Strong password (min 8 chars, upper + lower + digit + symbol)</h3>
      <pre className="bg-muted rounded-lg px-4 py-3 text-xs font-mono overflow-x-auto my-2">
{`/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z\\d]).{8,}$/`}
      </pre>

      <h3 className={h3}>Slug (URL-safe)</h3>
      <pre className="bg-muted rounded-lg px-4 py-3 text-xs font-mono overflow-x-auto my-2">
{`/^[a-z0-9]+(?:-[a-z0-9]+)*$/`}
      </pre>

      <h2 className={h2}>Flags cheatsheet</h2>
      <ul className={ul}>
        <li><code className={code}>g</code> — global: find all matches (not just first). Required for <code className={code}>String.matchAll()</code>.</li>
        <li><code className={code}>i</code> — case-insensitive</li>
        <li><code className={code}>m</code> — multiline: <code className={code}>^</code> and <code className={code}>$</code> match line boundaries, not string boundaries</li>
        <li><code className={code}>s</code> — dotAll: <code className={code}>.</code> matches <code className={code}>\n</code> too</li>
        <li><code className={code}>u</code> — unicode: enables <code className={code}>\p{"{...}"}</code> property escapes and correct handling of surrogate pairs</li>
        <li><code className={code}>d</code> — indices: adds <code className={code}>.indices</code> to match results with start/end positions</li>
      </ul>

      <h2 className={h2}>Test your patterns interactively</h2>
      <p className={prose}>
        Paste any pattern from above into the regex tester to see live match highlighting, capture group values, and the equivalent Python/Go/PHP code.
      </p>
    </div>
  );
}

function HowToValidateJsonOnline() {
  return (
    <div className="space-y-4">
      <p className={prose}>
        Invalid JSON is one of the fastest ways to break APIs, CI pipelines, and config deploys — often with an error message that points at the wrong line. Validating JSON before you merge or ship catches problems early. Here is what “validate” actually means, how online tools differ, and a repeatable workflow.
      </p>

      <h2 className={h2}>What “valid JSON” means</h2>
      <p className={prose}>
        JSON validation usually means <strong>syntax checking</strong>: the text must follow{" "}
        <Link href="/blog/common-json-errors" className="text-accent hover:underline">
          strict rules
        </Link>{" "}
        — double-quoted keys and strings, no trailing commas, no comments, no{" "}
        <code className={code}>undefined</code>. A validator runs <code className={code}>JSON.parse()</code> (or equivalent) and either succeeds or reports the first parse error with a position.
      </p>
      <p className={prose}>
        That is different from <strong>schema validation</strong> (JSON Schema, OpenAPI), which checks whether the <em>shape</em> of the data matches what your service expects — required fields, types, enums. You need both in mature systems: syntax first, then schema where it matters.
      </p>

      <h2 className={h2}>Why “online” matters for privacy</h2>
      <p className={prose}>
        Many “JSON validator” sites send your paste to a backend or third-party analytics. For internal configs, sample API payloads, or anything proprietary, that is a real leak surface. Before you paste sensitive data anywhere, check whether processing happens <strong>entirely in your browser</strong> (no upload) — or use a local editor / CLI.
      </p>
      <ul className={ul}>
        <li><strong>Browser-only tools</strong> — parsing runs in JavaScript on your machine; nothing should leave the tab except what you explicitly export.</li>
        <li><strong>Server-backed validators</strong> — convenient for huge files or shared links, but assume the text is stored or logged unless the product states otherwise.</li>
        <li><strong>CLI</strong> — <code className={code}>jq . file.json</code> or <code className={code}>python -m json.tool</code> are fine for local files and CI.</li>
      </ul>

      <h2 className={h2}>How to validate JSON online (step by step)</h2>
      <ol className={ol}>
        <li>Copy the raw JSON — not a screenshot, not markdown — from your editor, log, or HTTP client.</li>
        <li>Paste into a validator that runs client-side. You should get either “valid” or a single clear error (line/column or pointer).</li>
        <li>If invalid, fix the first error only; often later errors are cascading artifacts.</li>
        <li>Re-run until parse succeeds. Optionally pretty-print to confirm structure.</li>
        <li>For APIs, paste the same payload into your integration test or schema validator before deploy.</li>
      </ol>

      <h2 className={h2}>Tips that save time</h2>
      <ul className={ul}>
        <li>Watch for smart quotes from Slack or Word — replace with straight <code className={code}>"</code>.</li>
        <li>Large minified blobs: use a formatter after validation so diffs are readable.</li>
        <li>If validation passes but the API still rejects the body, the problem is usually headers, encoding, or schema — not JSON syntax.</li>
      </ul>

      <h2 className={h2}>Try it on DevBench</h2>
      <p className={prose}>
        The JSON Formatter &amp; Validator runs in your browser — paste, validate, and format without sending your payload to our servers. Use it whenever you need a quick sanity check before commit or deploy.
      </p>
    </div>
  );
}

function JwtDecoderWithoutUploading() {
  return (
    <div className="space-y-4">
      <p className={prose}>
        A JWT looks opaque, but the header and payload are only <strong>Base64URL-encoded JSON</strong>. Anyone who has the token string can decode those two parts — no secret required. That is why “decoding” in the browser is straightforward; the security story is about where the token travels, not about magic encryption of the payload.
      </p>

      <h2 className={h2}>What “without uploading to a server” means</h2>
      <p className={prose}>
        Some JWT tools send your token to an API to decode or verify. If you care about operational secrecy — staging tokens, internal user IDs in claims, or compliance — you want a tool where the token never leaves your device in an HTTP request. A proper client-side decoder only runs JavaScript in your tab: split the three JWT segments, Base64URL-decode header and payload, then pretty-print JSON.
      </p>
      <p className={prose}>
        DevBench’s JWT Debugger follows that model: decode and inspect locally in the browser, with no round-trip to decode the header and payload.
      </p>

      <h2 className={h2}>Decoding is not verifying</h2>
      <p className={prose}>
        Reading the payload does <strong>not</strong> prove the token is legitimate. Signature verification (HMAC with a secret, or asymmetric keys) must use the correct key material on a trusted path. A malicious token can still contain arbitrary claims; only verification binds those claims to an issuer.
      </p>
      <p className={prose}>
        For a full tour of header algorithms and pitfalls, see{" "}
        <Link href="/blog/jwt-explained" className="text-accent hover:underline">
          JWT Explained: Header, Payload, and Signature Decoded
        </Link>
        .
      </p>

      <h2 className={h2}>When you should still be careful</h2>
      <ul className={ul}>
        <li><strong>Shared or recorded screens</strong> — claims may include emails, tenant IDs, or session metadata.</li>
        <li><strong>Browser extensions</strong> — treat them like untrusted code with access to page content.</li>
        <li><strong>Refresh tokens and long-lived secrets</strong> — decoding is fine; storing or logging them is not.</li>
      </ul>
      <p className={prose}>
        If a token is highly sensitive, prefer local OpenSSL or <code className={code}>jwt-cli</code> on an air-gapped machine — same math, zero web surface.
      </p>

      <h2 className={h2}>Practical workflow</h2>
      <ol className={ol}>
        <li>Copy the JWT from the <code className={code}>Authorization</code> header or your auth library’s debug output.</li>
        <li>Paste into a client-side decoder and confirm <code className={code}>alg</code>, <code className={code}>iss</code>, <code className={code}>exp</code>, and audience claims match expectations.</li>
        <li>If something looks wrong, rotate credentials and verify signatures on the server — never trust decode output alone for authorization decisions.</li>
      </ol>
    </div>
  );
}

export const POST_CONTENT: Record<string, React.ReactNode> = {
  "how-to-validate-json-online": <HowToValidateJsonOnline />,
  "jwt-decoder-without-uploading-to-server": <JwtDecoderWithoutUploading />,
  "uuid-vs-ulid-vs-nanoid": <UuidVsUlidVsNanoid />,
  "jwt-explained": <JwtExplained />,
  "encodeuricomponent-vs-encodeuri": <EncodeUriComponentVsEncodeUri />,
  "common-json-errors": <CommonJsonErrors />,
  "regex-cheat-sheet-javascript": <RegexCheatSheet />,
};
