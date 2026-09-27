import { createFileRoute } from "@tanstack/react-router";
import { AppHome } from "@/components/app-home";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main className="min-h-dvh bg-bg text-fg">
      <AppHome />
    </main>
  );
}
