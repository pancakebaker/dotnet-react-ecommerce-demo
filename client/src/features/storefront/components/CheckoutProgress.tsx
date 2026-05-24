import { checkoutSteps, type CheckoutStep } from './checkoutTypes';

type CheckoutProgressProps = {
  activeStep: CheckoutStep;
  canOpenStep: (step: CheckoutStep) => boolean;
  onStepChange: (step: CheckoutStep) => void;
};

export function CheckoutProgress({ activeStep, canOpenStep, onStepChange }: CheckoutProgressProps) {
  return (
    <nav className="rounded-lg border border-line bg-white p-3 shadow-sm" aria-label="Checkout progress">
      <ol className="grid gap-2 sm:grid-cols-3">
        {checkoutSteps.map((item, index) => {
          const active = item.id === activeStep;
          const enabled = canOpenStep(item.id);

          return (
            <li key={item.id}>
              <button
                className={`focus-ring flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-semibold ${active ? 'bg-teal-50 text-brand' : 'text-slate-600 hover:bg-field'} disabled:cursor-not-allowed disabled:opacity-50`}
                disabled={!enabled}
                onClick={() => onStepChange(item.id)}
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
  );
}
