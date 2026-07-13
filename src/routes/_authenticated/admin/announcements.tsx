import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { CrudTable } from "@/components/crud-table";
import { Badge } from "@/components/ui/badge";
import { fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/announcements")({
  // Gunakan 'head' untuk mengatur judul halaman
  head: () => ({
    meta: [{ title: "Announcements — Admin" }],
  }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  return (
    <DashboardShell title="Announcements" description="Publish updates to patients.">
      <CrudTable
        table="announcements"
        title="Announcement"
        searchKeys={["title", "body", "category"]}
        columns={[
          { key: "title", label: "Title" },
          { key: "category", label: "Category" },
          {
            key: "is_pinned",
            label: "Pinned",
            render: (r: any) => (
              <Badge variant={r.is_pinned ? "default" : "secondary"}>
                {r.is_pinned ? "Yes" : "No"}
              </Badge>
            ),
          },
          {
            key: "published_at",
            label: "Published",
            render: (r: any) => (r.published_at ? fmtDateTime(r.published_at) : "-"),
          },
        ]}
        fields={[
          { key: "title", label: "Title", required: true },
          { key: "body", label: "Body", type: "textarea", required: true },
          { key: "category", label: "Category" },
          { key: "is_pinned", label: "Pin to top", type: "checkbox" },
        ]}
      />
    </DashboardShell>
  );
}