import type { ReactNode } from 'react';
import type { StorefrontCustomer, StorefrontPaymentIntentResponse, PaymentMethodId } from '../../../models';
import { CardPaymentPanel } from '../components/CardPaymentPanel';
import { CashOnDeliveryPanel } from '../components/CashOnDeliveryPanel';

export type PaymentMethodRenderProps = {
  amountLabel: string;
  customer: StorefrontCustomer;
  initializingPayment: boolean;
  paymentError: string;
  paymentIntent: StorefrontPaymentIntentResponse | null;
  placing: boolean;
  onPaymentError: (message: string) => void;
  onPlaceOrder: (paymentReferenceId?: string) => Promise<void>;
};

export type PaymentMethodDescriptor = {
  id: PaymentMethodId;
  label: string;
  summary: string;
  requiresPreparation: boolean;
  render: (props: PaymentMethodRenderProps) => ReactNode;
};

export const paymentMethods: PaymentMethodDescriptor[] = [
  {
    id: 'card',
    label: 'Visa / Mastercard',
    summary: 'Pay securely by card before the order is created.',
    requiresPreparation: true,
    render: props => <CardPaymentPanel {...props} />
  },
  {
    id: 'cash_on_delivery',
    label: 'Cash on delivery',
    summary: 'Place the order now, then pay during delivery.',
    requiresPreparation: false,
    render: props => (
      <CashOnDeliveryPanel
        amountLabel={props.amountLabel}
        placing={props.placing}
        onPlaceOrder={() => props.onPlaceOrder()}
      />
    )
  }
];

export function getPaymentMethod(id: PaymentMethodId) {
  return paymentMethods.find(method => method.id === id) ?? paymentMethods[0];
}
