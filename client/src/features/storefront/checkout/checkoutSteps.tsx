import type { CartItem, PaymentMethodId, StorefrontCustomer, StorefrontPaymentIntentResponse } from '../../../models';
import { CartStep } from '../components/CartStep';
import { CustomerStep } from '../components/CustomerStep';
import { ReviewStep } from '../components/ReviewStep';

export type CheckoutStepId = string;

export type CheckoutStepContext = {
  cart: CartItem[];
  customer: StorefrontCustomer;
  hasCartItems: boolean;
  hasCustomerDetails: boolean;
  placing: boolean;
  status: string;
  total: number;
  setCustomer: (updater: (current: StorefrontCustomer) => StorefrontCustomer) => void;
  changeQuantity: (productId: string, delta: number) => void;
  onBackToStore: () => void;
  onPreparePayment: (paymentMethod: PaymentMethodId, idempotencyKey: string) => Promise<StorefrontPaymentIntentResponse | null>;
  onSubmitOrder: (paymentMethod: PaymentMethodId, paymentIntentId?: string) => Promise<void>;
  goBack: () => void;
  goNext: () => void;
};

export type CheckoutStepDescriptor = {
  id: CheckoutStepId;
  label: string;
  canOpen: (context: CheckoutStepContext) => boolean;
  render: (context: CheckoutStepContext) => JSX.Element;
};

export const checkoutSteps: CheckoutStepDescriptor[] = [
  {
    id: 'cart',
    label: 'Cart',
    canOpen: () => true,
    render: context => (
      <CartStep
        cart={context.cart}
        changeQuantity={context.changeQuantity}
        onBackToStore={context.onBackToStore}
        onNext={context.goNext}
      />
    )
  },
  {
    id: 'customer',
    label: 'Customer details',
    canOpen: context => context.hasCartItems,
    render: context => (
      <CustomerStep
        customer={context.customer}
        canContinue={context.hasCustomerDetails}
        setCustomer={context.setCustomer}
        onBack={context.goBack}
        onNext={context.goNext}
      />
    )
  },
  {
    id: 'review',
    label: 'Place order',
    canOpen: context => context.hasCartItems && context.hasCustomerDetails,
    render: context => (
      <ReviewStep
        cart={context.cart}
        customer={context.customer}
        placing={context.placing}
        canPlaceOrder={context.hasCartItems && context.hasCustomerDetails && !context.placing}
        status={context.status}
        total={context.total}
        onBack={context.goBack}
        onPreparePayment={context.onPreparePayment}
        onPlaceOrder={context.onSubmitOrder}
      />
    )
  }
];

export function getCheckoutStep(id: CheckoutStepId) {
  return checkoutSteps.find(step => step.id === id) ?? checkoutSteps[0];
}

export function getFirstCheckoutStep() {
  return checkoutSteps[0];
}
