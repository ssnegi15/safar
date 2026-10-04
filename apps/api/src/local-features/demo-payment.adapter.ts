import { randomUUID } from 'node:crypto';

export type DemoPaymentMethod = 'demo_card' | 'demo_upi';

export class DemoPaymentAdapter {
  simulatePayment(input: {
    method: DemoPaymentMethod;
    amount: number;
    currency: string;
  }) {
    return {
      id: randomUUID(),
      method: input.method,
      status: 'demo_succeeded' as const,
      amount: input.amount,
      currency: input.currency,
      reference: `DEMO-${randomUUID().slice(0, 8).toUpperCase()}`,
    };
  }
}
