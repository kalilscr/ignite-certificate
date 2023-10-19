import { APIGatewayProxyHandler } from "aws-lambda";
import { document } from "../utils/dynamodbClient";
import { QueryCommand } from "@aws-sdk/client-dynamodb";

interface IUserCertificate {
  id: string;
  name: {
    S: string;
  };
  created_at: string;
  grade: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const { id } = event.pathParameters;

  const query = new QueryCommand({
    KeyConditionExpression: "id = :id",
    ExpressionAttributeValues: {
      ":id": { S: id },
    },
    TableName: "users_certificate",
  });

  const response = await document.send(query);

  const userCertificate = response.Items[0] as unknown as IUserCertificate;

  if (userCertificate) {
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Certificado válido",
        name: userCertificate.name.S,
        url: `https://ignite-serverless-cert.s3.amazonaws.com/${id}.pdf`,
      }),
    };
  }

  return {
    statusCode: 400,
    body: JSON.stringify({
      message: "Certificado inválido",
    }),
  };
};
