import Link from "next/link";
import { Plane, UserPlus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-10 pt-16 safe-top">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Tabby</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Split trip expenses the easy way.
        </p>
      </header>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Plane className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Start a new trip</CardTitle>
                <CardDescription>Create a group and share the code</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="w-full">
              <Link href="/groups/new">Create trip</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Join a trip</CardTitle>
                <CardDescription>Enter a 6-character code from a friend</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" variant="outline" className="w-full">
              <Link href="/groups/join">Enter code</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <footer className="mt-auto pt-10 text-center text-xs text-muted-foreground">
        No accounts. No passwords. Just a join code you share with friends.
      </footer>
    </main>
  );
}
