import { AdminNav } from "@/components/admin-nav";
import { LibraryManager } from "@/components/library-manager";

export default function AdminLibraryPage() {
  return (
    <>
      <AdminNav />
      <main className="mx-auto w-full max-w-7xl px-4 py-6">
        <LibraryManager />
      </main>
    </>
  );
}
