import { AdviceRoutes } from "@/components/landing/advice-routes";
import { AdvisorProof } from "@/components/landing/advisor-proof";
import { ClientProof } from "@/components/landing/client-proof";
import { DeferredConsultation } from "@/components/landing/deferred-islands";
import { EditorialInspection } from "@/components/landing/editorial-inspection";
import { Hero } from "@/components/landing/hero";
import { LandingMotion } from "@/components/landing/landing-motion";
import { AdvisoryTools } from "@/components/tools/advisory-tools";

export default function HomePage() {
  return (
    <>
      <Hero />
      <AdviceRoutes />
      <AdvisorProof />
      <ClientProof />
      <div
        className="inspection-tools-reveal"
        data-inspection-tools-reveal=""
      >
        <EditorialInspection />
        <AdvisoryTools />
        <DeferredConsultation />
      </div>
      <LandingMotion />
    </>
  );
}
