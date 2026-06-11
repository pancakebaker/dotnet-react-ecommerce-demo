import type { ReactNode } from 'react';
import type { ProductImage } from '../../../helpers/productImages';

type HeroAction = {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  disabled?: boolean;
};

type HeroStat = {
  label: string;
  value: string;
};

type CommerceHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  background: ProductImage;
  actions?: HeroAction[];
  stats?: HeroStat[];
};

export function CommerceHero({ eyebrow, title, description, background, actions = [], stats = [] }: CommerceHeroProps) {
  return (
    <section className="relative isolate overflow-hidden border-b border-line bg-white">
      <picture className="absolute inset-0 h-full w-full">
        <source type="image/webp" srcSet={background.webpSrcSet} sizes="100vw" />
        <img
          src={background.src}
          srcSet={background.srcSet}
          sizes="100vw"
          alt={background.alt}
          className="h-full w-full object-cover"
          width="1280"
          height="430"
          loading="eager"
          fetchPriority="high"
        />
      </picture>
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/45" />
      <div className="relative mx-auto grid min-h-[320px] max-w-7xl gap-6 px-4 py-8 sm:px-6 md:min-h-[390px] lg:min-h-[430px] lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-14">
        <div>
          {eyebrow && <p className="text-sm font-semibold uppercase text-brand">{eyebrow}</p>}
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-700 sm:text-base sm:leading-7">
            {description}
          </p>
          {actions.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {actions.map(action => (
                <button
                  className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={action.disabled}
                  key={action.label}
                  onClick={action.onClick}
                  type="button"
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {stats.length > 0 && (
          <div className="rounded-lg border border-line bg-white/85 p-5 shadow-sm backdrop-blur">
            <dl className="grid grid-cols-3 gap-4 text-center">
              {stats.map(stat => (
                <div key={stat.label}>
                  <dt className="text-xs uppercase text-slate-500">{stat.label}</dt>
                  <dd className="mt-2 text-2xl font-semibold">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </section>
  );
}
