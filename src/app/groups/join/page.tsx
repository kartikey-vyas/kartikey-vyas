import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { JoinGroupForm } from "@/components/JoinGroupForm";

export default function JoinLandingPage() {
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
          <CardTitle>Join a trip</CardTitle>
          <CardDescription>
            Enter the 6-character code someone shared with you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JoinGroupForm />
        </CardContent>
      </Card>
    </main>
  );
}
