import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { PackagePlus } from 'lucide-react';
import { CustomerInput } from '../../components/CustomerInput';
import { DataTable } from '../../components/DataTable';
import { Toolbar } from '../../components/Toolbar';
import { emailPlaceholder, emailValidationMessage, isValidEmail, isValidPhone, phonePattern, phonePatternTitle, phonePlaceholder, phoneValidationMessage } from '../../helpers/validation';
import type { Customer, PagedResult, StorefrontCustomer } from '../../models';
import type { ApiClient } from '../../services/apiClient';

type CustomersViewProps = {
  api: ApiClient;
};

const emptyCustomerForm: StorefrontCustomer = {
  name: '',
  companyName: '',
  email: '',
  phone: '',
  address: ''
};

export function CustomersView({ api }: CustomersViewProps) {
  const [customers, setCustomers] = useState<PagedResult<Customer> | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<StorefrontCustomer>(emptyCustomerForm);
  const [formError, setFormError] = useState('');
  const emailError = form.email.trim().length > 0 && !isValidEmail(form.email) ? emailValidationMessage : '';
  const phoneError = isValidPhone(form.phone) ? '' : phoneValidationMessage;
  const canCreateCustomer = Boolean(form.name.trim()) && isValidEmail(form.email) && !phoneError;

  async function refresh(term = search) {
    setCustomers(await api.customers(term));
  }

  useEffect(() => {
    refresh('').catch(() => setCustomers(null));
  }, []);

  async function createCustomer(event: FormEvent) {
    event.preventDefault();
    if (!canCreateCustomer) return;

    setFormError('');

    try {
      await api.createCustomer({
        name: form.name.trim(),
        companyName: form.companyName?.trim(),
        email: form.email.trim(),
        phone: form.phone?.trim(),
        address: form.address?.trim()
      });
      setForm(emptyCustomerForm);
      await refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Customer could not be created. Please check the details and try again.');
    }
  }

  return (
    <div className="space-y-5">
      <Toolbar search={search} setSearch={setSearch} onSearch={() => refresh()} />
      <form className="rounded-lg border border-line bg-white p-4 shadow-sm" onSubmit={createCustomer}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <CustomerInput label="Customer name" value={form.name} required maxLength={150} autoComplete="name" onChange={value => setForm(current => ({ ...current, name: value }))} />
          <CustomerInput label="Company" value={form.companyName ?? ''} maxLength={150} autoComplete="organization" onChange={value => setForm(current => ({ ...current, companyName: value }))} />
          <CustomerInput label="Email" type="email" inputMode="email" value={form.email} required maxLength={255} placeholder={emailPlaceholder} error={emailError} autoComplete="email" onChange={value => setForm(current => ({ ...current, email: value }))} />
          <CustomerInput label="Mobile number" type="tel" inputMode="tel" pattern={phonePattern} title={phonePatternTitle} placeholder={phonePlaceholder} error={phoneError} value={form.phone ?? ''} maxLength={50} autoComplete="tel" onChange={value => setForm(current => ({ ...current, phone: value }))} />
        </div>
        <label className="mt-3 block text-sm font-medium">
          Address
          <textarea
            className="focus-ring mt-1 min-h-20 w-full rounded-md border border-line px-3 py-2"
            placeholder="Street, city, state, ZIP"
            maxLength={500}
            value={form.address ?? ''}
            onChange={event => setForm(current => ({ ...current, address: event.target.value }))}
          />
        </label>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {formError ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{formError}</p> : <span />}
          <button
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={!canCreateCustomer}
          >
            <PackagePlus className="h-4 w-4" />
            Add customer
          </button>
        </div>
      </form>
      <DataTable
        columns={['Name', 'Company', 'Email', 'Mobile']}
        rows={(customers?.items ?? []).map(customer => [customer.name, customer.companyName ?? '-', customer.email, customer.phone ?? '-'])}
      />
    </div>
  );
}
