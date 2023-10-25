import type { AWS } from "@serverless/typescript";

const serverlessConfiguration: AWS = {
  service: "ignite-certificate",
  frameworkVersion: "3",
  useDotenv: true,
  plugins: [
    "serverless-esbuild",
    "serverless-dynamodb-local",
    "serverless-offline",
  ],
  provider: {
    name: "aws",
    runtime: "nodejs18.x",
    region: "us-east-1",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
      // IS_LOCAL: "${env:IS_LOCAL}",
      MY_APP_AWS_ACCESS_KEY_ID: "${env:MY_APP_AWS_ACCESS_KEY_ID}",
      MY_APP_AWS_SECRET_ACCESS_KEY: "${env:MY_APP_AWS_SECRET_ACCESS_KEY}",
      REGION: "${env:REGION}",
    },
    iam: {
      role: {
        statements: [
          {
            Effect: "Allow",
            Action: ["dynamodb:*"],
            Resource: ["*"],
          },
          {
            Effect: "Allow",
            Action: ["s3:*"],
            Resource: ["*"],
          },
        ],
      },
    },
  },
  package: { individually: false, patterns: ["./src/templates/**"] },
  // import the function via paths
  functions: {
    generateCertificate: {
      //timeout: 120,
      handler: "src/functions/generateCertificate.handler",
      events: [
        {
          http: {
            path: "generateCertificate",
            method: "post",
            cors: true,
          },
        },
      ],
    },
    verifyCertificate: {
      handler: "src/functions/verifyCertificate.handler",
      events: [
        {
          http: {
            path: "verifyCertificate/{id}",
            method: "get",
            cors: true,
          },
        },
      ],
    },
  },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["@aws-sdk"],
      target: "node18",
      define: { "require.resolve": undefined },
      platform: "node",
      concurrency: 10,
      external: [
        "playwright-aws-lambda",
        "@aws-sdk/client-dynamodb",
        "@aws-sdk/lib-dynamodb",
        "@aws-sdk/client-s3",
      ],
    },
    dynamodb: {
      stages: ["dev", "local"],
      start: {
        port: 8080,
        inMemory: true,
        migrate: true,
      },
    },
  },
  resources: {
    Resources: {
      dbCertificateUsers: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          TableName: "users_certificate",
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
          AttributeDefinitions: [
            {
              AttributeName: "id",
              AttributeType: "S",
            },
          ],
          KeySchema: [
            {
              AttributeName: "id",
              KeyType: "HASH",
            },
          ],
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;
