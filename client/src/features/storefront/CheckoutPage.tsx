import { CheckCircle2, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { CustomerInput } from '../../components/CustomerInput';
import { formatMoney } from '../../helpers/format';
import { emailPlaceholder, emailValidationMessage, isValidEmail, isValidPhone, phonePattern, phonePatternTitle, phonePlaceholder, phoneValidationMessage } from '../../helpers/validation';
import type { CartItem, StorefrontCustomer } from '../../models';
import { DeliveryMapPicker } from './DeliveryMapPicker';

type CheckoutStep = 'cart' | 'customer' | 'review';

type CheckoutPageProps = {
  cart: CartItem[];
  customer: StorefrontCustomer;
  subtotal: number;
  tax: number;
  total: number;
  placing: boolean;
  status: string;
  setCustomer: (updater: (current: StorefrontCustomer) => StorefrontCustomer) => void;
  changeQuantity: (productId: string, delta: number) => void;
  onBackToStore: () => void;
  onPlaceOrder: () => Promise<string | null>;
  onOrderConfirmed: () => void;
};

const steps: Array<{ id: CheckoutStep; label: string }> = [
  { id: 'cart', label: 'Cart' },
  { id: 'customer', label: 'Customer details' },
  { id: 'review', label: 'Place order' }
];

export function CheckoutPage({
  cart,
  customer,
  subtotal,
  tax,
  total,
  placing,
  status,
  setCustomer,
  changeQuantity,
  onBackToStore,
  onPlaceOrder,
  onOrderConfirmed
}: CheckoutPageProps) {
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState('');
  const hasCartItems = cart.length > 0;
  const hasCustomerDetails = Boolean(customer.name.trim()) && isValidEmail(customer.email) && isValidPhone(customer.phone);

  function canOpenStep(nextStep: CheckoutStep) {
    if (nextStep === 'cart') return true;
    if (nextStep === 'customer') return hasCartItems;
    return hasCartItems && hasCustomerDetails;
  }

  async function submitOrder() {
    const orderNumber = await onPlaceOrder();
    if (orderNumber) {
      setConfirmedOrderNumber(orderNumber);
    }
  }

  return (
    <main className="min-h-screen bg-field text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <button className="focus-ring flex items-center gap-2 font-semibold" onClick={onBackToStore}>
            <ShoppingCart className="h-5 w-5 text-brand" />
            Continue shopping
          </button>
          <span className="text-sm font-semibold text-brand">{formatMoney(total)}</span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <nav className="rounded-lg border border-line bg-white p-3 shadow-sm" aria-label="Checkout progress">
          <ol className="grid gap-2 sm:grid-cols-3">
            {steps.map((item, index) => {
              const active = item.id === step;
              const enabled = canOpenStep(item.id);

              return (
                <li key={item.id}>
                  <button
                    className={`focus-ring flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-semibold ${active ? 'bg-teal-50 text-brand' : 'text-slate-600 hover:bg-field'} disabled:cursor-not-allowed disabled:opacity-50`}
                    disabled={!enabled}
                    onClick={() => setStep(item.id)}
                  >
                    <span className={`grid h-7 w-7 place-items-center rounded-full border text-xs ${active ? 'border-brand bg-brand text-white' : 'border-line bg-white'}`}>
                      {index + 1}
                    </span>
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
            {step === 'cart' && (
              <CartStep
                cart={cart}
                changeQuantity={changeQuantity}
                onBackToStore={onBackToStore}
                onNext={() => setStep('customer')}
              />
            )}
            {step === 'customer' && (
              <CustomerStep
                customer={customer}
                canContinue={hasCustomerDetails}
                setCustomer={setCustomer}
                onBack={() => setStep('cart')}
                onNext={() => setStep('review')}
              />
            )}
            {step === 'review' && (
              <ReviewStep
                cart={cart}
                customer={customer}
                placing={placing}
                canPlaceOrder={hasCartItems && hasCustomerDetails && !placing}
                status={status}
                onBack={() => setStep('customer')}
                onPlaceOrder={submitOrder}
              />
            )}
          </section>

          <OrderSummary subtotal={subtotal} tax={tax} total={total} />
        </div>
      </div>

      {confirmedOrderNumber && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4">
          <section className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-xl" role="dialog" aria-modal="true" aria-labelledby="order-confirmed-title">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h2 id="order-confirmed-title" className="mt-4 text-xl font-semibold">Order placed</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Order {confirmedOrderNumber} has been placed successfully.
            </p>
            <button className="focus-ring mt-5 w-full rounded-md bg-brand px-4 py-2 font-semibold text-white hover:bg-teal-800" onClick={onOrderConfirmed}>
              OK
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

function CartStep({
  cart,
  changeQuantity,
  onBackToStore,
  onNext
}: {
  cart: CartItem[];
  changeQuantity: (productId: string, delta: number) => void;
  onBackToStore: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Review your cart</h1>
      <div className="mt-5 space-y-3">
        {cart.length === 0 && <p className="rounded-md bg-field p-4 text-sm text-slate-500">Your cart is empty.</p>}
        {cart.map(item => (
          <div key={item.id} className="flex flex-col gap-3 rounded-md border border-line p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm text-slate-500">{item.sku} - {formatMoney(item.price)} each</p>
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <div className="flex items-center gap-2">
                <button className="focus-ring rounded-md border border-line p-2 hover:bg-field" onClick={() => changeQuantity(item.id, -1)} title="Decrease quantity">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-semibold">{item.quantity}</span>
                <button className="focus-ring rounded-md border border-line p-2 hover:bg-field" onClick={() => changeQuantity(item.id, 1)} title="Increase quantity">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="font-semibold">{formatMoney(item.price * item.quantity)}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button className="focus-ring rounded-md border border-line px-4 py-2 font-medium hover:bg-field" onClick={onBackToStore}>
          Add more products
        </button>
        <button className="focus-ring rounded-md bg-brand px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400" disabled={cart.length === 0} onClick={onNext}>
          Continue to customer details
        </button>
      </div>
    </div>
  );
}

function CustomerStep({
  customer,
  canContinue,
  setCustomer,
  onBack,
  onNext
}: {
  customer: StorefrontCustomer;
  canContinue: boolean;
  setCustomer: (updater: (current: StorefrontCustomer) => StorefrontCustomer) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const emailError = customer.email.trim().length > 0 && !isValidEmail(customer.email) ? emailValidationMessage : '';
  const phoneError = isValidPhone(customer.phone) ? '' : phoneValidationMessage;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Customer details</h1>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <CustomerInput label="Name" value={customer.name} required maxLength={150} autoComplete="name" onChange={value => setCustomer(current => ({ ...current, name: value }))} />
        <CustomerInput label="Company" value={customer.companyName ?? ''} maxLength={150} autoComplete="organization" onChange={value => setCustomer(current => ({ ...current, companyName: value }))} />
        <CustomerInput label="Email" type="email" inputMode="email" value={customer.email} required maxLength={255} placeholder={emailPlaceholder} error={emailError} autoComplete="email" onChange={value => setCustomer(current => ({ ...current, email: value }))} />
        <CustomerInput label="Phone" type="tel" inputMode="tel" pattern={phonePattern} title={phonePatternTitle} placeholder={phonePlaceholder} error={phoneError} value={customer.phone ?? ''} maxLength={50} autoComplete="tel" onChange={value => setCustomer(current => ({ ...current, phone: value }))} />
      </div>
      <label className="mt-4 block text-sm font-medium">
        Address
        <textarea
          className="focus-ring mt-1 min-h-24 w-full rounded-md border border-line px-3 py-2"
          maxLength={500}
          value={customer.address ?? ''}
          onChange={event => setCustomer(current => ({ ...current, address: event.target.value }))}
          autoComplete="street-address"
        />
      </label>
      <div className="mt-4">
        <DeliveryMapPicker
          address={customer.address ?? ''}
          onAddressChange={address => setCustomer(current => ({ ...current, address }))}
        />
      </div>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button className="focus-ring rounded-md border border-line px-4 py-2 font-medium hover:bg-field" onClick={onBack}>
          Back to cart
        </button>
        <button className="focus-ring rounded-md bg-brand px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400" disabled={!canContinue} onClick={onNext}>
          Review order
        </button>
      </div>
    </div>
  );
}

function ReviewStep({
  cart,
  customer,
  placing,
  canPlaceOrder,
  status,
  onBack,
  onPlaceOrder
}: {
  cart: CartItem[];
  customer: StorefrontCustomer;
  placing: boolean;
  canPlaceOrder: boolean;
  status: string;
  onBack: () => void;
  onPlaceOrder: () => void;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Place order</h1>
      <div className="mt-5 grid gap-4">
        <section className="rounded-md border border-line p-4">
          <h2 className="font-semibold">Customer</h2>
          <p className="mt-2 text-sm text-slate-700">{customer.name}</p>
          <p className="text-sm text-slate-500">{customer.companyName || 'No company'} - {customer.email}</p>
          {customer.phone && <p className="text-sm text-slate-500">{customer.phone}</p>}
          {customer.address && <p className="text-sm text-slate-500">{customer.address}</p>}
        </section>
        <section className="rounded-md border border-line p-4">
          <h2 className="font-semibold">Items</h2>
          <div className="mt-3 space-y-2">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between gap-3 text-sm">
                <span>{item.quantity} x {item.name}</span>
                <span className="font-medium">{formatMoney(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      {status && <p className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{status}</p>}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button className="focus-ring rounded-md border border-line px-4 py-2 font-medium hover:bg-field" onClick={onBack}>
          Back to customer details
        </button>
        <button className="focus-ring rounded-md bg-brand px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400" disabled={!canPlaceOrder} onClick={onPlaceOrder}>
          {placing ? 'Placing order' : 'Place order'}
        </button>
      </div>
    </div>
  );
}

function OrderSummary({ subtotal, tax, total }: { subtotal: number; tax: number; total: number }) {
  return (
    <aside className="h-fit rounded-lg border border-line bg-white p-5 shadow-sm">
      <h2 className="font-semibold">Order summary</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatMoney(subtotal)}</dd></div>
        <div className="flex justify-between"><dt>Tax</dt><dd>{formatMoney(tax)}</dd></div>
        <div className="flex justify-between border-t border-line pt-3 text-base font-semibold"><dt>Total</dt><dd>{formatMoney(total)}</dd></div>
      </dl>
    </aside>
  );
}
