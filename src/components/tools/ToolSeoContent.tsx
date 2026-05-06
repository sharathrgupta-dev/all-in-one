import Link from "next/link";

const prose =
  "text-sm text-muted-foreground leading-relaxed";
const h2 =
  "text-base font-semibold text-foreground mt-6 mb-2";
const ul =
  "list-disc list-inside space-y-1 text-sm text-muted-foreground";

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="max-w-6xl mx-auto px-4 pb-4 w-full border-t border-border pt-8 mt-2 space-y-3">
      {children}
    </section>
  );
}

function JsonFormatterContent() {
  return (
    <Section>
      <h2 className={h2}>What is a JSON Formatter?</h2>
      <p className={prose}>
        A <strong>JSON formatter</strong> (also called a JSON beautifier or JSON
        pretty-printer) takes minified or unreadable JSON and reformats it with
        consistent indentation so humans can read it. Our online JSON formatter
        and validator checks your JSON for syntax errors at the same time —
        unclosed brackets, trailing commas, unquoted keys, and other common
        mistakes are highlighted instantly.
      </p>

      <h2 className={h2}>How to use this JSON formatter</h2>
      <p className={prose}>
        Paste your JSON into the left panel. The formatter detects and reports
        any syntax errors in real time. Switch to the tree view to explore nested
        objects and arrays without scrolling through raw text. Use the minify
        button to compact JSON for production payloads, or export to YAML, CSV,
        or TypeScript interfaces using the toolbar.
      </p>

      <h2 className={h2}>Common JSON errors this tool catches</h2>
      <ul className={ul}>
        <li>Trailing commas after the last key or array element</li>
        <li>Single-quoted strings instead of double-quoted</li>
        <li>Unquoted object keys (valid in JS, not in JSON)</li>
        <li>Missing or mismatched curly braces and square brackets</li>
        <li>Control characters and unescaped newlines inside strings</li>
        <li>
          Numbers formatted as <code className="font-mono text-xs">NaN</code>,{" "}
          <code className="font-mono text-xs">Infinity</code>, or hex literals
        </li>
      </ul>

      <h2 className={h2}>JSON vs JavaScript object literals</h2>
      <p className={prose}>
        JSON (JavaScript Object Notation) is a strict subset of JavaScript
        syntax. All keys must be double-quoted strings, values can only be
        strings, numbers, booleans, null, arrays, or objects — functions,
        undefined, and symbols are not valid JSON values. This tool validates
        against the{" "}
        <a
          href="https://www.rfc-editor.org/rfc/rfc8259"
          target="_blank"
          rel="nofollow noopener noreferrer"
          className="text-accent hover:underline"
        >
          RFC 8259
        </a>{" "}
        standard, not loose JavaScript object parsing.
      </p>

      <p className={prose}>
        Also useful:{" "}
        <Link href="/tools/json-diff" className="text-accent hover:underline">
          JSON Diff
        </Link>
        {", "}
        <Link href="/tools/json-to-yaml" className="text-accent hover:underline">
          JSON → YAML
        </Link>
        {", "}
        <Link
          href="/tools/json-to-typescript"
          className="text-accent hover:underline"
        >
          JSON → TypeScript
        </Link>
        .
      </p>
    </Section>
  );
}

function Base64EncodeContent() {
  return (
    <Section>
      <h2 className={h2}>What is Base64 encoding?</h2>
      <p className={prose}>
        <strong>Base64</strong> is an encoding scheme that converts binary data
        into a sequence of printable ASCII characters. It maps every 3 bytes of
        input into 4 characters chosen from the 64-character alphabet{" "}
        <code className="font-mono text-xs">A–Z a–z 0–9 + /</code>, padded with{" "}
        <code className="font-mono text-xs">=</code> signs to reach a multiple
        of 4 characters. The result is roughly 33% larger than the original
        data.
      </p>

      <h2 className={h2}>Why developers use Base64 encoding</h2>
      <ul className={ul}>
        <li>
          Embedding images, fonts, or files as{" "}
          <code className="font-mono text-xs">data:</code> URIs in CSS or HTML
        </li>
        <li>
          Transmitting binary data through channels that only support text (SMTP
          email attachments, JSON APIs)
        </li>
        <li>
          Encoding the credentials part of HTTP Basic Authentication headers
        </li>
        <li>
          Storing binary values in environment variables or config files
        </li>
        <li>
          JWT tokens use URL-safe Base64 (
          <code className="font-mono text-xs">base64url</code>) for the header
          and payload sections
        </li>
      </ul>

      <h2 className={h2}>Standard Base64 vs URL-safe Base64</h2>
      <p className={prose}>
        Standard Base64 uses <code className="font-mono text-xs">+</code> and{" "}
        <code className="font-mono text-xs">/</code> which are reserved
        characters in URLs. URL-safe Base64 (base64url) replaces them with{" "}
        <code className="font-mono text-xs">-</code> and{" "}
        <code className="font-mono text-xs">_</code> and omits padding. This
        tool encodes standard Base64 with full UTF-8 support — multi-byte
        characters like emoji are handled correctly.
      </p>

      <p className={prose}>
        Also useful:{" "}
        <Link href="/tools/base64-decode" className="text-accent hover:underline">
          Base64 Decode
        </Link>
        {", "}
        <Link href="/tools/base64-image" className="text-accent hover:underline">
          Base64 Image Encoder
        </Link>
        {", "}
        <Link href="/tools/url-encode" className="text-accent hover:underline">
          URL Encode
        </Link>
        .
      </p>
    </Section>
  );
}

function Base64DecodeContent() {
  return (
    <Section>
      <h2 className={h2}>How to decode a Base64 string</h2>
      <p className={prose}>
        Paste any <strong>Base64-encoded string</strong> into the input panel
        and this tool instantly decodes it back to plain text. It handles
        standard Base64 (with <code className="font-mono text-xs">+/=</code>{" "}
        characters) and URL-safe base64url (with{" "}
        <code className="font-mono text-xs">-_</code> and no padding). UTF-8
        multi-byte characters are decoded correctly.
      </p>

      <h2 className={h2}>Common places you'll encounter Base64</h2>
      <ul className={ul}>
        <li>
          JWT tokens — the header and payload are base64url-encoded JSON objects
        </li>
        <li>
          API responses that return file content as a Base64 string (GitHub
          Contents API, AWS S3 presigned responses)
        </li>
        <li>
          SAML assertions and OAuth tokens in SSO flows
        </li>
        <li>
          Email MIME attachments encoded as Base64 blocks
        </li>
        <li>
          <code className="font-mono text-xs">data:</code> URIs for inline
          images in HTML
        </li>
      </ul>

      <p className={prose}>
        Also useful:{" "}
        <Link href="/tools/base64-encode" className="text-accent hover:underline">
          Base64 Encode
        </Link>
        {", "}
        <Link href="/jwt-debugger" className="text-accent hover:underline">
          JWT Debugger
        </Link>
        {", "}
        <Link href="/tools/url-decode" className="text-accent hover:underline">
          URL Decode
        </Link>
        .
      </p>
    </Section>
  );
}

function RegexTesterContent() {
  return (
    <Section>
      <h2 className={h2}>What is a regular expression?</h2>
      <p className={prose}>
        A <strong>regular expression</strong> (regex) is a sequence of
        characters that defines a search pattern. Regex is built into nearly
        every programming language — JavaScript, Python, Java, Go, Ruby — and
        is used for finding, extracting, validating, and transforming text. Our
        online regex tester gives you a live preview of every match as you type,
        so you can debug patterns without running any code.
      </p>

      <h2 className={h2}>Regex flags explained</h2>
      <ul className={ul}>
        <li>
          <code className="font-mono text-xs">g</code> — global: find all
          matches, not just the first
        </li>
        <li>
          <code className="font-mono text-xs">i</code> — case-insensitive:
          match upper and lower case as equal
        </li>
        <li>
          <code className="font-mono text-xs">m</code> — multiline:{" "}
          <code className="font-mono text-xs">^</code> and{" "}
          <code className="font-mono text-xs">$</code> match start/end of each
          line, not just the whole string
        </li>
        <li>
          <code className="font-mono text-xs">s</code> — dotAll: dot{" "}
          <code className="font-mono text-xs">.</code> matches newline
          characters too
        </li>
        <li>
          <code className="font-mono text-xs">u</code> — unicode: enables full
          Unicode matching including surrogate pairs and{" "}
          <code className="font-mono text-xs">\p{"{...}"}</code> property escapes
        </li>
      </ul>

      <h2 className={h2}>Capture groups and substitution</h2>
      <p className={prose}>
        Wrap part of your pattern in parentheses{" "}
        <code className="font-mono text-xs">(...)</code> to create a capture
        group. The tester shows each group's value separately in the match
        detail panel. Use the substitution field to replace matches — reference
        captured groups with{" "}
        <code className="font-mono text-xs">$1</code>,{" "}
        <code className="font-mono text-xs">$2</code>, etc. Named groups use
        the syntax <code className="font-mono text-xs">(?&lt;name&gt;...)</code>{" "}
        and can be referenced as{" "}
        <code className="font-mono text-xs">$&lt;name&gt;</code>.
      </p>

      <h2 className={h2}>Commonly used regex patterns</h2>
      <ul className={ul}>
        <li>
          Email:{" "}
          <code className="font-mono text-xs break-all">
            [a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{"{2,}"}
          </code>
        </li>
        <li>
          URL:{" "}
          <code className="font-mono text-xs break-all">
            https?://[^\s/$.?#].[^\s]*
          </code>
        </li>
        <li>
          IPv4:{" "}
          <code className="font-mono text-xs break-all">
            (\d{"{1,3}"}\.){"{3}"}\d{"{1,3}"}
          </code>
        </li>
        <li>
          ISO date:{" "}
          <code className="font-mono text-xs break-all">
            \d{"{4}"}-\d{"{2}"}-\d{"{2}"}
          </code>
        </li>
      </ul>
    </Section>
  );
}

function UuidGeneratorContent() {
  return (
    <Section>
      <h2 className={h2}>What is a UUID?</h2>
      <p className={prose}>
        A <strong>UUID</strong> (Universally Unique Identifier) is a 128-bit
        value formatted as 32 hexadecimal digits in the pattern{" "}
        <code className="font-mono text-xs">xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx</code>
        . The most widely used version is{" "}
        <strong>UUID v4</strong>, which is randomly generated — the probability
        of generating two identical UUIDs is astronomically small (1 in 5.3 ×
        10³⁶). UUIDs are used as primary keys in databases, request correlation
        IDs, file names, and anywhere a unique identifier is needed without
        coordination between services.
      </p>

      <h2 className={h2}>UUID v4 vs ULID vs Nano ID</h2>
      <ul className={ul}>
        <li>
          <strong>UUID v4</strong> — widely supported, 36 characters with
          dashes, random. Use when compatibility and ubiquity matter most (e.g.
          PostgreSQL <code className="font-mono text-xs">uuid</code> column type
          with native indexing).
        </li>
        <li>
          <strong>ULID</strong> (Universally Unique Lexicographically Sortable
          Identifier) — 26-character Crockford Base32 string. The first 10
          characters encode a millisecond timestamp making ULIDs sortable by
          creation time — ideal for database primary keys where insertion order
          matters.
        </li>
        <li>
          <strong>Nano ID</strong> — compact, URL-safe, configurable length.
          21 characters by default, uses a 64-character alphabet. Good for
          short IDs in URLs, session tokens, or any place where compact size
          matters over sortability.
        </li>
      </ul>

      <h2 className={h2}>When to use each</h2>
      <p className={prose}>
        Use UUID v4 for interoperability and database-native support. Use ULID
        when you need time-ordered IDs for efficient B-tree indexing. Use Nano
        ID for short identifiers in URLs, API keys, or client-side generated IDs
        where compactness matters.
      </p>
    </Section>
  );
}

function HashGeneratorContent() {
  return (
    <Section>
      <h2 className={h2}>What is a cryptographic hash?</h2>
      <p className={prose}>
        A <strong>cryptographic hash function</strong> takes any input and
        produces a fixed-length output (the hash or digest) that appears random.
        The same input always produces the same hash, but even a one-character
        change produces a completely different output. Hashes are one-way —
        you cannot reverse a hash to recover the original input. They are used
        to verify file integrity, store passwords securely, and create digital
        signatures.
      </p>

      <h2 className={h2}>SHA-1 vs SHA-256 vs SHA-512</h2>
      <ul className={ul}>
        <li>
          <strong>SHA-1</strong> — produces a 160-bit (40 hex character) digest.
          Considered cryptographically broken for digital signatures; still used
          in legacy systems and Git commit IDs.
        </li>
        <li>
          <strong>SHA-256</strong> — part of the SHA-2 family, 256-bit (64 hex
          chars). The current standard for most security applications including
          TLS certificates, Bitcoin mining, and HMAC-SHA256 signing in JWTs.
        </li>
        <li>
          <strong>SHA-384</strong> — 384-bit variant of SHA-2, used in some
          TLS cipher suites and Subresource Integrity (SRI) hashes.
        </li>
        <li>
          <strong>SHA-512</strong> — 512-bit (128 hex chars), the strongest
          SHA-2 variant. Preferred where maximum collision resistance is needed.
        </li>
      </ul>

      <h2 className={h2}>This tool runs entirely in your browser</h2>
      <p className={prose}>
        All hashing is computed using the Web Crypto API — your input never
        leaves your device. Suitable for checking file checksums, generating
        content hashes for cache-busting, and verifying data integrity.
      </p>
    </Section>
  );
}

function PasswordGeneratorContent() {
  return (
    <Section>
      <h2 className={h2}>What makes a strong password?</h2>
      <p className={prose}>
        Password strength is primarily determined by length and character
        variety. The{" "}
        <a
          href="https://pages.nist.gov/800-63-3/sp800-63b.html"
          target="_blank"
          rel="nofollow noopener noreferrer"
          className="text-accent hover:underline"
        >
          NIST SP 800-63B guidelines
        </a>{" "}
        recommend passwords of at least 8 characters, but 16+ characters
        dramatically increases resistance to brute-force attacks. Including
        uppercase, lowercase, digits, and symbols maximises entropy per
        character.
      </p>

      <h2 className={h2}>Password entropy explained</h2>
      <p className={prose}>
        Entropy measures unpredictability in bits. A password drawn from a pool
        of 72 characters (26 lowercase + 26 uppercase + 10 digits + 10 symbols)
        has ~6.17 bits of entropy per character. A 16-character password from
        this pool has ~98 bits of entropy — modern computers would take billions
        of years to brute-force at any realistic speed.
      </p>

      <h2 className={h2}>How this generator works</h2>
      <p className={prose}>
        This tool uses{" "}
        <code className="font-mono text-xs">crypto.getRandomValues()</code> —
        the browser's cryptographically secure pseudo-random number generator
        (CSPRNG). Passwords are never transmitted to a server. Choose your
        desired length and character sets, then copy the result directly.
      </p>

      <ul className={ul}>
        <li>Use a different password for every account</li>
        <li>Store passwords in a password manager (1Password, Bitwarden, etc.)</li>
        <li>Enable two-factor authentication where available</li>
        <li>Never use personal information (birthdays, names) in passwords</li>
      </ul>
    </Section>
  );
}

function UrlEncodeContent() {
  return (
    <Section>
      <h2 className={h2}>What is URL encoding?</h2>
      <p className={prose}>
        <strong>URL encoding</strong> (also called percent-encoding) converts
        characters that are not allowed or have special meaning in a URL into a{" "}
        <code className="font-mono text-xs">%XX</code> format, where{" "}
        <code className="font-mono text-xs">XX</code> is the character's
        hexadecimal UTF-8 byte value. For example, a space becomes{" "}
        <code className="font-mono text-xs">%20</code> and{" "}
        <code className="font-mono text-xs">&amp;</code> becomes{" "}
        <code className="font-mono text-xs">%26</code>.
      </p>

      <h2 className={h2}>Reserved characters in URLs</h2>
      <p className={prose}>
        RFC 3986 reserves characters like{" "}
        <code className="font-mono text-xs">: / ? # [ ] @ ! $ &amp; ' ( ) * + , ; =</code>{" "}
        for structural use in URLs. If these characters appear in a query
        parameter value, they must be percent-encoded so the URL parser does not
        misinterpret them. Unreserved characters{" "}
        <code className="font-mono text-xs">A–Z a–z 0–9 - _ . ~</code> are safe
        to use as-is.
      </p>

      <h2 className={h2}>encodeURIComponent vs encodeURI</h2>
      <ul className={ul}>
        <li>
          <code className="font-mono text-xs">encodeURIComponent()</code> —
          encodes everything except unreserved characters. Use this for
          individual query parameter values (this tool's behaviour).
        </li>
        <li>
          <code className="font-mono text-xs">encodeURI()</code> — encodes a
          full URL but leaves{" "}
          <code className="font-mono text-xs">: / ? # @ &amp; = + $ ,</code>{" "}
          intact. Use this when encoding a complete URL, not a single parameter.
        </li>
      </ul>
    </Section>
  );
}

function UrlDecodeContent() {
  return (
    <Section>
      <h2 className={h2}>What is URL decoding?</h2>
      <p className={prose}>
        <strong>URL decoding</strong> reverses percent-encoding — it converts
        sequences like <code className="font-mono text-xs">%20</code> back to a
        space, <code className="font-mono text-xs">%3A</code> back to{" "}
        <code className="font-mono text-xs">:</code>, and{" "}
        <code className="font-mono text-xs">%2F</code> back to{" "}
        <code className="font-mono text-xs">/</code>. It also handles the{" "}
        <code className="font-mono text-xs">+</code> sign used in{" "}
        <code className="font-mono text-xs">application/x-www-form-urlencoded</code>{" "}
        payloads as a space character.
      </p>

      <h2 className={h2}>When do you need to decode URLs?</h2>
      <ul className={ul}>
        <li>Reading query parameters from a URL copied out of a browser address bar</li>
        <li>Decoding redirect URLs that have been double-encoded</li>
        <li>Inspecting OAuth callback URLs and state parameters</li>
        <li>
          Decoding <code className="font-mono text-xs">Location</code> header values from HTTP
          301/302 responses
        </li>
        <li>Parsing webhook payloads encoded as form data</li>
      </ul>

      <p className={prose}>
        Also useful:{" "}
        <Link href="/tools/url-encode" className="text-accent hover:underline">
          URL Encode
        </Link>
        {", "}
        <Link href="/tools/base64-decode" className="text-accent hover:underline">
          Base64 Decode
        </Link>
        {", "}
        <Link href="/tools/url-parser" className="text-accent hover:underline">
          URL Parser
        </Link>
        .
      </p>
    </Section>
  );
}

function TextDiffContent() {
  return (
    <Section>
      <h2 className={h2}>What is a text diff?</h2>
      <p className={prose}>
        A <strong>text diff</strong> shows exactly what changed between two
        versions of a text. Lines added are highlighted in green, deleted lines
        in red, and unchanged context lines are shown in between. This is the
        same underlying technique used by Git to show commit changes and by code
        review tools like GitHub Pull Requests.
      </p>

      <h2 className={h2}>Diff algorithms: how it works</h2>
      <p className={prose}>
        This tool uses the{" "}
        <strong>Myers diff algorithm</strong> — the same algorithm used by Git.
        It finds the shortest edit script (minimum number of insertions and
        deletions) to transform text A into text B. For JSON comparison, use the{" "}
        <Link href="/tools/json-diff" className="text-accent hover:underline">
          JSON Diff
        </Link>{" "}
        tool which understands JSON structure rather than treating it as plain
        text.
      </p>

      <h2 className={h2}>Common use cases</h2>
      <ul className={ul}>
        <li>Comparing two versions of a configuration file or template</li>
        <li>Reviewing changes to a document before committing</li>
        <li>Checking what a code generator changed between runs</li>
        <li>Verifying that a "find and replace" only changed the intended lines</li>
        <li>Comparing API responses to spot regressions</li>
      </ul>
    </Section>
  );
}

function WordCounterContent() {
  return (
    <Section>
      <h2 className={h2}>What does this word counter measure?</h2>
      <p className={prose}>
        This <strong>online word counter</strong> gives you a complete text
        analysis in one click: word count, character count (with and without
        spaces), sentence count, paragraph count, and estimated reading time
        based on an average reading speed of 200 words per minute.
      </p>

      <h2 className={h2}>Word count vs character count</h2>
      <ul className={ul}>
        <li>
          <strong>Word count</strong> — useful for blog posts, essays, reports.
          Most social media platforms and publishing guidelines specify word
          limits.
        </li>
        <li>
          <strong>Character count (with spaces)</strong> — used by Twitter/X
          (280 chars), SMS (160 chars), and meta description limits (≈155
          chars).
        </li>
        <li>
          <strong>Character count (without spaces)</strong> — relevant for
          database column sizing, file format constraints, and some CMS systems.
        </li>
      </ul>

      <h2 className={h2}>Reading time estimation</h2>
      <p className={prose}>
        The average adult reads prose at 200–250 words per minute. Technical
        content with code snippets is typically read at 100–150 wpm. This tool
        calculates reading time at 200 wpm — a conservative estimate suitable
        for general content.
      </p>
    </Section>
  );
}

function CaseConverterContent() {
  return (
    <Section>
      <h2 className={h2}>Text case formats explained</h2>
      <p className={prose}>
        Different programming languages and style guides use different naming
        conventions. This <strong>case converter</strong> transforms any text
        between eight common formats instantly.
      </p>

      <ul className={ul}>
        <li>
          <strong>camelCase</strong> — first word lowercase, subsequent words
          capitalised with no separators. Standard in JavaScript, Java, Swift
          (variable names).
        </li>
        <li>
          <strong>PascalCase</strong> — every word capitalised, no separators.
          Used for class names in most languages and React component names.
        </li>
        <li>
          <strong>snake_case</strong> — all lowercase, words separated by
          underscores. Standard in Python, Ruby, and SQL column names.
        </li>
        <li>
          <strong>kebab-case</strong> — all lowercase, words separated by
          hyphens. Used in CSS class names, HTML attributes, and URL slugs.
        </li>
        <li>
          <strong>SCREAMING_SNAKE_CASE</strong> — all uppercase with
          underscores. Used for constants and environment variable names.
        </li>
        <li>
          <strong>Title Case</strong> — first letter of each word capitalised.
          Used in headings, titles, and proper nouns.
        </li>
        <li>
          <strong>Sentence case</strong> — only the first letter of the first
          word capitalised. Standard for UI labels and prose.
        </li>
      </ul>
    </Section>
  );
}

function ColorConverterContent() {
  return (
    <Section>
      <h2 className={h2}>HEX, RGB, and HSL color formats</h2>
      <p className={prose}>
        CSS supports multiple color representations, each useful in different
        contexts. This <strong>color converter</strong> translates between HEX,
        RGB, and HSL with a live color preview so you can verify the result
        visually.
      </p>

      <ul className={ul}>
        <li>
          <strong>HEX</strong> (e.g. <code className="font-mono text-xs">#4f46e5</code>) —
          the most compact format, widely used in design tools and CSS. Each
          pair of hex digits encodes one channel (red, green, blue) from 0–255.
        </li>
        <li>
          <strong>RGB</strong> (e.g.{" "}
          <code className="font-mono text-xs">rgb(79, 70, 229)</code>) — directly
          represents the red, green, and blue light intensities from 0 to 255.
          Intuitive for programmatic colour manipulation.
        </li>
        <li>
          <strong>HSL</strong> (e.g.{" "}
          <code className="font-mono text-xs">hsl(243, 75%, 59%)</code>) — Hue
          (0–360°), Saturation (0–100%), Lightness (0–100%). Much easier to
          adjust colours by feel: increase lightness to tint, decrease to shade,
          rotate hue to change the colour family.
        </li>
      </ul>

      <h2 className={h2}>When to use each format</h2>
      <p className={prose}>
        Use HEX for design handoff and static stylesheets. Use RGB when you need
        to manipulate colour values in JavaScript. Use HSL when building dynamic
        colour systems (dark mode, tints, shades) — the lightness axis maps
        directly to human perception of brightness, making it much easier to
        generate accessible colour palettes programmatically.
      </p>
    </Section>
  );
}

function UnixTimestampContent() {
  return (
    <Section>
      <h2 className={h2}>What is a Unix timestamp?</h2>
      <p className={prose}>
        A <strong>Unix timestamp</strong> (also called epoch time or POSIX time)
        is the number of seconds that have elapsed since 00:00:00 UTC on
        Thursday, 1 January 1970 — the "Unix epoch". It is a single integer
        that uniquely represents any moment in time regardless of timezone,
        making it the standard way to store and compare dates in databases, APIs,
        and log files.
      </p>

      <h2 className={h2}>Seconds vs milliseconds</h2>
      <p className={prose}>
        Different systems use different precision. Unix/POSIX timestamps are in
        seconds (10-digit number as of 2025). JavaScript's{" "}
        <code className="font-mono text-xs">Date.now()</code> returns
        milliseconds (13 digits). Always check which unit an API expects —
        passing milliseconds where seconds are expected gives a date 1000× in
        the future.
      </p>

      <h2 className={h2}>Common timestamp values</h2>
      <ul className={ul}>
        <li>
          <code className="font-mono text-xs">0</code> — Unix epoch: 1970-01-01
          00:00:00 UTC
        </li>
        <li>
          <code className="font-mono text-xs">1000000000</code> — 2001-09-09
          01:46:40 UTC (1 billion seconds)
        </li>
        <li>
          <code className="font-mono text-xs">2147483647</code> — 2038-01-19
          03:14:07 UTC (max value for 32-bit signed int — the "Year 2038
          problem")
        </li>
        <li>
          <code className="font-mono text-xs">4102444800</code> — 2100-01-01
          00:00:00 UTC (common sentinel for "no expiry" in JWT{" "}
          <code className="font-mono text-xs">exp</code> claims)
        </li>
      </ul>

      <p className={prose}>
        Also useful:{" "}
        <Link href="/epoch" className="text-accent hover:underline">
          Epoch Converter workspace
        </Link>
        {", "}
        <Link href="/jwt-debugger" className="text-accent hover:underline">
          JWT Debugger
        </Link>
        .
      </p>
    </Section>
  );
}

function CronParserContent() {
  return (
    <Section>
      <h2 className={h2}>What is a cron expression?</h2>
      <p className={prose}>
        A <strong>cron expression</strong> is a five-field (or six-field, with
        seconds) string that defines a recurring schedule. Cron originated in
        Unix systems and is now used everywhere — GitHub Actions, AWS EventBridge,
        Kubernetes CronJobs, Vercel scheduled functions, and most CI/CD platforms.
      </p>

      <h2 className={h2}>Cron field order</h2>
      <ul className={ul}>
        <li>
          Field 1: <strong>Minute</strong> — 0–59
        </li>
        <li>
          Field 2: <strong>Hour</strong> — 0–23
        </li>
        <li>
          Field 3: <strong>Day of month</strong> — 1–31
        </li>
        <li>
          Field 4: <strong>Month</strong> — 1–12 (or JAN–DEC)
        </li>
        <li>
          Field 5: <strong>Day of week</strong> — 0–7 (0 and 7 are both Sunday;
          or SUN–SAT)
        </li>
      </ul>

      <h2 className={h2}>Common cron patterns</h2>
      <ul className={ul}>
        <li>
          <code className="font-mono text-xs">* * * * *</code> — every minute
        </li>
        <li>
          <code className="font-mono text-xs">0 * * * *</code> — at the start
          of every hour
        </li>
        <li>
          <code className="font-mono text-xs">0 9 * * 1-5</code> — 9:00 AM
          every weekday
        </li>
        <li>
          <code className="font-mono text-xs">0 0 * * 0</code> — midnight every
          Sunday
        </li>
        <li>
          <code className="font-mono text-xs">*/15 * * * *</code> — every 15
          minutes
        </li>
        <li>
          <code className="font-mono text-xs">0 0 1 * *</code> — midnight on
          the first of every month
        </li>
      </ul>

      <p className={prose}>
        Also useful:{" "}
        <Link href="/cron-editor" className="text-accent hover:underline">
          Cron Editor workspace
        </Link>
        {" "}for a visual schedule builder with next-run preview.
      </p>
    </Section>
  );
}

function HtmlToJsxContent() {
  return (
    <Section>
      <h2 className={h2}>HTML to JSX conversion — what changes?</h2>
      <p className={prose}>
        React JSX is almost identical to HTML but has several important
        differences that cause syntax errors if you paste raw HTML into a
        component. This tool automatically handles all the necessary
        transformations.
      </p>

      <ul className={ul}>
        <li>
          <code className="font-mono text-xs">class</code> →{" "}
          <code className="font-mono text-xs">className</code> (
          <code className="font-mono text-xs">class</code> is a reserved word in
          JavaScript)
        </li>
        <li>
          <code className="font-mono text-xs">for</code> →{" "}
          <code className="font-mono text-xs">htmlFor</code> (same reason —
          reserved word)
        </li>
        <li>
          Void elements self-closed:{" "}
          <code className="font-mono text-xs">&lt;br&gt;</code> →{" "}
          <code className="font-mono text-xs">&lt;br /&gt;</code>,{" "}
          <code className="font-mono text-xs">&lt;input&gt;</code> →{" "}
          <code className="font-mono text-xs">&lt;input /&gt;</code>
        </li>
        <li>
          Inline style strings converted to objects:{" "}
          <code className="font-mono text-xs">style=&quot;color: red&quot;</code>{" "}
          → <code className="font-mono text-xs">style={`{{ color: "red" }}`}</code>
        </li>
        <li>
          Event attributes camelCased:{" "}
          <code className="font-mono text-xs">onclick</code> →{" "}
          <code className="font-mono text-xs">onClick</code>
        </li>
        <li>
          HTML comments converted to JSX comment syntax{" "}
          <code className="font-mono text-xs">{`{/* */}`}</code>
        </li>
      </ul>

      <p className={prose}>
        Also useful:{" "}
        <Link href="/tools/html-entity-encode" className="text-accent hover:underline">
          HTML Entity Encode
        </Link>
        {", "}
        <Link href="/tools/html-preview" className="text-accent hover:underline">
          HTML Preview
        </Link>
        .
      </p>
    </Section>
  );
}

function MarkdownToHtmlContent() {
  return (
    <Section>
      <h2 className={h2}>Markdown to HTML conversion</h2>
      <p className={prose}>
        This tool converts <strong>Markdown</strong> syntax to clean HTML using
        GitHub Flavored Markdown (GFM) — the same dialect used by GitHub README
        files, issues, and pull request descriptions. GFM extends standard
        CommonMark with tables, task lists, strikethrough, and fenced code
        blocks with syntax highlighting hints.
      </p>

      <h2 className={h2}>GFM extensions over standard Markdown</h2>
      <ul className={ul}>
        <li>
          <strong>Tables</strong> — pipe-separated columns with alignment
          markers in the header separator row
        </li>
        <li>
          <strong>Task lists</strong> —{" "}
          <code className="font-mono text-xs">- [x] done</code> and{" "}
          <code className="font-mono text-xs">- [ ] todo</code> render as
          checkboxes
        </li>
        <li>
          <strong>Strikethrough</strong> —{" "}
          <code className="font-mono text-xs">~~text~~</code> renders as{" "}
          <s>text</s>
        </li>
        <li>
          <strong>Fenced code blocks</strong> — triple backticks with optional
          language identifier for syntax highlighting
        </li>
        <li>
          <strong>Autolinks</strong> — bare URLs are automatically converted to
          clickable links
        </li>
      </ul>

      <p className={prose}>
        Also useful:{" "}
        <Link href="/tools/markdown-preview" className="text-accent hover:underline">
          Markdown Preview
        </Link>
        {" "}for a live side-by-side editor,{" "}
        <Link href="/tools/html-to-markdown" className="text-accent hover:underline">
          HTML → Markdown
        </Link>
        {" "}to reverse the conversion.
      </p>
    </Section>
  );
}

// ── JSON conversions ────────────────────────────────────────────────────────

function JsonDiffContent() {
  return (
    <Section>
      <h2 className={h2}>JSON Diff — structural comparison</h2>
      <p className={prose}>
        This tool compares two JSON documents and highlights every added, removed,
        or changed key using a color-coded diff. Unlike a plain text diff, it
        understands JSON structure — key order differences in objects are ignored
        because JSON objects are unordered by definition.
      </p>
      <ul className={ul}>
        <li>Spot renamed or moved keys in API response changes</li>
        <li>Verify config file migrations preserved all values</li>
        <li>Compare two database record exports to find divergence</li>
      </ul>
      <p className={prose}>
        Also useful:{" "}
        <Link href="/json" className="text-accent hover:underline">JSON Workspace</Link>
        {", "}
        <Link href="/diff-checker" className="text-accent hover:underline">Text Diff</Link>.
      </p>
    </Section>
  );
}

function JsonToYamlContent() {
  return (
    <Section>
      <h2 className={h2}>JSON to YAML conversion</h2>
      <p className={prose}>
        <strong>YAML</strong> (YAML Ain&apos;t Markup Language) is a
        human-friendly superset of JSON used widely in config files — Kubernetes
        manifests, GitHub Actions workflows, Docker Compose, Ansible playbooks,
        and most CI/CD platforms. This tool converts JSON to YAML instantly with
        proper indentation and quoting of values that require it.
      </p>
      <ul className={ul}>
        <li>YAML uses indentation instead of curly braces and brackets</li>
        <li>Strings usually don&apos;t need quotes — except when containing special chars</li>
        <li>YAML supports comments (<code className="font-mono text-xs">#</code>) — JSON does not</li>
        <li>Multi-line strings use block scalars (<code className="font-mono text-xs">|</code> or <code className="font-mono text-xs">&gt;</code>)</li>
      </ul>
    </Section>
  );
}

function YamlToJsonContent() {
  return (
    <Section>
      <h2 className={h2}>YAML to JSON conversion</h2>
      <p className={prose}>
        Converts YAML configuration files and data to strict JSON. Useful when
        you need to pass YAML-authored config to a JSON-only API, or validate a
        Kubernetes/Docker Compose manifest against a JSON Schema. YAML comments
        are stripped during conversion since JSON has no comment syntax.
      </p>
      <p className={prose}>
        Also useful:{" "}
        <Link href="/tools/json-to-yaml" className="text-accent hover:underline">JSON → YAML</Link>
        {", "}
        <Link href="/tools/json-formatter" className="text-accent hover:underline">JSON Formatter</Link>.
      </p>
    </Section>
  );
}

function JsonToCsvContent() {
  return (
    <Section>
      <h2 className={h2}>JSON to CSV conversion</h2>
      <p className={prose}>
        Converts a JSON array of objects to a CSV spreadsheet. Column headers
        are extracted automatically from the object keys. Use this to export
        API responses to Excel, Google Sheets, or any tool that accepts CSV.
      </p>
      <ul className={ul}>
        <li>Input must be a JSON array of flat objects (top-level keys become columns)</li>
        <li>Nested objects are serialised to a string in the cell</li>
        <li>Values containing commas or quotes are automatically escaped</li>
      </ul>
      <p className={prose}>
        Also useful:{" "}
        <Link href="/tools/csv-to-json" className="text-accent hover:underline">CSV → JSON</Link>
        {", "}
        <Link href="/json" className="text-accent hover:underline">JSON Workspace</Link>.
      </p>
    </Section>
  );
}

function CsvToJsonContent() {
  return (
    <Section>
      <h2 className={h2}>CSV to JSON conversion</h2>
      <p className={prose}>
        Parses a CSV file (with or without a header row) and converts it to a
        JSON array of objects. Type inference is applied — numeric strings become
        numbers, <code className="font-mono text-xs">true</code>/<code className="font-mono text-xs">false</code> become booleans. Useful for
        importing spreadsheet exports into a JavaScript application or MongoDB.
      </p>
      <p className={prose}>
        Also useful:{" "}
        <Link href="/tools/json-to-csv" className="text-accent hover:underline">JSON → CSV</Link>
        {", "}
        <Link href="/tools/json-formatter" className="text-accent hover:underline">JSON Formatter</Link>.
      </p>
    </Section>
  );
}

function JsonToTypescriptContent() {
  return (
    <Section>
      <h2 className={h2}>Generate TypeScript interfaces from JSON</h2>
      <p className={prose}>
        Paste any JSON object and this tool generates TypeScript{" "}
        <code className="font-mono text-xs">interface</code> declarations with
        inferred property types. Nested objects produce nested interfaces. Arrays
        are typed with their element type. Speeds up the repetitive task of
        manually writing types for API responses.
      </p>
      <ul className={ul}>
        <li>
          <code className="font-mono text-xs">null</code> values produce{" "}
          <code className="font-mono text-xs">T | null</code> union types
        </li>
        <li>Mixed-type arrays produce union element types</li>
        <li>Property names with special characters are quoted</li>
      </ul>
    </Section>
  );
}

function JsonToXmlContent() {
  return (
    <Section>
      <h2 className={h2}>JSON to XML conversion</h2>
      <p className={prose}>
        Converts a JSON object to an XML document. JSON keys become XML element
        names, arrays become repeated sibling elements. Useful for interoperating
        with legacy systems, SOAP services, or document databases that use XML.
      </p>
      <p className={prose}>
        Also useful:{" "}
        <Link href="/tools/xml-to-json" className="text-accent hover:underline">XML → JSON</Link>
        {", "}
        <Link href="/json" className="text-accent hover:underline">JSON Workspace</Link>.
      </p>
    </Section>
  );
}

function XmlToJsonContent() {
  return (
    <Section>
      <h2 className={h2}>XML to JSON conversion</h2>
      <p className={prose}>
        Parses an XML document and converts it to a JSON object. Attributes are
        mapped to <code className="font-mono text-xs">@attr</code> keys, text
        content to <code className="font-mono text-xs">#text</code>. Useful for
        consuming RSS feeds, SOAP responses, or legacy enterprise APIs in a
        modern JavaScript application.
      </p>
      <p className={prose}>
        Also useful:{" "}
        <Link href="/tools/json-to-xml" className="text-accent hover:underline">JSON → XML</Link>
        {", "}
        <Link href="/json" className="text-accent hover:underline">JSON Workspace</Link>.
      </p>
    </Section>
  );
}

function TomlToJsonContent() {
  return (
    <Section>
      <h2 className={h2}>TOML to JSON conversion</h2>
      <p className={prose}>
        <strong>TOML</strong> (Tom&apos;s Obvious Minimal Language) is an
        INI-style config format used by Rust (Cargo.toml), Hugo, and many other
        tools. It is strongly typed and more readable than JSON for config files.
        This tool converts TOML to JSON for use in tools and APIs that expect
        JSON input.
      </p>
    </Section>
  );
}

// ── Encoding ────────────────────────────────────────────────────────────────

function Base64ImageContent() {
  return (
    <Section>
      <h2 className={h2}>Base64 image encoder / decoder</h2>
      <p className={prose}>
        Converts image files (PNG, JPEG, GIF, WebP, SVG) to Base64{" "}
        <code className="font-mono text-xs">data:</code> URI strings, or decodes
        a Base64 data URI back to a viewable image. Data URIs let you embed
        images directly in HTML or CSS without a separate HTTP request — useful
        for small icons and critical above-the-fold images.
      </p>
      <ul className={ul}>
        <li>
          Drag-and-drop an image file or paste a Base64 string
        </li>
        <li>
          Outputs a full data URI:{" "}
          <code className="font-mono text-xs break-all">data:image/png;base64,...</code>
        </li>
        <li>
          Data URIs increase HTML/CSS size by ~33% — only use for images under
          ~5 KB
        </li>
      </ul>
    </Section>
  );
}

function HtmlEntityEncodeContent() {
  return (
    <Section>
      <h2 className={h2}>HTML entity encoding</h2>
      <p className={prose}>
        Converts reserved and special characters to their HTML entity
        equivalents — for example{" "}
        <code className="font-mono text-xs">&lt;</code> →{" "}
        <code className="font-mono text-xs">&amp;lt;</code> and{" "}
        <code className="font-mono text-xs">&amp;</code> →{" "}
        <code className="font-mono text-xs">&amp;amp;</code>. This prevents
        browser misinterpretation of content as markup and is an essential step
        in preventing Cross-Site Scripting (XSS) vulnerabilities.
      </p>
      <ul className={ul}>
        <li>Always encode user-supplied content before inserting it into HTML</li>
        <li>Named entities: <code className="font-mono text-xs">&amp;amp; &amp;lt; &amp;gt; &amp;quot; &amp;apos;</code></li>
        <li>Numeric entities work for any Unicode character: <code className="font-mono text-xs">&amp;#8364;</code> → €</li>
      </ul>
    </Section>
  );
}

function HtmlEntityDecodeContent() {
  return (
    <Section>
      <h2 className={h2}>HTML entity decoding</h2>
      <p className={prose}>
        Converts HTML entities back to their original characters.{" "}
        <code className="font-mono text-xs">&amp;amp;</code> →{" "}
        <code className="font-mono text-xs">&amp;</code>,{" "}
        <code className="font-mono text-xs">&amp;lt;</code> →{" "}
        <code className="font-mono text-xs">&lt;</code>, and so on. Useful when
        reading HTML source, scraping web pages, or debugging escaped API
        responses.
      </p>
      <p className={prose}>
        Also useful:{" "}
        <Link href="/tools/html-entity-encode" className="text-accent hover:underline">
          HTML Entity Encode
        </Link>
        {", "}
        <Link href="/tools/html-to-text" className="text-accent hover:underline">
          HTML → Plain Text
        </Link>.
      </p>
    </Section>
  );
}

function TextToHexContent() {
  return (
    <Section>
      <h2 className={h2}>Text to hexadecimal encoding</h2>
      <p className={prose}>
        Converts each character of a string to its hexadecimal byte
        representation. Each character becomes two hex digits separated by a
        space — for example <code className="font-mono text-xs">&quot;Hi&quot;</code> →{" "}
        <code className="font-mono text-xs">48 69</code>. Used in networking,
        cryptography, and low-level debugging to inspect raw byte values.
      </p>
      <ul className={ul}>
        <li>ASCII characters map to single bytes (00–7F)</li>
        <li>UTF-8 multi-byte characters (emoji, non-Latin scripts) produce 2–4 hex byte pairs</li>
        <li>Commonly used when inspecting binary protocols, TLS handshakes, or raw socket data</li>
      </ul>
    </Section>
  );
}

function HexToTextContent() {
  return (
    <Section>
      <h2 className={h2}>Hexadecimal to text decoding</h2>
      <p className={prose}>
        Converts a hex byte sequence back to a readable string. Input can be
        space-separated, colon-separated, or a continuous hex string (e.g.{" "}
        <code className="font-mono text-xs">48656c6c6f</code> → "Hello"). The
        decoder handles UTF-8 multi-byte sequences for non-ASCII characters.
      </p>
      <p className={prose}>
        Also useful:{" "}
        <Link href="/tools/text-to-hex" className="text-accent hover:underline">Text → Hex</Link>
        {", "}
        <Link href="/tools/base64-decode" className="text-accent hover:underline">Base64 Decode</Link>.
      </p>
    </Section>
  );
}

function TextToBinaryContent() {
  return (
    <Section>
      <h2 className={h2}>Text to binary representation</h2>
      <p className={prose}>
        Converts each character to its 8-bit binary (base-2) representation,
        space-separated. For example <code className="font-mono text-xs">&quot;A&quot;</code> →{" "}
        <code className="font-mono text-xs">01000001</code>. Useful for
        educational purposes, computer science coursework, and visualising how
        text is stored as bits.
      </p>
    </Section>
  );
}

function BinaryToTextContent() {
  return (
    <Section>
      <h2 className={h2}>Binary to text decoding</h2>
      <p className={prose}>
        Interprets a sequence of 8-bit binary numbers as ASCII/UTF-8 characters.
        Accepts space-separated groups of 8 bits. For example{" "}
        <code className="font-mono text-xs">01001000 01101001</code> → "Hi".
      </p>
    </Section>
  );
}

function Rot13Content() {
  return (
    <Section>
      <h2 className={h2}>What is ROT13?</h2>
      <p className={prose}>
        <strong>ROT13</strong> is a simple substitution cipher that replaces
        each letter with the letter 13 positions later in the alphabet. Because
        the alphabet has 26 letters, applying ROT13 twice returns the original
        text — encoding and decoding use the same operation. Non-alphabetic
        characters (digits, punctuation, spaces) pass through unchanged.
      </p>
      <ul className={ul}>
        <li>ROT13 is not encryption — it provides no security</li>
        <li>Historically used on Usenet to hide spoilers and puzzle answers</li>
        <li>Still used in some programming puzzles and CTF challenges</li>
        <li>Example: &quot;Hello&quot; → &quot;Uryyb&quot; → &quot;Hello&quot;</li>
      </ul>
    </Section>
  );
}

function MorseCodeContent() {
  return (
    <Section>
      <h2 className={h2}>Morse code encoder / decoder</h2>
      <p className={prose}>
        <strong>Morse code</strong> represents letters and digits as sequences
        of dots (<code className="font-mono text-xs">·</code>) and dashes (
        <code className="font-mono text-xs">−</code>). Developed in the 1830s
        for telegraph communication, it is still used in amateur radio, aviation
        (VOR/NDB beacons), and emergency signalling. This tool converts plain
        text to Morse code and back.
      </p>
      <ul className={ul}>
        <li>Letters are separated by a single space</li>
        <li>Words are separated by a forward slash or double space</li>
        <li>
          SOS in Morse: <code className="font-mono text-xs">··· −−− ···</code>
        </li>
      </ul>
    </Section>
  );
}

function StringInspectorContent() {
  return (
    <Section>
      <h2 className={h2}>Deep string inspection and analysis</h2>
      <p className={prose}>
        The <strong>String Inspector</strong> analyses any input string and
        reports: length in characters, length in bytes (UTF-8), Unicode
        codepoints with their names, character frequency distribution, Shannon
        entropy, and line/word counts. Useful for debugging encoding issues,
        analysing passwords, and understanding non-ASCII content.
      </p>
      <ul className={ul}>
        <li>
          <strong>Shannon entropy</strong> — measures randomness in bits per
          character. High entropy (~3.9+) indicates random or compressed data;
          low entropy indicates repetitive or predictable text.
        </li>
        <li>
          <strong>Byte length vs character length</strong> — differs for
          multi-byte Unicode characters like emoji or CJK ideographs.
        </li>
        <li>
          <strong>Invisible characters</strong> — zero-width spaces, soft
          hyphens, and BOM markers are revealed in the codepoint view.
        </li>
      </ul>
    </Section>
  );
}

// ── Dev tools ────────────────────────────────────────────────────────────────

function AesEncryptContent() {
  return (
    <Section>
      <h2 className={h2}>AES-256-GCM encryption — how it works</h2>
      <p className={prose}>
        This tool encrypts and decrypts text using{" "}
        <strong>AES-256-GCM</strong> — the same algorithm used by TLS 1.3,
        Signal, and most modern security systems. A 256-bit key is derived from
        your password using <strong>PBKDF2</strong> with 310,000 iterations and
        a random salt. GCM (Galois/Counter Mode) provides both confidentiality
        and authenticated integrity — any tampering with the ciphertext is
        detected on decryption. Everything runs in your browser via the Web
        Crypto API; your data and password never leave your device.
      </p>
      <ul className={ul}>
        <li>
          <strong>AES-256</strong> — 256-bit key, 128-bit block size. Brute
          force is computationally infeasible with current hardware.
        </li>
        <li>
          <strong>GCM mode</strong> — authenticated encryption; decryption
          fails if the ciphertext is altered.
        </li>
        <li>
          <strong>PBKDF2</strong> — key derivation with high iteration count
          makes dictionary attacks against the password slow.
        </li>
        <li>
          A unique random salt and IV are generated for every encryption — the
          same plaintext encrypted twice produces different ciphertexts.
        </li>
      </ul>
      <p className={prose}>
        Also useful:{" "}
        <Link href="/tools/hash-generator" className="text-accent hover:underline">Hash Generator</Link>
        {", "}
        <Link href="/tools/password-generator" className="text-accent hover:underline">Password Generator</Link>.
      </p>
    </Section>
  );
}

function QrCodeContent() {
  return (
    <Section>
      <h2 className={h2}>QR code generator</h2>
      <p className={prose}>
        Generates a <strong>QR code</strong> from any text or URL. QR (Quick
        Response) codes are 2D barcodes that can encode up to ~4,000 characters.
        They are scanned by smartphone cameras to open URLs, share contact info
        (vCard), connect to Wi-Fi networks, or trigger any action without typing.
      </p>
      <ul className={ul}>
        <li>
          <strong>Error correction levels:</strong> L (7%), M (15%), Q (25%), H
          (30%) — higher levels make the code larger but scannable even if
          partially obscured.
        </li>
        <li>
          For URLs, keep them short — longer content requires a denser QR code
          which is harder to scan at small sizes.
        </li>
        <li>
          Download as PNG or SVG for use in print, presentations, or web pages.
        </li>
      </ul>
    </Section>
  );
}

function UrlParserContent() {
  return (
    <Section>
      <h2 className={h2}>URL components explained</h2>
      <p className={prose}>
        Breaks a URL into its constituent parts and displays them in a structured
        table. Understanding URL anatomy is essential when debugging redirects,
        OAuth flows, webhook configurations, and API endpoint construction.
      </p>
      <ul className={ul}>
        <li>
          <strong>Scheme</strong> — <code className="font-mono text-xs">https://</code> or <code className="font-mono text-xs">http://</code>
        </li>
        <li>
          <strong>Authority</strong> — hostname + optional port, e.g.{" "}
          <code className="font-mono text-xs">api.example.com:8443</code>
        </li>
        <li>
          <strong>Path</strong> — <code className="font-mono text-xs">/v2/users/123</code>
        </li>
        <li>
          <strong>Query string</strong> — key-value pairs after{" "}
          <code className="font-mono text-xs">?</code>, percent-decoded
        </li>
        <li>
          <strong>Fragment</strong> — the hash part (<code className="font-mono text-xs">#section</code>),
          never sent to the server
        </li>
        <li>
          <strong>Credentials</strong> — optional user:password embedded in the
          URL (deprecated for security reasons)
        </li>
      </ul>
    </Section>
  );
}

function BaseConverterContent() {
  return (
    <Section>
      <h2 className={h2}>Number base conversion</h2>
      <p className={prose}>
        Converts integers between <strong>decimal</strong> (base 10),{" "}
        <strong>hexadecimal</strong> (base 16),{" "}
        <strong>binary</strong> (base 2), and <strong>octal</strong> (base 8).
      </p>
      <ul className={ul}>
        <li>
          <strong>Binary (base 2)</strong> — how computers store data. Each bit
          is 0 or 1. Used in bitwise operations, subnet masks, and hardware
          registers.
        </li>
        <li>
          <strong>Octal (base 8)</strong> — digits 0–7. Historically used in
          Unix file permissions (
          <code className="font-mono text-xs">chmod 755</code>).
        </li>
        <li>
          <strong>Hexadecimal (base 16)</strong> — digits 0–9 and A–F. Used for
          memory addresses, colour codes, SHA hashes, and byte-level data.
        </li>
      </ul>
    </Section>
  );
}

function CssMinifierContent() {
  return (
    <Section>
      <h2 className={h2}>CSS minification</h2>
      <p className={prose}>
        Removes whitespace, comments, and redundant characters from CSS to
        reduce file size. A minified CSS file loads faster and reduces bandwidth
        cost. For production, CSS is typically minified as part of the build
        pipeline (webpack, Vite, esbuild) — this tool is for quick manual
        minification or understanding what a bundler produces.
      </p>
      <ul className={ul}>
        <li>Strips all comments and unnecessary whitespace</li>
        <li>Collapses shorthand properties where possible</li>
        <li>Removes trailing semicolons and redundant units on zero values</li>
      </ul>
    </Section>
  );
}

function HtmlMinifierContent() {
  return (
    <Section>
      <h2 className={h2}>HTML minification</h2>
      <p className={prose}>
        Removes whitespace between HTML tags, HTML comments, and optional closing
        tags to reduce page size. Smaller HTML means faster initial server
        response and less data transferred. Modern HTTP/2 with gzip/Brotli
        compression reduces the benefit, but minification still helps for
        uncached responses and data-metered connections.
      </p>
    </Section>
  );
}

function SqlFormatterContent() {
  return (
    <Section>
      <h2 className={h2}>SQL formatter and beautifier</h2>
      <p className={prose}>
        Reformats SQL queries with consistent keyword casing, indentation, and
        line breaks. Makes long, minified, or AI-generated SQL queries readable.
        Supports standard SQL and common dialects (PostgreSQL, MySQL, SQLite,
        SQL Server). Useful for code reviews, documentation, and understanding
        ORM-generated queries.
      </p>
      <ul className={ul}>
        <li>Keywords capitalised (SELECT, FROM, WHERE, JOIN, etc.)</li>
        <li>Each clause on its own line with aligned indentation</li>
        <li>Nested subqueries indented correctly</li>
        <li>All formatting is client-side — your queries never leave your browser</li>
      </ul>
    </Section>
  );
}

function CurlToFetchContent() {
  return (
    <Section>
      <h2 className={h2}>Convert cURL commands to JavaScript fetch</h2>
      <p className={prose}>
        Pastes a <code className="font-mono text-xs">curl</code> command (e.g.
        from browser DevTools → Copy as cURL) and converts it to a JavaScript{" "}
        <code className="font-mono text-xs">fetch()</code> call with the same
        headers, method, and body. Saves time when implementing API calls in a
        frontend or Node.js application.
      </p>
      <ul className={ul}>
        <li>Handles <code className="font-mono text-xs">-H</code> headers, <code className="font-mono text-xs">-d</code> data, <code className="font-mono text-xs">-X</code> method flags</li>
        <li>JSON bodies are kept as-is and passed to <code className="font-mono text-xs">JSON.stringify()</code></li>
        <li>Basic auth (<code className="font-mono text-xs">-u user:pass</code>) becomes an Authorization header</li>
      </ul>
      <p className={prose}>
        Also useful:{" "}
        <Link href="/tools/curl-formatter" className="text-accent hover:underline">cURL Formatter</Link>
        {", "}
        <Link href="/api-tester" className="text-accent hover:underline">API Tester</Link>.
      </p>
    </Section>
  );
}

function CurlFormatterContent() {
  return (
    <Section>
      <h2 className={h2}>cURL command formatter</h2>
      <p className={prose}>
        Reformats a cURL command from a single long line to multi-line with each
        flag on its own line (POSIX backslash continuation), or collapses a
        multi-line cURL to a single line. Makes long cURL commands readable for
        documentation and sharing.
      </p>
    </Section>
  );
}

function StringEscapeContent() {
  return (
    <Section>
      <h2 className={h2}>String escaping</h2>
      <p className={prose}>
        Escapes special characters in a string for safe embedding in different
        contexts. The wrong escaping (or missing escaping) causes syntax errors,
        broken output, or security vulnerabilities.
      </p>
      <ul className={ul}>
        <li>
          <strong>JSON</strong> — escapes quotes, backslashes, and control
          characters. Required before embedding strings in JSON values.
        </li>
        <li>
          <strong>JavaScript</strong> — similar to JSON but also handles
          template literal backticks and script-end sequences.
        </li>
        <li>
          <strong>SQL</strong> — escapes single quotes to prevent SQL injection
          (always prefer parameterised queries in production code).
        </li>
        <li>
          <strong>Regex</strong> — escapes metacharacters (
          <code className="font-mono text-xs">. * + ? ^ $ [ ] ( ) | { } \</code>)
          so a literal string can be used as a regex pattern.
        </li>
      </ul>
    </Section>
  );
}

function MimeLookupContent() {
  return (
    <Section>
      <h2 className={h2}>MIME type lookup</h2>
      <p className={prose}>
        Looks up the MIME type (Content-Type) for a given file extension, or
        maps a MIME type back to its common file extension. MIME types are sent
        in HTTP{" "}
        <code className="font-mono text-xs">Content-Type</code> headers to tell
        browsers how to handle a response — for example{" "}
        <code className="font-mono text-xs">application/json</code>,{" "}
        <code className="font-mono text-xs">image/svg+xml</code>, or{" "}
        <code className="font-mono text-xs">text/css</code>.
      </p>
      <ul className={ul}>
        <li>Essential when configuring web server MIME types (Nginx, Apache, Caddy)</li>
        <li>Needed when building file upload handlers that validate by content type</li>
        <li>Useful for setting correct Content-Type on S3 object uploads</li>
      </ul>
    </Section>
  );
}

function HtmlPreviewContent() {
  return (
    <Section>
      <h2 className={h2}>Live HTML preview — sandboxed browser</h2>
      <p className={prose}>
        Renders HTML in a sandboxed iframe so you can preview markup, CSS, and
        (optionally) JavaScript without running a local dev server. The sandbox
        attribute prevents the preview from accessing parent window context or
        cookies, making it safe to test untrusted HTML snippets.
      </p>
      <ul className={ul}>
        <li>Instant render on every keystroke — no build step</li>
        <li>JavaScript execution can be toggled off for safe static previews</li>
        <li>Useful for testing email HTML, widget embeds, and documentation snippets</li>
      </ul>
    </Section>
  );
}

function MarkdownPreviewContent() {
  return (
    <Section>
      <h2 className={h2}>Live Markdown preview editor</h2>
      <p className={prose}>
        A split-pane editor that renders your Markdown in real time alongside
        the source. Uses <strong>GitHub Flavored Markdown</strong> (GFM) —
        the same dialect used by GitHub README files, GitLab, Notion, and
        most modern documentation tools. Write Markdown on the left, see the
        rendered result on the right instantly.
      </p>
      <ul className={ul}>
        <li>GFM tables, task lists, strikethrough, and fenced code blocks</li>
        <li>Copy the rendered HTML with one click for pasting into a CMS</li>
        <li>Great for drafting README files, blog posts, and API documentation</li>
      </ul>
      <p className={prose}>
        Also useful:{" "}
        <Link href="/tools/markdown-to-html" className="text-accent hover:underline">Markdown → HTML</Link>
        {", "}
        <Link href="/tools/html-to-markdown" className="text-accent hover:underline">HTML → Markdown</Link>.
      </p>
    </Section>
  );
}

// ── Text tools ───────────────────────────────────────────────────────────────

function SlugGeneratorContent() {
  return (
    <Section>
      <h2 className={h2}>What is a URL slug?</h2>
      <p className={prose}>
        A <strong>URL slug</strong> is the human-readable part of a URL that
        identifies a page — for example, in{" "}
        <code className="font-mono text-xs">devbench.co.in/tools/slug-generator</code>,
        the slug is <code className="font-mono text-xs">slug-generator</code>.
        Slugs are lowercase, hyphen-separated, and contain only ASCII
        alphanumeric characters. Good slugs improve SEO and readability.
      </p>
      <ul className={ul}>
        <li>Non-ASCII characters (accents, CJK) are transliterated to ASCII</li>
        <li>Spaces and underscores are replaced with hyphens</li>
        <li>Consecutive hyphens are collapsed to a single hyphen</li>
        <li>Common stop words can optionally be removed</li>
      </ul>
    </Section>
  );
}

function LoremIpsumContent() {
  return (
    <Section>
      <h2 className={h2}>Lorem Ipsum — placeholder text generator</h2>
      <p className={prose}>
        <strong>Lorem ipsum</strong> is standard placeholder text used in
        graphic design, web design, and publishing to fill layouts before real
        content is available. The text is derived from Cicero&apos;s{" "}
        <em>de Finibus Bonorum et Malorum</em> (45 BC) and has been the
        industry standard dummy text since the 1500s.
      </p>
      <p className={prose}>
        Generate any number of paragraphs, sentences, or individual words.
        Using non-sensical placeholder text (rather than real copy) prevents
        readers from focusing on content instead of layout during design review.
      </p>
    </Section>
  );
}

function LineSorterContent() {
  return (
    <Section>
      <h2 className={h2}>Sort, deduplicate, and shuffle lines</h2>
      <p className={prose}>
        Sorts lines alphabetically (A→Z or Z→A), reverses line order, removes
        duplicate lines, or shuffles them randomly. Useful for cleaning up
        import lists, alphabetising glossaries, deduplicating CSV columns, and
        randomising quiz questions.
      </p>
    </Section>
  );
}

function FindReplaceContent() {
  return (
    <Section>
      <h2 className={h2}>Find and replace with optional regex</h2>
      <p className={prose}>
        Performs find-and-replace on text, with support for regular expressions
        and case-insensitive matching. Use regex capture groups to rearrange
        matched content in the replacement — for example, swap{" "}
        <code className="font-mono text-xs">(\w+), (\w+)</code> to{" "}
        <code className="font-mono text-xs">$2 $1</code> to convert
        &quot;Last, First&quot; to &quot;First Last&quot;.
      </p>
    </Section>
  );
}

function WhitespaceNormalizerContent() {
  return (
    <Section>
      <h2 className={h2}>Whitespace normalisation modes</h2>
      <ul className={ul}>
        <li>
          <strong>Collapse spaces</strong> — reduces multiple consecutive spaces
          to a single space
        </li>
        <li>
          <strong>Trim lines</strong> — removes leading and trailing whitespace
          from every line
        </li>
        <li>
          <strong>Remove blank lines</strong> — deletes empty or whitespace-only
          lines
        </li>
        <li>
          <strong>All normalisations</strong> — applies all of the above in one
          pass
        </li>
      </ul>
      <p className={prose}>
        Useful for cleaning up copy-pasted text, normalising log files, and
        preparing input for parsers that are sensitive to whitespace.
      </p>
    </Section>
  );
}

function StringReverseContent() {
  return (
    <Section>
      <h2 className={h2}>String reversal with Unicode support</h2>
      <p className={prose}>
        Reverses a string character by character with full Unicode support —
        emoji, multi-byte characters, and combining diacritics are handled as
        single units using Unicode grapheme segmentation, so{" "}
        <code className="font-mono text-xs">Hello 👋</code> reverses to{" "}
        <code className="font-mono text-xs">👋 olleH</code> rather than
        producing garbled output from naive byte reversal.
      </p>
    </Section>
  );
}

function HtmlToMarkdownContent() {
  return (
    <Section>
      <h2 className={h2}>HTML to Markdown conversion</h2>
      <p className={prose}>
        Converts HTML markup back to Markdown syntax. Useful when migrating
        content from a CMS or rich-text editor (which stores HTML) to a
        Markdown-based documentation system, static site generator, or
        version-controlled text files.
      </p>
      <ul className={ul}>
        <li>Headings → <code className="font-mono text-xs"># ## ###</code></li>
        <li>Bold/italic → <code className="font-mono text-xs">**bold** *italic*</code></li>
        <li>Links → <code className="font-mono text-xs">[text](url)</code></li>
        <li>Unordered and ordered lists preserved</li>
        <li>Code blocks and inline code preserved</li>
      </ul>
    </Section>
  );
}

function HtmlToTextContent() {
  return (
    <Section>
      <h2 className={h2}>Strip HTML tags — extract plain text</h2>
      <p className={prose}>
        Removes all HTML tags and returns just the plain text content. Useful
        for indexing web page content, generating email plain-text fallbacks,
        extracting readable text from scraped HTML, and feeding HTML content
        into text-analysis or NLP pipelines.
      </p>
    </Section>
  );
}

function StripMarkdownContent() {
  return (
    <Section>
      <h2 className={h2}>Remove Markdown formatting</h2>
      <p className={prose}>
        Strips all Markdown syntax characters and returns plain text. Useful
        for feeding Markdown content into word counters, search indexes, or
        text-to-speech systems that should not read out formatting symbols.
      </p>
    </Section>
  );
}

// ── Conversion ───────────────────────────────────────────────────────────────

function TemperatureConverterContent() {
  return (
    <Section>
      <h2 className={h2}>Celsius, Fahrenheit, and Kelvin conversion</h2>
      <p className={prose}>
        Converts temperatures between Celsius (°C), Fahrenheit (°F), and Kelvin
        (K). Kelvin is the SI base unit of temperature used in science and
        engineering — 0 K is absolute zero, the coldest possible temperature (
        −273.15 °C). Fahrenheit is used primarily in the United States; Celsius
        is the standard everywhere else.
      </p>
      <ul className={ul}>
        <li>Water freezes at 0 °C / 32 °F / 273.15 K</li>
        <li>Water boils at 100 °C / 212 °F / 373.15 K</li>
        <li>Body temperature ≈ 37 °C / 98.6 °F</li>
        <li>Absolute zero = −273.15 °C / −459.67 °F / 0 K</li>
      </ul>
    </Section>
  );
}

function UnitConverterContent() {
  return (
    <Section>
      <h2 className={h2}>Unit converter — length, weight, area, volume, speed</h2>
      <p className={prose}>
        Converts between metric and imperial units across multiple categories.
        The metric system (SI) is the international standard used in science and
        most countries. Imperial/US customary units (inches, pounds, gallons,
        mph) are still used in the United States and some other contexts.
      </p>
      <ul className={ul}>
        <li><strong>Length:</strong> mm, cm, m, km, inch, ft, yd, mile, nautical mile</li>
        <li><strong>Weight:</strong> mg, g, kg, tonne, oz, lb, stone</li>
        <li><strong>Area:</strong> m², km², ft², acre, hectare</li>
        <li><strong>Volume:</strong> ml, l, m³, tsp, tbsp, fl oz, cup, pint, quart, gallon</li>
        <li><strong>Speed:</strong> m/s, km/h, mph, knot, Mach</li>
      </ul>
    </Section>
  );
}

function ByteConverterContent() {
  return (
    <Section>
      <h2 className={h2}>Data size conversion</h2>
      <p className={prose}>
        Converts between byte, kilobyte, megabyte, gigabyte, terabyte, and
        petabyte. Useful when comparing storage capacities, API rate limits,
        file size constraints, and network throughput values.
      </p>
      <ul className={ul}>
        <li>
          <strong>SI prefixes</strong> (powers of 1000): 1 KB = 1,000 bytes —
          used by hard drive manufacturers and network speeds.
        </li>
        <li>
          <strong>IEC prefixes</strong> (powers of 1024): 1 KiB = 1,024 bytes
          — used by operating systems for RAM and file sizes.
        </li>
      </ul>
    </Section>
  );
}

function NumberToWordsContent() {
  return (
    <Section>
      <h2 className={h2}>Number to words conversion</h2>
      <p className={prose}>
        Converts any integer to its English word representation — for example{" "}
        <code className="font-mono text-xs">1,234,567</code> → &quot;one million
        two hundred and thirty-four thousand five hundred and sixty-seven&quot;.
        Used in cheque/check writing, invoice generation, legal documents, and
        accessibility labels for screen readers.
      </p>
    </Section>
  );
}

function RomanNumeralsContent() {
  return (
    <Section>
      <h2 className={h2}>Roman numerals — conversion and reference</h2>
      <p className={prose}>
        Converts integers to Roman numerals and vice versa. Paste a number like
        <code className="font-mono text-xs"> 2024</code> to get{" "}
        <code className="font-mono text-xs">MMXXIV</code>, or paste a Roman
        numeral to decode it. Roman numerals are still used for book chapters,
        film sequels, clock faces, and year designations.
      </p>
    </Section>
  );
}

function DurationConverterContent() {
  return (
    <Section>
      <h2 className={h2}>Duration conversion</h2>
      <p className={prose}>
        Converts a duration value between seconds, minutes, hours, days, and
        weeks, outputting a full breakdown. Useful when working with API
        timeouts, JWT expiry values, cache TTLs, and rate limit windows.
      </p>
    </Section>
  );
}

function PercentageCalcContent() {
  return (
    <Section>
      <h2 className={h2}>Percentage calculator</h2>
      <p className={prose}>
        Calculates percentages for common operations: &quot;What is X% of Y?&quot;,
        &quot;X is what % of Y?&quot;, and &quot;What is the % change from X to Y?&quot;.
        Useful for business metrics, financial analysis, test scores, and
        discount calculations.
      </p>
    </Section>
  );
}

function AspectRatioContent() {
  return (
    <Section>
      <h2 className={h2}>Aspect ratio calculator</h2>
      <p className={prose}>
        Enter any two dimensions (width × height) to calculate the simplified
        aspect ratio and find equivalent dimensions at different sizes. Essential
        for responsive image sizing, video embeds, viewport calculations, and
        maintaining proportions when resizing assets.
      </p>
      <ul className={ul}>
        <li>16:9 — widescreen video standard (1920×1080, 2560×1440, 3840×2160)</li>
        <li>4:3 — traditional TV and monitor format</li>
        <li>1:1 — square; used for social media profile images</li>
        <li>21:9 — ultrawide monitor format</li>
      </ul>
    </Section>
  );
}

function TimezoneConverterContent() {
  return (
    <Section>
      <h2 className={h2}>Timezone converter</h2>
      <p className={prose}>
        Converts a time from one timezone to all major world timezones
        simultaneously. Useful for scheduling meetings across regions,
        understanding API timestamp values, and working with distributed teams.
        All conversions are computed client-side using the browser&apos;s
        Intl.DateTimeFormat API.
      </p>
    </Section>
  );
}

// ── Finance ──────────────────────────────────────────────────────────────────

function SimpleInterestContent() {
  return (
    <Section>
      <h2 className={h2}>Simple interest formula</h2>
      <p className={prose}>
        Simple interest is calculated as <strong>P × R × T</strong> — principal
        × annual rate × time in years. Unlike compound interest, simple interest
        does not add earned interest back to the principal. Used for short-term
        loans, treasury bills, and fixed deposits in some countries.
      </p>
    </Section>
  );
}

function GstCalculatorContent() {
  return (
    <Section>
      <h2 className={h2}>GST calculator — add or extract GST</h2>
      <p className={prose}>
        Calculates Goods and Services Tax (GST) in India for all standard rates:
        0%, 5%, 12%, 18%, and 28%. Switch between exclusive (add GST to net
        price) and inclusive (extract GST from gross price) modes. Also shows
        the CGST and SGST/UTGST split for intra-state transactions.
      </p>
    </Section>
  );
}

function DiscountCalculatorContent() {
  return (
    <Section>
      <h2 className={h2}>Discount calculator</h2>
      <p className={prose}>
        Calculates the discounted price, savings amount, and effective discount
        percentage from an original price and discount rate — or works backwards
        to find what discount percentage was applied given original and sale
        prices.
      </p>
    </Section>
  );
}

function TipCalculatorContent() {
  return (
    <Section>
      <h2 className={h2}>Tip calculator with bill splitting</h2>
      <p className={prose}>
        Calculates the tip amount and total bill for a given tip percentage, and
        optionally splits the total between multiple people. Common tip
        percentages are 15% (standard), 18% (good service), and 20–25%
        (excellent service).
      </p>
    </Section>
  );
}

function RoiCalculatorContent() {
  return (
    <Section>
      <h2 className={h2}>Return on Investment (ROI) calculator</h2>
      <p className={prose}>
        ROI = (Net Profit / Cost of Investment) × 100. Enter your initial
        investment cost and final value (or net gain) to calculate the ROI
        percentage and annualised return. Useful for comparing investment
        options, marketing campaign performance, and business project viability.
      </p>
    </Section>
  );
}

function ProfitLossContent() {
  return (
    <Section>
      <h2 className={h2}>Profit and loss calculator</h2>
      <p className={prose}>
        Calculates profit or loss amount and percentage given cost price and
        selling price. Essential for retail pricing, trading, and financial
        reporting. Also shows break-even selling price for a target profit
        percentage.
      </p>
    </Section>
  );
}

function CompoundInterestContent() {
  return (
    <Section>
      <h2 className={h2}>Compound interest calculator</h2>
      <p className={prose}>
        Compound interest grows faster than simple interest because earned
        interest is reinvested. The formula is{" "}
        <strong>A = P(1 + r/n)^(nt)</strong> — principal × (1 + rate/periods)
        raised to (periods × time). Small differences in rate or compounding
        frequency have a large effect over long time horizons.
      </p>
    </Section>
  );
}

function LoanEmiContent() {
  return (
    <Section>
      <h2 className={h2}>Loan EMI calculator</h2>
      <p className={prose}>
        Calculates the Equated Monthly Instalment (EMI) for a loan given
        principal, annual interest rate, and tenure in months. Also shows the
        total interest paid over the loan period and a full amortisation
        breakdown. Used for home loans, car loans, and personal loans.
      </p>
      <p className={prose}>
        EMI formula: <strong>E = P × r × (1+r)^n / ((1+r)^n − 1)</strong> where
        P = principal, r = monthly rate, n = number of months.
      </p>
    </Section>
  );
}

// ── Health ───────────────────────────────────────────────────────────────────

function BmiCalculatorContent() {
  return (
    <Section>
      <h2 className={h2}>Body Mass Index (BMI) calculator</h2>
      <p className={prose}>
        BMI = weight (kg) / height² (m²). The WHO classification: underweight
        &lt;18.5, normal weight 18.5–24.9, overweight 25–29.9, obese ≥30. BMI
        is a screening tool, not a diagnostic measure — it does not account for
        muscle mass, bone density, age, or fat distribution.
      </p>
    </Section>
  );
}

function BmrCalculatorContent() {
  return (
    <Section>
      <h2 className={h2}>Basal Metabolic Rate (BMR) calculator</h2>
      <p className={prose}>
        BMR is the number of calories your body burns at rest to maintain basic
        functions (breathing, circulation, organ function). Calculated using the
        Mifflin–St Jeor equation — the most accurate formula for the general
        population. Multiply BMR by your activity factor (TDEE) to estimate
        daily caloric needs.
      </p>
    </Section>
  );
}

function CalorieCalculatorContent() {
  return (
    <Section>
      <h2 className={h2}>Daily calorie needs (TDEE calculator)</h2>
      <p className={prose}>
        Total Daily Energy Expenditure (TDEE) = BMR × activity multiplier.
        Activity levels: sedentary (×1.2), light exercise (×1.375), moderate
        (×1.55), very active (×1.725), extra active (×1.9). Consume at TDEE to
        maintain weight; subtract 500 kcal/day for ~0.5 kg/week loss.
      </p>
    </Section>
  );
}

function WaterIntakeContent() {
  return (
    <Section>
      <h2 className={h2}>Daily water intake calculator</h2>
      <p className={prose}>
        General guidelines recommend 35 ml of water per kg of body weight per
        day, adjusted for climate and physical activity. Exercise adds
        approximately 500–1000 ml per hour of moderate activity. This calculator
        gives a personalised baseline — individual needs vary.
      </p>
    </Section>
  );
}

function BodyFatContent() {
  return (
    <Section>
      <h2 className={h2}>Body fat percentage estimator</h2>
      <p className={prose}>
        Estimates body fat percentage from BMI, age, and sex using the
        Deurenberg formula. A rough estimate — accurate body fat measurement
        requires DEXA scan or hydrostatic weighing. Essential fat: 2–5% (men),
        10–13% (women); athletic range: 6–13% (men), 14–20% (women).
      </p>
    </Section>
  );
}

// ── Math ─────────────────────────────────────────────────────────────────────

function QuadraticSolverContent() {
  return (
    <Section>
      <h2 className={h2}>Quadratic equation solver</h2>
      <p className={prose}>
        Solves equations of the form <strong>ax² + bx + c = 0</strong> using
        the quadratic formula: <strong>x = (−b ± √(b² − 4ac)) / 2a</strong>.
        The discriminant b² − 4ac determines the nature of the roots: positive
        → two real roots, zero → one repeated root, negative → two complex
        conjugate roots.
      </p>
    </Section>
  );
}

function PythagoreanContent() {
  return (
    <Section>
      <h2 className={h2}>Pythagorean theorem calculator</h2>
      <p className={prose}>
        The Pythagorean theorem states that in a right-angled triangle,{" "}
        <strong>a² + b² = c²</strong> where c is the hypotenuse. Enter any two
        sides to calculate the third. Used in geometry, construction,
        navigation, and 2D/3D vector calculations.
      </p>
    </Section>
  );
}

function GcdLcmContent() {
  return (
    <Section>
      <h2 className={h2}>GCD and LCM calculator</h2>
      <p className={prose}>
        The <strong>Greatest Common Divisor</strong> (GCD, also called HCF) is
        the largest integer that divides both numbers without remainder.
        The <strong>Least Common Multiple</strong> (LCM) is the smallest integer
        divisible by both numbers. Computed using the Euclidean algorithm.
        Used for simplifying fractions, scheduling problems, and number theory.
      </p>
    </Section>
  );
}

// ── DateTime ─────────────────────────────────────────────────────────────────

function AgeCalculatorContent() {
  return (
    <Section>
      <h2 className={h2}>Age calculator</h2>
      <p className={prose}>
        Calculates exact age in years, months, and days from a birth date to
        today (or any target date). Also shows the next birthday, total days
        lived, and day of the week you were born. Handles leap years and
        month-length differences correctly.
      </p>
    </Section>
  );
}

function DaysBetweenContent() {
  return (
    <Section>
      <h2 className={h2}>Days between dates</h2>
      <p className={prose}>
        Calculates the exact number of days, weeks, months, and years between
        two dates. Optionally excludes weekends to count working days. Useful
        for project planning, contract durations, SLA calculations, and deadline
        tracking.
      </p>
    </Section>
  );
}

function CountdownContent() {
  return (
    <Section>
      <h2 className={h2}>Countdown calculator</h2>
      <p className={prose}>
        Shows the time remaining until a future date in years, months, weeks,
        days, hours, minutes, and seconds. Useful for tracking product launch
        dates, conference deadlines, subscription renewals, and personal
        milestones.
      </p>
    </Section>
  );
}

function WeekNumberContent() {
  return (
    <Section>
      <h2 className={h2}>ISO week number calculator</h2>
      <p className={prose}>
        Returns the ISO 8601 week number for any date. ISO weeks start on Monday
        and week 1 is the week containing the first Thursday of the year.
        Week numbers are widely used in manufacturing, logistics, and project
        management — especially in Europe and for fiscal calendars.
      </p>
    </Section>
  );
}

function DueDateContent() {
  return (
    <Section>
      <h2 className={h2}>Pregnancy due date calculator</h2>
      <p className={prose}>
        Estimates the expected due date from the last menstrual period (LMP)
        using Naegele&apos;s rule: LMP + 280 days (40 weeks). Also shows the
        current gestational week. Note: this is an estimate — actual due dates
        are confirmed by ultrasound measurement.
      </p>
    </Section>
  );
}

// ── Design ───────────────────────────────────────────────────────────────────

function ContrastCheckerContent() {
  return (
    <Section>
      <h2 className={h2}>WCAG color contrast checker</h2>
      <p className={prose}>
        Calculates the contrast ratio between a foreground and background colour
        and checks it against <strong>WCAG 2.1</strong> accessibility guidelines.
        Sufficient contrast is essential for users with low vision and in bright
        ambient light conditions.
      </p>
      <ul className={ul}>
        <li>
          <strong>AA standard</strong> — minimum 4.5:1 for normal text, 3:1 for
          large text (18pt+ or 14pt+ bold)
        </li>
        <li>
          <strong>AAA standard</strong> — enhanced 7:1 for normal text, 4.5:1
          for large text
        </li>
        <li>
          <strong>UI components and graphics</strong> — minimum 3:1 under WCAG
          2.1 SC 1.4.11
        </li>
      </ul>
    </Section>
  );
}

function GradientGeneratorContent() {
  return (
    <Section>
      <h2 className={h2}>CSS gradient generator</h2>
      <p className={prose}>
        Generates CSS <code className="font-mono text-xs">linear-gradient</code> and{" "}
        <code className="font-mono text-xs">radial-gradient</code> declarations
        with a live preview. Adjust colours, stops, and angle, then copy the
        ready-to-use CSS. Modern CSS gradients support multiple colour stops,
        transparent values, and the full <code className="font-mono text-xs">hsl()</code> colour
        space for perceptually uniform transitions.
      </p>
    </Section>
  );
}

function CurrencyConverterContent() {
  return (
    <Section>
      <h2 className={h2}>Currency converter</h2>
      <p className={prose}>
        Converts between major world currencies using exchange rates. Note that
        exchange rates fluctuate continuously — rates shown are indicative and
        may differ from rates offered by banks and foreign exchange services,
        which include a spread (margin). Always check with your bank or broker
        for live transactional rates.
      </p>
    </Section>
  );
}

const CONTENT_MAP: Record<string, React.FC> = {
  "json-formatter": JsonFormatterContent,
  "base64-encode": Base64EncodeContent,
  "base64-decode": Base64DecodeContent,
  "regex-tester": RegexTesterContent,
  "uuid-generator": UuidGeneratorContent,
  "hash-generator": HashGeneratorContent,
  "password-generator": PasswordGeneratorContent,
  "url-encode": UrlEncodeContent,
  "url-decode": UrlDecodeContent,
  "text-diff": TextDiffContent,
  "word-counter": WordCounterContent,
  "case-converter": CaseConverterContent,
  "color-converter": ColorConverterContent,
  "unix-timestamp": UnixTimestampContent,
  "cron-parser": CronParserContent,
  "html-to-jsx": HtmlToJsxContent,
  "markdown-to-html": MarkdownToHtmlContent,
  // JSON conversions
  "json-diff": JsonDiffContent,
  "json-to-yaml": JsonToYamlContent,
  "yaml-to-json": YamlToJsonContent,
  "json-to-csv": JsonToCsvContent,
  "csv-to-json": CsvToJsonContent,
  "json-to-typescript": JsonToTypescriptContent,
  "json-to-xml": JsonToXmlContent,
  "xml-to-json": XmlToJsonContent,
  "toml-to-json": TomlToJsonContent,
  // Encoding
  "base64-image": Base64ImageContent,
  "html-entity-encode": HtmlEntityEncodeContent,
  "html-entity-decode": HtmlEntityDecodeContent,
  "text-to-hex": TextToHexContent,
  "hex-to-text": HexToTextContent,
  "text-to-binary": TextToBinaryContent,
  "binary-to-text": BinaryToTextContent,
  "rot13": Rot13Content,
  "morse-code": MorseCodeContent,
  "string-inspector": StringInspectorContent,
  // Dev
  "aes-encrypt-decrypt": AesEncryptContent,
  "qr-code": QrCodeContent,
  "url-parser": UrlParserContent,
  "base-converter": BaseConverterContent,
  "css-minifier": CssMinifierContent,
  "html-minifier": HtmlMinifierContent,
  "sql-formatter": SqlFormatterContent,
  "curl-to-fetch": CurlToFetchContent,
  "curl-formatter": CurlFormatterContent,
  "string-escape": StringEscapeContent,
  "mime-lookup": MimeLookupContent,
  "html-preview": HtmlPreviewContent,
  "markdown-preview": MarkdownPreviewContent,
  // Text
  "slug-generator": SlugGeneratorContent,
  "lorem-ipsum": LoremIpsumContent,
  "line-sorter": LineSorterContent,
  "find-replace": FindReplaceContent,
  "whitespace-normalizer": WhitespaceNormalizerContent,
  "string-reverse": StringReverseContent,
  "html-to-markdown": HtmlToMarkdownContent,
  "html-to-text": HtmlToTextContent,
  "strip-markdown": StripMarkdownContent,
  // Conversion
  "temperature-converter": TemperatureConverterContent,
  "unit-converter": UnitConverterContent,
  "byte-converter": ByteConverterContent,
  "number-to-words": NumberToWordsContent,
  "roman-numerals": RomanNumeralsContent,
  "duration-converter": DurationConverterContent,
  "percentage-calc": PercentageCalcContent,
  "aspect-ratio": AspectRatioContent,
  "timezone-converter": TimezoneConverterContent,
  // Finance
  "simple-interest": SimpleInterestContent,
  "gst-calculator": GstCalculatorContent,
  "discount-calculator": DiscountCalculatorContent,
  "tip-calculator": TipCalculatorContent,
  "roi-calculator": RoiCalculatorContent,
  "profit-loss-calculator": ProfitLossContent,
  "compound-interest": CompoundInterestContent,
  "loan-emi-calculator": LoanEmiContent,
  // Health
  "bmi-calculator": BmiCalculatorContent,
  "bmr-calculator": BmrCalculatorContent,
  "calorie-calculator": CalorieCalculatorContent,
  "water-intake-calculator": WaterIntakeContent,
  "body-fat-calculator": BodyFatContent,
  // Math
  "quadratic-solver": QuadraticSolverContent,
  "pythagorean-theorem": PythagoreanContent,
  "gcd-lcm-calculator": GcdLcmContent,
  // DateTime
  "age-calculator": AgeCalculatorContent,
  "days-between-dates": DaysBetweenContent,
  "countdown-calculator": CountdownContent,
  "week-number-calculator": WeekNumberContent,
  "due-date-calculator": DueDateContent,
  "world-clock": TimezoneConverterContent,
  // Image / file tools
  "background-remover": (() => (
    <Section>
      <h2 className={h2}>AI background remover — browser-based</h2>
      <p className={prose}>
        Removes the background from any image entirely in the browser using a
        machine-learning segmentation model — no upload to a server, no account
        required. The result is a PNG with a transparent background ready for
        use in presentations, product photos, social media graphics, and design
        assets.
      </p>
    </Section>
  )) as React.FC,
  "image-resizer": (() => (
    <Section>
      <h2 className={h2}>Online image resizer</h2>
      <p className={prose}>
        Resizes images to exact pixel dimensions or a percentage scale, with
        optional aspect-ratio lock. Supports PNG, JPEG, WebP, and GIF.
        Processing happens in the browser using the Canvas API — your images
        are never uploaded. Useful for resizing profile pictures, thumbnails,
        and assets to specific size constraints.
      </p>
    </Section>
  )) as React.FC,
  "image-compressor": (() => (
    <Section>
      <h2 className={h2}>Image compressor — reduce file size</h2>
      <p className={prose}>
        Reduces image file size by adjusting JPEG quality or PNG compression
        level. Smaller images mean faster page loads and lower storage costs.
        All compression runs client-side in the browser — no file is uploaded.
        Typical JPEG quality of 80% retains near-lossless visual quality at 50–70%
        smaller file size.
      </p>
    </Section>
  )) as React.FC,
  "pdf-page-editor": (() => (
    <Section>
      <h2 className={h2}>PDF page editor</h2>
      <p className={prose}>
        Extract pages from a PDF, reorder them, remove specific pages, or merge
        multiple PDFs into one — entirely in the browser using the pdf-lib
        library. No file is sent to a server. Useful for splitting large PDFs,
        removing confidential pages before sharing, and reorganising document
        sections.
      </p>
    </Section>
  )) as React.FC,
  "xml-suite": (() => (
    <Section>
      <h2 className={h2}>XML tools — format, validate, transform</h2>
      <p className={prose}>
        A workspace for working with XML: format and indent XML with configurable
        indentation, validate well-formedness, convert between XML and JSON, and
        apply XPath queries. Used for working with SOAP APIs, RSS/Atom feeds,
        SVG files, Maven/Gradle build files, and configuration XML.
      </p>
    </Section>
  )) as React.FC,
  // Design
  "contrast-checker": ContrastCheckerContent,
  "gradient-generator": GradientGeneratorContent,
  "currency-converter": CurrencyConverterContent,
};

export default function ToolSeoContent({ slug }: { slug: string }) {
  const Content = CONTENT_MAP[slug];
  if (!Content) return null;
  return <Content />;
}
