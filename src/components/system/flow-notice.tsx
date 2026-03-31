import Link from "next/link";

type FlowNoticeProps = {
  success?: string;
  error?: string;
  nextHref?: string;
  nextLabel?: string;
};

export function FlowNotice({ success, error, nextHref, nextLabel }: FlowNoticeProps) {
  if (!success && !error) {
    return null;
  }

  return (
    <div className="space-y-3">
      {success ? (
        <div className="rounded-xl border border-[#f0cf8f] bg-[#fff3dd] px-4 py-3 text-sm text-[#8f5d15]">
          <p>{success}</p>
          {nextHref && nextLabel ? (
            <Link
              href={nextHref}
              className="mt-3 inline-flex rounded-lg border border-[#d79f4d] bg-[#f5ba5f] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#3d2418]"
            >
              Lanjut ke {nextLabel}
            </Link>
          ) : null}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-[#f0b1b8] bg-[#fff2f4] px-4 py-3 text-sm text-[#9b2f39]">{error}</div>
      ) : null}
    </div>
  );
}
