import { CustomerInput } from '../../../components/forms/CustomerInput';
import { emailPlaceholder, emailValidationMessage, isValidEmail, isValidPhone, phonePattern, phonePatternTitle, phonePlaceholder, phoneValidationMessage } from '../../../helpers/validation';
import type { StorefrontCustomer } from '../../../models';
import { DeliveryMapPicker } from '../DeliveryMapPicker';

type CustomerStepProps = {
  customer: StorefrontCustomer;
  canContinue: boolean;
  setCustomer: (updater: (current: StorefrontCustomer) => StorefrontCustomer) => void;
  onBack: () => void;
  onNext: () => void;
};

export function CustomerStep({ customer, canContinue, setCustomer, onBack, onNext }: CustomerStepProps) {
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
          className="focus-ring mt-1 min-h-28 w-full rounded-md border border-line px-3 py-2"
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
        <button className="focus-ring min-h-11 rounded-md border border-line px-4 py-2 font-medium hover:bg-field" onClick={onBack} type="button">
          Back to cart
        </button>
        <button className="focus-ring min-h-11 rounded-md bg-brand px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400" disabled={!canContinue} onClick={onNext} type="button">
          Review order
        </button>
      </div>
    </div>
  );
}
