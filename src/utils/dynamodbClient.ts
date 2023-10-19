import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const options = {
  region: "localhost",
  endpoint: "http://localhost:8000",
  accessKeyId: "x",
  secretAccessKey: "x",
};

const isOffline = () => {
  return process.env.IS_OFFLINE;
};

const client = isOffline ? new DynamoDBClient(options) : new DynamoDBClient({});

export const document = DynamoDBDocumentClient.from(client);
