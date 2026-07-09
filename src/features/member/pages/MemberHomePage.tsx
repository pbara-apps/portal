import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MemberHomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Member Portal</CardTitle>
          <CardDescription>
            This area is reserved for member-facing product features. Admin CMS lives under
            /admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-muted">
            Build membership dashboards, resources, and self-service tools here as the product
            grows.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
