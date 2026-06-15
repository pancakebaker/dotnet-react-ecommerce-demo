import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { PackagePlus } from 'lucide-react';
import { CustomerInput } from '../../components/CustomerInput';
import { DataTable } from '../../components/DataTable';
import { Toolbar } from '../../components/Toolbar';
import { emailPlaceholder, emailValidationMessage, isValidEmail, isValidPhone, phonePattern, phonePatternTitle, phonePlaceholder, phoneValidationMessage } from '../../helpers/validation';
import type { Customer, CustomerForm, PagedResult, Role, StorefrontCustomer } from '../../models';
import { canAccess, canEditField, canViewField, filterEditablePayload } from '../../permissions/permissions';
import type { ApiClient } from '../../services/apiClient';

type CustomersViewProps = {
  api: ApiClient;
  role: Role;
};

const emptyCustomerForm: StorefrontCustomer = {
  name: '',
  companyName: '',
  email: '',
  phone: '',
  address: ''
};

type CustomerColumn = {
  field: keyof Customer;
  label: string;
  render: (customer: Customer) => string;
};

const customerColumns: CustomerColumn[] = [
  { field: 'name', label: 'Name', render: customer => customer.name },
  { field: 'companyName', label: 'Company', render: customer => customer.companyName ?? '-' },
  { field: 'email', label: 'Email', render: customer => customer.email },
  { field: 'phone', label: 'Mobile', render: customer => customer.phone ?? '-' }
];

export function CustomersView({ api, role }: CustomersViewProps) {
  const [customers, setCustomers] = useState<PagedResult<Customer> | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<StorefrontCustomer>(emptyCustomerForm);
  const [formError, setFormError] = useState('');
  const emailError = form.email.trim().length > 0 && !isValidEmail(form.email) ? emailValidationMessage : '';
  const phoneError = isValidPhone(form.phone) ? '' : phoneValidationMessage;
  const canCreateCustomer = canAccess(role, 'customers', 'create') && Boolean(form.name.trim()) && isValidEmail(form.email) && !phoneError;
  const visibleColumns = customerColumns.filter(column => canViewField(role, 'customers', column.field));

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
      const payload = filterEditablePayload(role, 'customers', {
        name: form.name.trim(),
        companyName: form.companyName?.trim(),
        email: form.email.trim(),
        phone: form.phone?.trim(),
        address: form.address?.trim()
      }) as CustomerForm;

      await api.createCustomer(payload);
      setForm(emptyCustomerForm);
      await refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Customer could not be created. Please check the details and try again.');
    }
  }

  return (
    <div className="space-y-5">
      <Toolbar search={search} setSearch={setSearch} onSearch={() => refresh()} />
      {canAccess(role, 'customers', 'create') && (
        <form className="rounded-lg border border-line bg-white p-4 shadow-sm" onSubmit={createCustomer}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {canEditField(role, 'customers', 'name') && <CustomerInput label="Customer name" value={form.name} required maxLength={150} autoComplete="name" onChange={value => setForm(current => ({ ...current, name: value }))} />}
            {canEditField(role, 'customers', 'companyName') && <CustomerInput label="Company" value={form.companyName ?? ''} maxLength={150} autoComplete="organization" onChange={value => setForm(current => ({ ...current, companyName: value }))} />}
            {canEditField(role, 'customers', 'email') && <CustomerInput label="Email" type="email" inputMode="email" value={form.email} required maxLength={255} placeholder={emailPlaceholder} error={emailError} autoComplete="email" onChange={value => setForm(current => ({ ...current, email: value }))} />}
            {canEditField(role, 'customers', 'phone') && <CustomerInput label="Mobile number" type="tel" inputMode="tel" pattern={phonePattern} title={phonePatternTitle} placeholder={phonePlaceholder} error={phoneError} value={form.phone ?? ''} maxLength={50} autoComplete="tel" onChange={value => setForm(current => ({ ...current, phone: value }))} />}
          </div>
          {canEditField(role, 'customers', 'address') && (
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
          )}
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
      )}
      <DataTable
        columns={visibleColumns.map(column => column.label)}
        rows={(customers?.items ?? []).map(customer => visibleColumns.map(column => column.render(customer)))}
      />
    </div>
  );
}
