import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreateGroupForm } from "@/components/CreateGroupForm";

export default function NewGroupPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-10 pt-6 safe-top">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Create a trip</CardTitle>
          <CardDescription>
            You&apos;ll get a 6-character code to share with your travel buddies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateGroupForm />
        </CardContent>
      </Card>
    </main>
  );
}
