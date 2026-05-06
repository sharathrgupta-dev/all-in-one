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
};

export default function ToolSeoContent({ slug }: { slug: string }) {
  const Content = CONTENT_MAP[slug];
  if (!Content) return null;
  return <Content />;
}
