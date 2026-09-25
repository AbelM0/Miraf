import { LibraryScreen } from "@/components/library/library-screen";
import { LibraryProvider } from "@/components/library/library-provider";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <LibraryProvider userId={userId}><LibraryScreen /></LibraryProvider>;
}
