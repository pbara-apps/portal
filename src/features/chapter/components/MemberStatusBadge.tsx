import { Badge } from "@/components/ui/badge";
import type { PortalMember } from "../types";

/** One badge describing where a member is in the approval process. */
export function MemberStatusBadge({ member }: { member: Pick<PortalMember, "status" | "changesRequested"> }) {
  if (member.status === "pending" && member.changesRequested) {
    return <Badge className="bg-amber-100 text-amber-800">Changes requested</Badge>;
  }
  switch (member.status) {
    case "pending":
      return <Badge className="bg-sky-100 text-sky-800">Awaiting approval</Badge>;
    case "active":
      return <Badge variant="success">Active</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    case "transferred":
      return <Badge variant="secondary">Transferred</Badge>;
    default:
      return <Badge variant="outline">Inactive</Badge>;
  }
}
