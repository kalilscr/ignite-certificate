import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import "dotenv/config";

const offlineOptions = {
  region: "localhost",
  endpoint: "http://localhost:8080",
  accessKeyId: "x",
  secretAccessKey: "x",
};

const options = {
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.MY_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_APP_AWS_SECRET_ACCESS_KEY,
  },
};

const config = process.env.IS_OFFLINE ? offlineOptions : options;

const client = new DynamoDBClient(config);

export const document = DynamoDBDocumentClient.from(client);
