import { AnimatedSection } from "@/components/system/animated-section";

export function PageHeading({
  title,
  description,
  flowStep,
  flowLabel,
}: {
  title: string;
  description?: string;
  flowStep?: 1 | 2 | 3;
  flowLabel?: string;
}) {
  return (
    <AnimatedSection>
      <div className="relative mb-6 overflow-hidden rounded-[28px] border border-[#ebcda3] bg-[#fff9ef] px-6 py-7 shadow-[0_28px_56px_-34px_rgba(81,47,26,0.42)] md:px-8 md:py-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(229,143,180,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(243,194,94,0.2),transparent_32%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#936848]">Donat Dankau - Stock Opname Bahan Baku</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.055em] text-[#3c2216] sm:text-3xl md:text-4xl">{title}</h1>
            {description ? <p className="mt-3 max-w-2xl text-sm leading-7 text-[#70513a] md:text-[15px]">{description}</p> : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <div className="w-full rounded-xl border border-[#ecd0ab] bg-[#fff4e4] px-4 py-3 shadow-[0_14px_26px_-20px_rgba(81,47,26,0.35)] sm:w-auto">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#946949]">Skala Usaha</p>
              <p className="mt-1 text-sm font-semibold text-[#4b2f1f]">UMKM Satu Toko</p>
            </div>
            <div className="w-full rounded-xl border border-[#ecd0ab] bg-[#fff4e4] px-4 py-3 shadow-[0_14px_26px_-20px_rgba(81,47,26,0.35)] sm:w-auto">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#946949]">Status Alur</p>
              {flowStep ? (
                <>
                  <p className="mt-1 text-sm font-semibold text-[#4b2f1f]">Anda di langkah {flowStep} dari 3</p>
                  <p className="mt-1 text-xs text-[#6d4f39]">{flowLabel ?? "Alur operasional stock opname"}</p>
                </>
              ) : (
                <p className="mt-1 text-sm font-semibold text-[#4b2f1f]">Siap dipakai hari ini</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}

