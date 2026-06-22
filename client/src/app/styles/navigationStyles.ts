import clsx from 'clsx';

export function sidebarNavButtonClass(isActive: boolean): string {
  return clsx(
    'focus-ring flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm',
    isActive ? 'bg-teal-50 text-brand' : 'hover:bg-field'
  );
}

export function mobileNavButtonClass(isActive: boolean): string {
  return clsx(
    'focus-ring min-h-10 flex-none rounded-md px-3 py-2 text-sm',
    isActive ? 'bg-teal-50 text-brand' : 'bg-white'
  );
}
