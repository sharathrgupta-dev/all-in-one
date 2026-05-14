/**
 * Realistic event payloads + suggested event-type header values for each
 * provider's webhooks. These match the shapes documented by the upstreams
 * so a real receiver expecting a `pull_request.opened` event sees a payload
 * it would actually deserialize.
 */

import type { WebhookProvider } from "./webhook-signatures";

export interface WebhookEventPreset {
  id: string;
  provider: WebhookProvider;
  /** Short label shown in the picker. */
  label: string;
  /** Description shown under the label. */
  description: string;
  /** Value to send in the provider's "event type" header (e.g. X-GitHub-Event). */
  eventType: string;
  /** Pretty-printed JSON payload. */
  payload: string;
}

const j = (value: unknown) => JSON.stringify(value, null, 2);

// ─── GitHub ─────────────────────────────────────────────────────────────

const githubPush: WebhookEventPreset = {
  id: "github-push",
  provider: "github",
  label: "push",
  description: "Commits pushed to a branch.",
  eventType: "push",
  payload: j({
    ref: "refs/heads/main",
    before: "0000000000000000000000000000000000000000",
    after: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    repository: {
      id: 123456789,
      name: "devbench",
      full_name: "acme/devbench",
      private: false,
      html_url: "https://github.com/acme/devbench",
      default_branch: "main",
      owner: { login: "acme", id: 1, type: "Organization" },
    },
    pusher: { name: "sharath", email: "sharath@example.com" },
    sender: { login: "sharath", id: 99, type: "User" },
    commits: [
      {
        id: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
        message: "Add webhook simulator",
        timestamp: "2026-05-13T10:15:30Z",
        author: { name: "Sharath", email: "sharath@example.com" },
        added: ["src/app/webhook-simulator/page.tsx"],
        removed: [],
        modified: ["src/lib/tools-registry.ts"],
      },
    ],
  }),
};

const githubPullRequest: WebhookEventPreset = {
  id: "github-pr-opened",
  provider: "github",
  label: "pull_request.opened",
  description: "New pull request opened.",
  eventType: "pull_request",
  payload: j({
    action: "opened",
    number: 42,
    pull_request: {
      id: 1234567,
      number: 42,
      state: "open",
      title: "Add webhook simulator",
      user: { login: "sharath", id: 99 },
      body: "Adds /webhook-simulator workspace.",
      head: { ref: "feat/webhook-sim", sha: "a1b2c3d4" },
      base: { ref: "main", sha: "e5f6a7b8" },
      draft: false,
      additions: 612,
      deletions: 14,
      changed_files: 5,
    },
    repository: { full_name: "acme/devbench", default_branch: "main" },
    sender: { login: "sharath", id: 99 },
  }),
};

const githubIssue: WebhookEventPreset = {
  id: "github-issue-opened",
  provider: "github",
  label: "issues.opened",
  description: "New issue opened on the repo.",
  eventType: "issues",
  payload: j({
    action: "opened",
    issue: {
      id: 998877,
      number: 17,
      title: "Webhook simulator: support PayPal",
      user: { login: "sharath", id: 99 },
      state: "open",
      labels: [{ name: "enhancement" }],
      body: "Would be nice to also simulate PayPal IPN.",
    },
    repository: { full_name: "acme/devbench" },
    sender: { login: "sharath", id: 99 },
  }),
};

const githubRelease: WebhookEventPreset = {
  id: "github-release-published",
  provider: "github",
  label: "release.published",
  description: "Tagged release published.",
  eventType: "release",
  payload: j({
    action: "published",
    release: {
      id: 555,
      tag_name: "v1.4.0",
      name: "v1.4.0 — Webhook simulator",
      body: "## What's new\\n- Webhook simulator tool",
      draft: false,
      prerelease: false,
      created_at: "2026-05-13T09:00:00Z",
      published_at: "2026-05-13T10:00:00Z",
    },
    repository: { full_name: "acme/devbench" },
    sender: { login: "sharath", id: 99 },
  }),
};

const githubWorkflowRun: WebhookEventPreset = {
  id: "github-workflow-run-completed",
  provider: "github",
  label: "workflow_run.completed",
  description: "A GitHub Actions workflow run finished.",
  eventType: "workflow_run",
  payload: j({
    action: "completed",
    workflow_run: {
      id: 9988776655,
      name: "CI",
      head_branch: "main",
      head_sha: "a1b2c3d4",
      run_number: 482,
      event: "push",
      status: "completed",
      conclusion: "success",
      created_at: "2026-05-13T10:10:00Z",
      updated_at: "2026-05-13T10:13:12Z",
    },
    repository: { full_name: "acme/devbench" },
    sender: { login: "sharath", id: 99 },
  }),
};

const githubPing: WebhookEventPreset = {
  id: "github-ping",
  provider: "github",
  label: "ping",
  description: "Sent once when a webhook is first configured.",
  eventType: "ping",
  payload: j({
    zen: "Non-blocking is better than blocking.",
    hook_id: 1234,
    hook: { type: "Repository", id: 1234, active: true, events: ["*"] },
    repository: { full_name: "acme/devbench" },
    sender: { login: "sharath", id: 99 },
  }),
};

// ─── Stripe ─────────────────────────────────────────────────────────────

const stripePaymentSucceeded: WebhookEventPreset = {
  id: "stripe-payment-succeeded",
  provider: "stripe",
  label: "payment_intent.succeeded",
  description: "Payment Intent successfully charged.",
  eventType: "payment_intent.succeeded",
  payload: j({
    id: "evt_1Nz1ABcD2eFgHiJk",
    object: "event",
    api_version: "2024-04-10",
    created: 1741774530,
    type: "payment_intent.succeeded",
    livemode: false,
    data: {
      object: {
        id: "pi_1Nz1ABcD2eFgHiJk",
        object: "payment_intent",
        amount: 4250,
        currency: "usd",
        status: "succeeded",
        customer: "cus_OabcD1efGh2iJk",
        payment_method: "pm_1Nz1ABcD2eFgHiJk",
        receipt_email: "buyer@example.com",
        description: "Premium plan — 1 month",
      },
    },
    request: { id: "req_abc", idempotency_key: null },
  }),
};

const stripeChargeRefunded: WebhookEventPreset = {
  id: "stripe-charge-refunded",
  provider: "stripe",
  label: "charge.refunded",
  description: "Charge refunded fully or partially.",
  eventType: "charge.refunded",
  payload: j({
    id: "evt_1Nz2REfundeDABcD",
    object: "event",
    api_version: "2024-04-10",
    created: 1741774830,
    type: "charge.refunded",
    livemode: false,
    data: {
      object: {
        id: "ch_1Nz2ABcD2eFgHiJk",
        object: "charge",
        amount: 4250,
        amount_refunded: 4250,
        currency: "usd",
        status: "succeeded",
        refunded: true,
        customer: "cus_OabcD1efGh2iJk",
      },
    },
  }),
};

const stripeSubCreated: WebhookEventPreset = {
  id: "stripe-sub-created",
  provider: "stripe",
  label: "customer.subscription.created",
  description: "New subscription created.",
  eventType: "customer.subscription.created",
  payload: j({
    id: "evt_1NzSubCreATedABcD",
    object: "event",
    type: "customer.subscription.created",
    created: 1741774530,
    data: {
      object: {
        id: "sub_1Nz3SubsCripTionAB",
        object: "subscription",
        customer: "cus_OabcD1efGh2iJk",
        status: "active",
        current_period_start: 1741774530,
        current_period_end: 1744366530,
        items: { data: [{ price: { id: "price_premium_monthly", unit_amount: 4250, currency: "usd" } }] },
      },
    },
  }),
};

const stripeInvoiceFailed: WebhookEventPreset = {
  id: "stripe-invoice-failed",
  provider: "stripe",
  label: "invoice.payment_failed",
  description: "Invoice payment failed.",
  eventType: "invoice.payment_failed",
  payload: j({
    id: "evt_1NzInvFailedABcD",
    object: "event",
    type: "invoice.payment_failed",
    created: 1741774830,
    data: {
      object: {
        id: "in_1Nz4InvoIceABcD",
        object: "invoice",
        customer: "cus_OabcD1efGh2iJk",
        amount_due: 4250,
        currency: "usd",
        status: "open",
        attempt_count: 1,
        next_payment_attempt: 1741861230,
      },
    },
  }),
};

// ─── Slack ──────────────────────────────────────────────────────────────

const slackAppMention: WebhookEventPreset = {
  id: "slack-app-mention",
  provider: "slack",
  label: "app_mention",
  description: "The bot was @-mentioned in a channel.",
  eventType: "app_mention",
  payload: j({
    token: "verification-token",
    team_id: "T0123ABCDEF",
    api_app_id: "A0123ABCDEF",
    event: {
      type: "app_mention",
      user: "U0123USER",
      text: "<@U0123BOT> what's up?",
      ts: "1741774530.000200",
      channel: "C0123CHANNEL",
      event_ts: "1741774530.000200",
    },
    type: "event_callback",
    event_id: "Ev0123EVENT",
    event_time: 1741774530,
  }),
};

const slackSlashCommand: WebhookEventPreset = {
  id: "slack-slash-command",
  provider: "slack",
  label: "slash command",
  description: "User invoked a /command (form-encoded in real life).",
  eventType: "slash_command",
  // Slash commands arrive form-encoded; we send JSON for editor-friendliness.
  payload: j({
    token: "verification-token",
    team_id: "T0123ABCDEF",
    team_domain: "acme",
    channel_id: "C0123CHANNEL",
    channel_name: "general",
    user_id: "U0123USER",
    user_name: "sharath",
    command: "/devbench",
    text: "build webhook simulator",
    response_url: "https://hooks.slack.com/commands/T0123/...",
    trigger_id: "13345224609.738474920.8088930838d88f008e0",
  }),
};

const slackUrlVerification: WebhookEventPreset = {
  id: "slack-url-verification",
  provider: "slack",
  label: "url_verification",
  description: "One-time handshake when adding the Events API URL.",
  eventType: "url_verification",
  payload: j({
    token: "verification-token",
    challenge: "3eZbrw1aBm2rZgRNFdxV2595E9CY3gmdALWMmHkvFXO7tYXAYM8P",
    type: "url_verification",
  }),
};

// ─── Shopify ────────────────────────────────────────────────────────────

const shopifyOrdersCreate: WebhookEventPreset = {
  id: "shopify-orders-create",
  provider: "shopify",
  label: "orders/create",
  description: "New order placed.",
  eventType: "orders/create",
  payload: j({
    id: 5012345678901,
    name: "#1001",
    email: "buyer@example.com",
    created_at: "2026-05-13T10:15:30-04:00",
    currency: "USD",
    total_price: "42.50",
    subtotal_price: "39.99",
    total_tax: "2.51",
    financial_status: "paid",
    fulfillment_status: null,
    customer: { id: 6012345678901, email: "buyer@example.com", first_name: "Sam", last_name: "Buyer" },
    line_items: [
      { id: 7012345678901, title: "Widget", quantity: 2, price: "19.99", sku: "WIDGET-1" },
    ],
  }),
};

const shopifyOrdersCancelled: WebhookEventPreset = {
  id: "shopify-orders-cancelled",
  provider: "shopify",
  label: "orders/cancelled",
  description: "Order cancelled.",
  eventType: "orders/cancelled",
  payload: j({
    id: 5012345678901,
    name: "#1001",
    cancelled_at: "2026-05-13T11:00:00-04:00",
    cancel_reason: "customer",
    financial_status: "refunded",
    total_price: "42.50",
  }),
};

const shopifyProductsUpdate: WebhookEventPreset = {
  id: "shopify-products-update",
  provider: "shopify",
  label: "products/update",
  description: "Product updated.",
  eventType: "products/update",
  payload: j({
    id: 8012345678901,
    title: "Widget v2",
    body_html: "<p>Now 30% faster.</p>",
    vendor: "Acme",
    product_type: "Gadget",
    status: "active",
    variants: [
      { id: 9012345678901, sku: "WIDGET-2", price: "24.99", inventory_quantity: 100 },
    ],
    updated_at: "2026-05-13T10:15:30-04:00",
  }),
};

const shopifyCustomersCreate: WebhookEventPreset = {
  id: "shopify-customers-create",
  provider: "shopify",
  label: "customers/create",
  description: "New customer account created.",
  eventType: "customers/create",
  payload: j({
    id: 6012345678901,
    email: "newbuyer@example.com",
    first_name: "New",
    last_name: "Buyer",
    accepts_marketing: false,
    created_at: "2026-05-13T10:15:30-04:00",
    state: "enabled",
  }),
};

// ─── Generic ────────────────────────────────────────────────────────────

const genericCustom: WebhookEventPreset = {
  id: "generic-custom",
  provider: "generic",
  label: "Custom payload",
  description: "Bring your own JSON — choose hash, encoding, and header name.",
  eventType: "custom",
  payload: j({
    event: "user.created",
    occurredAt: "2026-05-13T10:15:30Z",
    data: { id: "u-123", name: "Sharath", email: "sharath@example.com" },
  }),
};

// ─── Index ──────────────────────────────────────────────────────────────

export const WEBHOOK_PRESETS: readonly WebhookEventPreset[] = [
  // GitHub
  githubPush,
  githubPullRequest,
  githubIssue,
  githubRelease,
  githubWorkflowRun,
  githubPing,
  // Stripe
  stripePaymentSucceeded,
  stripeChargeRefunded,
  stripeSubCreated,
  stripeInvoiceFailed,
  // Slack
  slackAppMention,
  slackSlashCommand,
  slackUrlVerification,
  // Shopify
  shopifyOrdersCreate,
  shopifyOrdersCancelled,
  shopifyProductsUpdate,
  shopifyCustomersCreate,
  // Generic
  genericCustom,
];

export const PROVIDER_LABELS: Record<WebhookProvider, string> = {
  github: "GitHub",
  stripe: "Stripe",
  slack: "Slack",
  shopify: "Shopify",
  generic: "Generic",
};

export const PROVIDER_DEFAULT_SECRET: Record<WebhookProvider, string> = {
  github: "github-webhook-secret",
  stripe: "whsec_test_devbench_stripe_secret",
  slack: "8f742231b10e8888abcd99yyyzz77abc",
  shopify: "shpss_devbench_test_secret",
  generic: "your-shared-secret",
};

export function presetsForProvider(provider: WebhookProvider): WebhookEventPreset[] {
  return WEBHOOK_PRESETS.filter((p) => p.provider === provider);
}

export function presetById(id: string): WebhookEventPreset | undefined {
  return WEBHOOK_PRESETS.find((p) => p.id === id);
}
