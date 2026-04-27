/**
 * Framework for Payment Gateway integration.
 * In the future, this will connect to Midtrans, Xendit, etc.
 */

export type PaymentProvider = "MIDTRANS" | "XENDIT" | "MOCK";

export type PaymentResult = {
  success: boolean;
  paymentId: string;
  checkoutUrl?: string;
  error?: string;
};

export class PaymentService {
  private provider: PaymentProvider;

  constructor(provider: PaymentProvider = "MOCK") {
    this.provider = provider;
  }

  async createCheckout(data: {
    userId: string;
    amount: number;
    description: string;
    orderId: string;
  }): Promise<PaymentResult> {
    console.log(`[PAYMENT FRAMEWORK] Creating checkout with provider: ${this.provider}`, data);
    
    // Simulate API call to provider
    if (this.provider === "MOCK") {
      return {
        success: true,
        paymentId: `PAY-${Math.random().toString(36).substring(7).toUpperCase()}`,
        checkoutUrl: `/payments/mock-checkout?order=${data.orderId}`,
      };
    }

    return {
      success: false,
      paymentId: "",
      error: "Provider not implemented yet.",
    };
  }

  async verifyWebhook(payload: any): Promise<boolean> {
    console.log(`[PAYMENT FRAMEWORK] Verifying webhook for provider: ${this.provider}`);
    return true; // Mock verification
  }
}

export const paymentService = new PaymentService(
  (process.env.PAYMENT_PROVIDER as PaymentProvider) || "MOCK"
);
