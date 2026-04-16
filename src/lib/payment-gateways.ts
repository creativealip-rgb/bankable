import crypto from "crypto";

type CheckoutInput = {
  orderId: string;
  amount: number;
  tier: string;
  customerName: string;
  customerEmail: string;
  provider?: "MIDTRANS" | "XENDIT";
};

type CheckoutResult = {
  provider: "MIDTRANS" | "XENDIT";
  externalId: string;
  checkoutUrl: string;
  payload: unknown;
};

function getProvider() {
  const provider = (process.env.PAYMENT_PROVIDER || "MIDTRANS").toUpperCase();
  if (provider !== "MIDTRANS" && provider !== "XENDIT") {
    throw new Error("Unsupported PAYMENT_PROVIDER. Use MIDTRANS or XENDIT");
  }
  return provider as "MIDTRANS" | "XENDIT";
}

function resolveProvider(inputProvider?: "MIDTRANS" | "XENDIT") {
  if (inputProvider) return inputProvider;
  return getProvider();
}

export function getTierAmount(tier: string) {
  if (tier === "LIFETIME") return 29000;
  return 0;
}

export async function createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const provider = resolveProvider(input.provider);
  if (provider === "MIDTRANS") {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const baseUrl = process.env.MIDTRANS_BASE_URL || "https://app.sandbox.midtrans.com/snap/v1";
    if (!serverKey) {
      throw new Error("MIDTRANS_SERVER_KEY is not configured");
    }
    const externalId = input.orderId;
    const body = {
      transaction_details: {
        order_id: externalId,
        gross_amount: input.amount,
      },
      customer_details: {
        first_name: input.customerName,
        email: input.customerEmail,
      },
      item_details: [
        {
          id: input.tier,
          name: `${input.tier} Membership`,
          quantity: 1,
          price: input.amount,
        },
      ],
    };
    const res = await fetch(`${baseUrl}/transactions`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Midtrans checkout failed: ${text}`);
    }
    const data = await res.json();
    return {
      provider,
      externalId,
      checkoutUrl: data.redirect_url,
      payload: data,
    };
  }

  const apiKey = process.env.XENDIT_SECRET_KEY;
  const baseUrl = process.env.XENDIT_BASE_URL || "https://api.xendit.co/v2";
  if (!apiKey) {
    throw new Error("XENDIT_SECRET_KEY is not configured");
  }
  const externalId = input.orderId;
  const body = {
    external_id: externalId,
    amount: input.amount,
    currency: "IDR",
    description: `${input.tier} Membership`,
    customer: {
      given_names: input.customerName,
      email: input.customerEmail,
    },
    success_redirect_url: process.env.PAYMENT_SUCCESS_URL || "http://localhost:3000/dashboard",
    failure_redirect_url: process.env.PAYMENT_FAILURE_URL || "http://localhost:3000/register",
  };
  const res = await fetch(`${baseUrl}/invoices`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Xendit checkout failed: ${text}`);
  }
  const data = await res.json();
  return {
    provider,
    externalId,
    checkoutUrl: data.invoice_url,
    payload: data,
  };
}

export function verifyMidtransSignature(payload: Record<string, unknown>) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return false;
  const orderId = String(payload.order_id || "");
  const statusCode = String(payload.status_code || "");
  const grossAmount = String(payload.gross_amount || "");
  const expected = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");
  return expected === payload.signature_key;
}

