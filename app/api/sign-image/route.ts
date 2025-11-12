import { NextRequest, NextResponse } from "next/server";
import { Secp256r1, Ecdsa } from "authenticity-zkapp";
import { Bytes } from "o1js";

export async function POST(request: NextRequest) {
  try {
    // Origin validation for basic security
    const origin = request.headers.get("origin");
    const allowedOrigins = [
      "http://localhost:3000",
      "https://touch-grass-ui.vercel.app",
      "https://www.touchgrass.party",
    ];

    // Check if origin is allowed (including Vercel preview deployments)
    const isOriginAllowed =
      origin &&
      (allowedOrigins.includes(origin) ||
        /^https:\/\/touch-grass-ui.*\.vercel\.app$/.test(origin));

    // Only validate origin in production deployments
    // VERCEL_ENV is 'production' for production, 'preview' for branch deploys, 'development' for local
    if (process.env.VERCEL_ENV === "production" && !isOriginAllowed) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    // Parse request
    const { sha256Hash } = await request.json();

    // Input validation
    if (
      !sha256Hash ||
      typeof sha256Hash !== "string" ||
      sha256Hash.length !== 64
    ) {
      return NextResponse.json(
        { error: "Invalid SHA256 hash" },
        { status: 400 }
      );
    }

    // Validate hex format
    if (!/^[0-9a-fA-F]{64}$/.test(sha256Hash)) {
      return NextResponse.json(
        { error: "Invalid hex format" },
        { status: 400 }
      );
    }

    // Sign with static private key
    const privateKeyHex = process.env.ECDSA_PRIVATE_KEY;
    if (!privateKeyHex) {
      console.error("ECDSA_PRIVATE_KEY environment variable not set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    console.log("Signing image hash:", sha256Hash);

    // Create Bytes32 class and convert hash
    class Bytes32 extends Bytes(32) {}
    const hashBytes = Bytes32.fromHex(sha256Hash);

    // Convert private key hex to bigint and create scalar
    const privateKeyBigInt = BigInt(privateKeyHex);
    const privateKey = Secp256r1.Scalar.from(privateKeyBigInt);

    // Sign the hash
    const signature = Ecdsa.signHash(hashBytes, privateKey.toBigInt());

    // Extract r and s components as hex strings (64 chars each)
    const signatureData = signature.toBigInt();
    const signatureR = signatureData.r.toString(16).padStart(64, "0");
    const signatureS = signatureData.s.toString(16).padStart(64, "0");

    const result = {
      signatureR,
      signatureS,
    };

    console.log("Generated signature:", {
      signatureR: result.signatureR,
      signatureS: result.signatureS,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("ECDSA signing error:", error);
    return NextResponse.json({ error: "Signing failed" }, { status: 500 });
  }
}
