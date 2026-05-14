/**
 * Canonical sample event payloads for every common AWS Lambda trigger.
 *
 * These are the shapes AWS sends to a Lambda function — match the official
 * docs at https://docs.aws.amazon.com/lambda/latest/dg/lambda-services.html.
 * Used by the Lambda sandbox to seed the event editor with a realistic
 * structure for each event source.
 */

export type LambdaEventCategory =
  | "api"
  | "queue"
  | "storage"
  | "stream"
  | "schedule"
  | "auth"
  | "custom";

export interface LambdaEventPreset {
  id: string;
  label: string;
  category: LambdaEventCategory;
  description: string;
  /** Pretty-printed JSON the user sees in the editor. */
  payload: string;
}

const j = (value: unknown) => JSON.stringify(value, null, 2);

// ─── API Gateway / ALB ──────────────────────────────────────────────────

const apiGatewayV1: LambdaEventPreset = {
  id: "apigw-v1-rest",
  label: "API Gateway (REST v1)",
  category: "api",
  description: "REST API proxy integration (v1.0 payload).",
  payload: j({
    resource: "/items/{id}",
    path: "/items/42",
    httpMethod: "GET",
    headers: {
      Accept: "application/json",
      Host: "abc123.execute-api.us-east-1.amazonaws.com",
      "User-Agent": "curl/8.5.0",
      "X-Amzn-Trace-Id": "Root=1-65f6e1b0-1234567890abcdef",
    },
    multiValueHeaders: { Accept: ["application/json"] },
    queryStringParameters: { fields: "name,price" },
    multiValueQueryStringParameters: { fields: ["name,price"] },
    pathParameters: { id: "42" },
    stageVariables: null,
    requestContext: {
      resourceId: "abcd1",
      resourcePath: "/items/{id}",
      httpMethod: "GET",
      requestId: "00000000-0000-0000-0000-000000000000",
      stage: "prod",
      identity: {
        sourceIp: "203.0.113.42",
        userAgent: "curl/8.5.0",
      },
      accountId: "123456789012",
      apiId: "abc123",
    },
    body: null,
    isBase64Encoded: false,
  }),
};

const apiGatewayV2: LambdaEventPreset = {
  id: "apigw-v2-http",
  label: "API Gateway (HTTP v2)",
  category: "api",
  description: "HTTP API proxy integration (v2.0 payload).",
  payload: j({
    version: "2.0",
    routeKey: "POST /orders",
    rawPath: "/orders",
    rawQueryString: "",
    headers: {
      "content-type": "application/json",
      "content-length": "27",
      host: "abc123.execute-api.us-east-1.amazonaws.com",
      "user-agent": "PostmanRuntime/7.36.0",
    },
    requestContext: {
      accountId: "123456789012",
      apiId: "abc123",
      domainName: "abc123.execute-api.us-east-1.amazonaws.com",
      domainPrefix: "abc123",
      http: {
        method: "POST",
        path: "/orders",
        protocol: "HTTP/1.1",
        sourceIp: "203.0.113.42",
        userAgent: "PostmanRuntime/7.36.0",
      },
      requestId: "JK0xqQwzoAMESmA=",
      routeKey: "POST /orders",
      stage: "$default",
      time: "12/Mar/2026:10:15:30 +0000",
      timeEpoch: 1741774530000,
    },
    body: '{"sku":"WIDGET-1","qty":2}',
    isBase64Encoded: false,
  }),
};

const albEvent: LambdaEventPreset = {
  id: "alb",
  label: "Application Load Balancer",
  category: "api",
  description: "Lambda target behind an ALB listener rule.",
  payload: j({
    requestContext: {
      elb: {
        targetGroupArn:
          "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/lambda-tg/abcdef0123456789",
      },
    },
    httpMethod: "GET",
    path: "/healthcheck",
    queryStringParameters: {},
    headers: {
      accept: "*/*",
      host: "internal-alb-123456789.us-east-1.elb.amazonaws.com",
      "user-agent": "ELB-HealthChecker/2.0",
    },
    body: "",
    isBase64Encoded: false,
  }),
};

// ─── Queues / pub-sub ───────────────────────────────────────────────────

const sqsEvent: LambdaEventPreset = {
  id: "sqs",
  label: "SQS",
  category: "queue",
  description: "Single message batch from an SQS standard queue.",
  payload: j({
    Records: [
      {
        messageId: "19dd0b57-b21e-4ac1-bd88-01bbb068cb78",
        receiptHandle: "MbZj6wDWli+JvwwJaBV+3dcjk2YW2vA3+STFFljTM8tJJg6HRG6PYSasuWXPJB+CwLj1FjgXUv1uSj1gUPAWV66FU/WeR4mq2OKpEGYWbnLmpRCJVAyeMjeU5ZBdtcZ206oDZf",
        body: '{"orderId":"o-123","total":42.5}',
        attributes: {
          ApproximateReceiveCount: "1",
          SentTimestamp: "1545082649183",
          SenderId: "AIDAIENQZJOLO23YVJ4VO",
          ApproximateFirstReceiveTimestamp: "1545082649185",
        },
        messageAttributes: {},
        md5OfBody: "e4e68fb7bd0e697a0ae8f1bb342846b3",
        eventSource: "aws:sqs",
        eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:orders-queue",
        awsRegion: "us-east-1",
      },
    ],
  }),
};

const snsEvent: LambdaEventPreset = {
  id: "sns",
  label: "SNS",
  category: "queue",
  description: "SNS topic notification.",
  payload: j({
    Records: [
      {
        EventSource: "aws:sns",
        EventVersion: "1.0",
        EventSubscriptionArn:
          "arn:aws:sns:us-east-1:123456789012:alerts:00000000-0000-0000-0000-000000000000",
        Sns: {
          Type: "Notification",
          MessageId: "00000000-0000-0000-0000-000000000000",
          TopicArn: "arn:aws:sns:us-east-1:123456789012:alerts",
          Subject: "Build failed",
          Message: "Build #482 failed on main",
          Timestamp: "2026-05-13T10:15:30.000Z",
          SignatureVersion: "1",
          Signature: "EXAMPLE",
          SigningCertUrl: "https://sns.us-east-1.amazonaws.com/cert.pem",
          UnsubscribeUrl: "https://sns.us-east-1.amazonaws.com/unsubscribe",
          MessageAttributes: {},
        },
      },
    ],
  }),
};

const eventBridgeEvent: LambdaEventPreset = {
  id: "eventbridge",
  label: "EventBridge (custom rule)",
  category: "queue",
  description: "Custom event matched by an EventBridge rule.",
  payload: j({
    version: "0",
    id: "6a7e8feb-b491-4cf7-a9f1-bf3703467718",
    "detail-type": "OrderPlaced",
    source: "shop.orders",
    account: "123456789012",
    time: "2026-05-13T10:15:30Z",
    region: "us-east-1",
    resources: [],
    detail: {
      orderId: "o-123",
      customerId: "c-456",
      total: 42.5,
      currency: "USD",
    },
  }),
};

// ─── Storage ────────────────────────────────────────────────────────────

const s3PutEvent: LambdaEventPreset = {
  id: "s3-put",
  label: "S3 (ObjectCreated:Put)",
  category: "storage",
  description: "New object uploaded to an S3 bucket.",
  payload: j({
    Records: [
      {
        eventVersion: "2.1",
        eventSource: "aws:s3",
        awsRegion: "us-east-1",
        eventTime: "2026-05-13T10:15:30.000Z",
        eventName: "ObjectCreated:Put",
        userIdentity: { principalId: "AWS:AIDAEXAMPLE" },
        requestParameters: { sourceIPAddress: "203.0.113.42" },
        responseElements: {
          "x-amz-request-id": "EXAMPLE123456789",
          "x-amz-id-2": "EXAMPLE/abcdef/123456789",
        },
        s3: {
          s3SchemaVersion: "1.0",
          configurationId: "tf-s3-lambda-notification",
          bucket: {
            name: "my-uploads",
            ownerIdentity: { principalId: "AWS:AIDAEXAMPLE" },
            arn: "arn:aws:s3:::my-uploads",
          },
          object: {
            key: "incoming/report-2026-05-13.csv",
            size: 12_847,
            eTag: "d41d8cd98f00b204e9800998ecf8427e",
            sequencer: "0A1B2C3D4E5F678901",
          },
        },
      },
    ],
  }),
};

// ─── Streams ────────────────────────────────────────────────────────────

const dynamoStreamEvent: LambdaEventPreset = {
  id: "dynamodb-stream",
  label: "DynamoDB Stream",
  category: "stream",
  description: "DynamoDB Streams record (INSERT).",
  payload: j({
    Records: [
      {
        eventID: "1",
        eventName: "INSERT",
        eventVersion: "1.1",
        eventSource: "aws:dynamodb",
        awsRegion: "us-east-1",
        dynamodb: {
          ApproximateCreationDateTime: 1741774530,
          Keys: { id: { S: "user-123" } },
          NewImage: {
            id: { S: "user-123" },
            name: { S: "Sharath" },
            createdAt: { N: "1741774530" },
          },
          SequenceNumber: "111",
          SizeBytes: 64,
          StreamViewType: "NEW_AND_OLD_IMAGES",
        },
        eventSourceARN:
          "arn:aws:dynamodb:us-east-1:123456789012:table/users/stream/2026-05-13T10:00:00.000",
      },
    ],
  }),
};

const kinesisEvent: LambdaEventPreset = {
  id: "kinesis",
  label: "Kinesis Data Stream",
  category: "stream",
  description: "Kinesis stream record (base64-encoded data).",
  payload: j({
    Records: [
      {
        kinesis: {
          kinesisSchemaVersion: "1.0",
          partitionKey: "partition-1",
          sequenceNumber:
            "49546986683135544286507457936321625675700192471156785154",
          // base64("hello world")
          data: "aGVsbG8gd29ybGQ=",
          approximateArrivalTimestamp: 1741774530.123,
        },
        eventSource: "aws:kinesis",
        eventVersion: "1.0",
        eventID:
          "shardId-000000000006:49546986683135544286507457936321625675700192471156785154",
        eventName: "aws:kinesis:record",
        invokeIdentityArn: "arn:aws:iam::123456789012:role/lambda-kinesis-role",
        awsRegion: "us-east-1",
        eventSourceARN:
          "arn:aws:kinesis:us-east-1:123456789012:stream/events",
      },
    ],
  }),
};

// ─── Schedule ───────────────────────────────────────────────────────────

const scheduledEvent: LambdaEventPreset = {
  id: "scheduled",
  label: "EventBridge Schedule (cron)",
  category: "schedule",
  description: "Recurring trigger from a scheduled EventBridge rule.",
  payload: j({
    version: "0",
    id: "53dc4d37-cffa-4f76-80c9-8b7d4a4d2eaa",
    "detail-type": "Scheduled Event",
    source: "aws.events",
    account: "123456789012",
    time: "2026-05-13T10:15:00Z",
    region: "us-east-1",
    resources: [
      "arn:aws:events:us-east-1:123456789012:rule/nightly-cleanup",
    ],
    detail: {},
  }),
};

// ─── Auth ───────────────────────────────────────────────────────────────

const cognitoPreSignup: LambdaEventPreset = {
  id: "cognito-pre-signup",
  label: "Cognito (Pre Sign-up trigger)",
  category: "auth",
  description: "Cognito Pre Sign-up trigger.",
  payload: j({
    version: "1",
    region: "us-east-1",
    userPoolId: "us-east-1_ABCDEFGHI",
    userName: "newuser@example.com",
    callerContext: {
      awsSdkVersion: "aws-sdk-unknown-unknown",
      clientId: "1example23456789",
    },
    triggerSource: "PreSignUp_SignUp",
    request: {
      userAttributes: {
        email: "newuser@example.com",
        name: "Sharath",
      },
      validationData: null,
    },
    response: {
      autoConfirmUser: false,
      autoVerifyEmail: false,
      autoVerifyPhone: false,
    },
  }),
};

// ─── Custom ─────────────────────────────────────────────────────────────

const customEvent: LambdaEventPreset = {
  id: "custom",
  label: "Custom invoke (direct)",
  category: "custom",
  description: "Plain JSON payload — Lambda invoked directly by SDK or CLI.",
  payload: j({
    name: "Sharath",
    items: [
      { id: 1, qty: 2 },
      { id: 2, qty: 1 },
    ],
  }),
};

export const LAMBDA_EVENT_PRESETS: readonly LambdaEventPreset[] = [
  apiGatewayV2,
  apiGatewayV1,
  albEvent,
  sqsEvent,
  snsEvent,
  eventBridgeEvent,
  s3PutEvent,
  dynamoStreamEvent,
  kinesisEvent,
  scheduledEvent,
  cognitoPreSignup,
  customEvent,
] as const;

export const PRESETS_BY_ID: Readonly<Record<string, LambdaEventPreset>> =
  Object.fromEntries(LAMBDA_EVENT_PRESETS.map((p) => [p.id, p]));

export const CATEGORY_LABELS: Record<LambdaEventCategory, string> = {
  api: "API & HTTP",
  queue: "Queue & Pub/Sub",
  storage: "Storage",
  stream: "Streams",
  schedule: "Schedule",
  auth: "Auth",
  custom: "Custom",
};

export const SAMPLE_HANDLER = `// Handler runs in a Web Worker — no DOM, no network calls to AWS,
// no real \`require()\`. Console output and the return value are captured.

exports.handler = async (event, context) => {
  console.log("Invoked", context.functionName, "with event:", event);

  // Echo the API Gateway-style body back, or the whole event for other sources.
  const body = event?.body ?? event;

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  };
};
`;
