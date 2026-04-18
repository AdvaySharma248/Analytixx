import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { rmSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { join } from "node:path";
import { after, before, beforeEach, test } from "node:test";

const databaseFile = `auth-test-${randomUUID()}.db`;
const databasePath = join(process.cwd(), "prisma", databaseFile);

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = `file:./${databaseFile}`;
process.env.FRONTEND_ORIGIN = "http://127.0.0.1:3000";
process.env.EMAIL_FROM = "Analytixx <test@example.com>";

writeFileSync(databasePath, "");

const prismaCliPath = join(process.cwd(), "node_modules", "prisma", "build", "index.js");
const prismaPush = spawnSync(
  process.execPath,
  [prismaCliPath, "db", "push", "--skip-generate"],
  {
    cwd: process.cwd(),
    env: process.env,
    encoding: "utf8",
  },
);

if (prismaPush.status !== 0) {
  throw new Error(prismaPush.stderr || prismaPush.stdout || "Failed to prepare the auth test database.");
}

const { createApp } = await import("../app.js");
const { db } = await import("../lib/db.js");
const { setFirebaseIdTokenVerifierForTests } = await import("../lib/firebase-auth.js");

let server: Server;
let baseUrl = "";

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

function getCookie(response: Response) {
  const setCookie = response.headers.get("set-cookie");
  assert.ok(setCookie, "Expected a session cookie to be set.");
  return setCookie.split(";")[0];
}

async function signUpUser(email: string, name = "Test User", password = "Password123!") {
  const response = await fetch(`${baseUrl}/api/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });

  const payload = await readJson<{
    message: string;
    verificationUrl: string;
  }>(response);

  assert.equal(response.status, 201);
  assert.equal(payload.message, "Verification email sent. Please check your inbox.");
  assert.ok(payload.verificationUrl, "Expected a verification URL in the test environment.");

  const token = new URL(payload.verificationUrl).searchParams.get("token");
  assert.ok(token, "Expected a verification token in the test URL.");

  return { token };
}

async function verifyUser(token: string) {
  const response = await fetch(`${baseUrl}/api/auth/verify?token=${encodeURIComponent(token)}`);
  const payload = await readJson<{ message: string }>(response);

  assert.equal(response.status, 200);
  assert.equal(payload.message, "Email verified successfully. You can now sign in.");
}

async function loginUser(email: string, password = "Password123!") {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  return {
    response,
    payload: await readJson<{ error?: string; user?: { id: string; email: string } }>(response),
  };
}

async function createFirebaseSessionForUser(idToken: string) {
  const response = await fetch(`${baseUrl}/api/auth/firebase/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      idToken,
    }),
  });

  return {
    response,
    payload: await readJson<{ error?: string; user?: { id: string; email: string; name: string } }>(response),
  };
}

async function uploadDataset(cookie: string) {
  const formData = new FormData();
  formData.append(
    "file",
    new Blob(["month,sales\nJan,120\nFeb,180\n"], { type: "text/csv" }),
    "sales.csv",
  );

  const response = await fetch(`${baseUrl}/api/upload`, {
    method: "POST",
    headers: {
      cookie,
    },
    body: formData,
  });

  return {
    response,
    payload: await readJson<{ id: string; filename: string }>(response),
  };
}

before(async () => {
  server = createServer(createApp());
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to start the auth test server.");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
});

beforeEach(async () => {
  setFirebaseIdTokenVerifierForTests(null);
  await db.authSession.deleteMany();
  await db.emailVerificationToken.deleteMany();
  await db.insight.deleteMany();
  await db.query.deleteMany();
  await db.dataset.deleteMany();
  await db.user.deleteMany();
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  await db.$disconnect();

  rmSync(databasePath, { force: true });
  rmSync(join(process.cwd(), "prisma", `${databaseFile}-journal`), { force: true });
  rmSync(join(process.cwd(), "prisma", `${databaseFile}-shm`), { force: true });
  rmSync(join(process.cwd(), "prisma", `${databaseFile}-wal`), { force: true });
});

test("signup does not create a session and blocks login before verification", async () => {
  const { token } = await signUpUser("pending@example.com");
  assert.ok(token);

  const unauthorizedResponse = await fetch(`${baseUrl}/api/datasets`);
  const unauthorizedPayload = await readJson<{ error: string }>(unauthorizedResponse);
  assert.equal(unauthorizedResponse.status, 401);
  assert.equal(unauthorizedPayload.error, "Unauthorized");

  const { response, payload } = await loginUser("pending@example.com");
  assert.equal(response.status, 403);
  assert.equal(payload.error, "Please verify your email first.");
  assert.equal(response.headers.get("set-cookie"), null);
});

test("verified users can log in and access their own session", async () => {
  const { token } = await signUpUser("verified@example.com");
  await verifyUser(token);

  const { response, payload } = await loginUser("verified@example.com");
  assert.equal(response.status, 200);
  assert.equal(payload.user?.email, "verified@example.com");

  const cookie = getCookie(response);
  const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
    headers: {
      cookie,
    },
  });
  const sessionPayload = await readJson<{ user: { email: string } }>(sessionResponse);

  assert.equal(sessionResponse.status, 200);
  assert.equal(sessionPayload.user.email, "verified@example.com");
});

test("different users only see their own datasets and history", async () => {
  const userOne = await signUpUser("owner@example.com", "Owner User");
  await verifyUser(userOne.token);
  const loginOne = await loginUser("owner@example.com");
  const cookieOne = getCookie(loginOne.response);
  const userOneId = loginOne.payload.user?.id;
  assert.ok(userOneId, "Expected the first user to have an id.");

  const upload = await uploadDataset(cookieOne);
  assert.equal(upload.response.status, 201);

  await db.query.create({
    data: {
      datasetId: upload.payload.id,
      userId: userOneId,
      question: "How many rows are there?",
      response: "There are 2 rows.",
    },
  });

  const userTwo = await signUpUser("viewer@example.com", "Viewer User");
  await verifyUser(userTwo.token);
  const loginTwo = await loginUser("viewer@example.com");
  const cookieTwo = getCookie(loginTwo.response);

  const [datasetsOneResponse, datasetsTwoResponse, historyOneResponse, historyTwoResponse] =
    await Promise.all([
      fetch(`${baseUrl}/api/datasets`, { headers: { cookie: cookieOne } }),
      fetch(`${baseUrl}/api/datasets`, { headers: { cookie: cookieTwo } }),
      fetch(`${baseUrl}/api/history`, { headers: { cookie: cookieOne } }),
      fetch(`${baseUrl}/api/history`, { headers: { cookie: cookieTwo } }),
    ]);

  const datasetsOne = await readJson<Array<{ id: string; filename: string }>>(datasetsOneResponse);
  const datasetsTwo = await readJson<Array<{ id: string; filename: string }>>(datasetsTwoResponse);
  const historyOne = await readJson<Array<{ question: string }>>(historyOneResponse);
  const historyTwo = await readJson<Array<{ question: string }>>(historyTwoResponse);

  assert.equal(datasetsOneResponse.status, 200);
  assert.equal(datasetsTwoResponse.status, 200);
  assert.equal(historyOneResponse.status, 200);
  assert.equal(historyTwoResponse.status, 200);

  assert.equal(datasetsOne.length, 1);
  assert.equal(datasetsOne[0]?.filename, "sales.csv");
  assert.equal(datasetsTwo.length, 0);

  assert.equal(historyOne.length, 1);
  assert.equal(historyOne[0]?.question, "How many rows are there?");
  assert.equal(historyTwo.length, 0);
});

test("firebase session route creates a backend session for verified firebase users", async () => {
  setFirebaseIdTokenVerifierForTests(async (idToken) => {
    assert.equal(idToken, "verified-firebase-token");

    return {
      uid: "firebase-user-1",
      email: "firebase@example.com",
      name: "Firebase User",
      emailVerified: true,
    };
  });

  const { response, payload } = await createFirebaseSessionForUser("verified-firebase-token");
  assert.equal(response.status, 200);
  assert.equal(payload.user?.email, "firebase@example.com");
  assert.equal(payload.user?.name, "Firebase User");

  const storedUser = await db.user.findUnique({
    where: { email: "firebase@example.com" },
  });
  assert.equal(storedUser?.isVerified, true);

  const cookie = getCookie(response);
  const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
    headers: {
      cookie,
    },
  });
  const sessionPayload = await readJson<{ user: { email: string } }>(sessionResponse);

  assert.equal(sessionResponse.status, 200);
  assert.equal(sessionPayload.user.email, "firebase@example.com");
});

test("firebase session route rejects unverified firebase users", async () => {
  setFirebaseIdTokenVerifierForTests(async () => ({
    uid: "firebase-user-2",
    email: "pending-firebase@example.com",
    name: "Pending Firebase User",
    emailVerified: false,
  }));

  const { response, payload } = await createFirebaseSessionForUser("pending-firebase-token");
  assert.equal(response.status, 403);
  assert.equal(payload.error, "Please verify your email first.");
  assert.equal(response.headers.get("set-cookie"), null);
});
