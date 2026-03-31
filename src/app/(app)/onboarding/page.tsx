import { OnboardingModule } from "@/components/modules/onboarding-module";
import { PageHeading } from "@/components/system/page-heading";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  return (
    <div className="space-y-5">
      <PageHeading
        title="Checklist Onboarding"
        description="Ikuti checklist ini agar alur stock opname mudah dipahami dari setup awal sampai tutup bulan."
        flowStep={1}
        flowLabel="Setup Awal"
      />
      <OnboardingModule />
    </div>
  );
}
