import { SiteHeader } from "@/components/site-header";
import { UploadModal } from "@/components/upload-modal";

export default function UploadPage() {
  return (
    <main className="pb-24 md:pb-0">
      <SiteHeader />
      <section className="container-grid py-10">
        <UploadModal />
      </section>
    </main>
  );
}
