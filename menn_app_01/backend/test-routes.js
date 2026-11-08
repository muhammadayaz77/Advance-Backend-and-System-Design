import http from "http";
import app from "./dist/app.js";
import { prisma } from "./dist/lib/prisma.js";

async function runTests() {
  await prisma.$connect();
  console.log("Connected to DB for tests");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Test server running on ${baseUrl}`);

  try {
    // 1. Health check
    const r1 = await fetch(`${baseUrl}/api/v1`);
    const j1 = await r1.json();
    console.log("1. /api/v1 status:", r1.status, "body:", JSON.stringify(j1));
    if (j1.success !== true || j1.data !== "Hello World!") throw new Error("Health check failed");

    // 2. Register validation failure
    const r2 = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "invalid-email" }),
    });
    const j2 = await r2.json();
    console.log("2. /register (invalid) status:", r2.status, "body:", JSON.stringify(j2));
    if (j2.success !== false || j2.statusCode !== 400 || !j2.timestamp || !j2.path) {
      throw new Error("Register validation envelope failed");
    }

    // 3. Register valid user
    const testEmail = `test_${Date.now()}@example.com`;
    const r3 = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Test User",
        email: testEmail,
        password: "Password123!",
      }),
    });
    const j3 = await r3.json();
    console.log("3. /register (valid) status:", r3.status, "body:", JSON.stringify(j3));
    if (j3.success !== true || !j3.data.message) throw new Error("Registration failed");

    // 4. Duplicate registration -> 409
    const r4 = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Test User",
        email: testEmail,
        password: "Password123!",
      }),
    });
    const j4 = await r4.json();
    console.log("4. /register (duplicate) status:", r4.status, "body:", JSON.stringify(j4));
    if (r4.status !== 409 || j4.success !== false) throw new Error("Duplicate conflict failed");

    // 5. Login unverified -> 401
    const r5 = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "Password123!",
      }),
    });
    const j5 = await r5.json();
    console.log("5. /login (unverified) status:", r5.status, "body:", JSON.stringify(j5));
    if (r5.status !== 401 || !j5.message.includes("verify your email")) {
      throw new Error("Unverified login check failed");
    }

    // 6. Verify Email
    const verification = await prisma.emailVerification.findFirst({
      where: { user: { email: testEmail } },
      orderBy: { createdAt: "desc" },
    });
    if (!verification) throw new Error("Verification record not found in DB");

    const r6 = await fetch(`${baseUrl}/api/v1/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        code: verification.code,
      }),
    });
    const j6 = await r6.json();
    console.log("6. /verify-email status:", r6.status, "body:", JSON.stringify(j6));
    if (j6.success !== true) throw new Error("Verify email failed");

    // 7. Login verified -> returns accessToken and set-cookie
    const r7 = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "Password123!",
      }),
    });
    const j7 = await r7.json();
    const setCookie = r7.headers.get("set-cookie");
    console.log("7. /login (verified) status:", r7.status, "token:", !!j7.data?.accessToken, "setCookie:", !!setCookie);
    if (!j7.data?.accessToken || !setCookie?.includes("refresh_token")) {
      throw new Error("Login failed to return accessToken or refresh cookie");
    }
    const accessToken = j7.data.accessToken;
    const cookieHeader = setCookie.split(";")[0];

    // 8. Refresh token
    const r8 = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        Cookie: cookieHeader,
      },
    });
    const j8 = await r8.json();
    console.log("8. /refresh status:", r8.status, "token:", !!j8.data?.accessToken);
    if (!j8.data?.accessToken) throw new Error("Refresh token endpoint failed");

    // 9. Onboarding (Protected)
    const r9 = await fetch(`${baseUrl}/api/v1/auth/onboarding`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        accountType: "freelancer",
        role: "individual",
      }),
    });
    const j9 = await r9.json();
    console.log("9. /onboarding status:", r9.status, "new token:", !!j9.data?.accessToken);
    if (!j9.data?.accessToken) throw new Error("Onboarding failed");

    // 10. Forgot Password
    const r10 = await fetch(`${baseUrl}/api/v1/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail }),
    });
    const j10 = await r10.json();
    console.log("10. /forgot-password status:", r10.status, "message:", j10.data?.message);
    if (j10.success !== true) throw new Error("Forgot password failed");

    // 11. Delete Account (Protected)
    const r11 = await fetch(`${baseUrl}/api/v1/auth/account`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${j9.data.accessToken}`,
      },
    });
    const j11 = await r11.json();
    console.log("11. /account (delete) status:", r11.status, "message:", j11.data?.message);
    if (j11.success !== true) throw new Error("Delete account failed");

    console.log("\nALL TESTS PASSED SUCCESSFULLY! ✅");
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});

