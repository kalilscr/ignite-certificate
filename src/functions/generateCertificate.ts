import { APIGatewayProxyHandler } from "aws-lambda";
import { document } from "../utils/dynamodbClient";
import { compile } from "handlebars";
import dayjs from "dayjs";
import { join } from "path";
import { readFileSync } from "fs";
import { QueryCommand } from "@aws-sdk/client-dynamodb";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import * as playwright from "playwright-aws-lambda";
//import "dotenv/config";
//import { spawnSync } from "child_process";

interface ICreateCertificate {
  id: string;
  name: string;
  grade: string;
}

interface ITemplate {
  id: string;
  name: string;
  grade: string;
  medal: string;
  date: string;
}

const compileTemplate = async (data: ITemplate) => {
  const filePath = join(process.cwd(), "src", "templates", "certificate.hbs"); // navega da raiz do projeto até o certificate.hbs

  const html = readFileSync(filePath, "utf8");

  return compile(html)(data);
};

export const handler: APIGatewayProxyHandler = async (event) => {
  const { id, name, grade } = JSON.parse(event.body) as ICreateCertificate;

  const query = new QueryCommand({
    KeyConditionExpression: "id = :id",
    ExpressionAttributeValues: {
      ":id": { S: id },
    },
    TableName: "users_certificate",
  });

  const response = await document.send(query);

  const userAlreadyExists = response.Items[0];

  if (!userAlreadyExists) {
    const putCommand = new PutCommand({
      TableName: "users_certificate",
      Item: {
        id,
        name,
        grade,
        created_at: new Date().getTime(),
      },
    });

    await document.send(putCommand);
  }

  const medalPath = join(process.cwd(), "src", "templates", "selo.png");
  const medal = readFileSync(medalPath, "base64");

  const data: ITemplate = {
    name,
    id,
    grade,
    date: dayjs().format("DD/MM/YYYY"),
    medal,
  };

  const content = await compileTemplate(data);

  // spawnSync("npx", ["playwright", "install", "chromium"]);
  // spawnSync("npx", ["playwright", "install"]);
  // spawnSync("npx", ["playwright", "install-deps"]);

  const browser = await playwright.launchChromium({ headless: true });

  const page = await browser.newPage();

  // await playwright.loadFont(
  //   "https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@700&family=Roboto:wght@900&display=swap"
  // );

  await page.setContent(content);

  const pdf = await page.pdf({
    format: "A4",
    landscape: true,
    printBackground: true,
    preferCSSPageSize: true,
    path: process.env.IS_OFFLINE ? "./certificate.pdf" : null,
  });

  const s3Client = new S3Client({});

  const putObject = new PutObjectCommand({
    Bucket: "ignite-serverless-cert",
    Key: `${id}.pdf`,
    ACL: "public-read-write",
    Body: pdf,
    ContentType: "application/pdf",
  });

  await s3Client.send(putObject);

  await browser.close();

  return {
    statusCode: 201,
    body: JSON.stringify({
      message: "Certificado criado com sucesso",
      url: `https://ignite-serverless-cert.s3.amazonaws.com/${id}.pdf`,
    }),
  };
};
