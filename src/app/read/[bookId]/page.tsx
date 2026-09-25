import { ReaderScreen } from "@/components/reader/reader-screen";
import { LibraryProvider } from "@/components/library/library-provider";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ReadBookPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent(`/read/${bookId}`)}`);
  return <LibraryProvider userId={userId}><ReaderScreen bookId={bookId} /></LibraryProvider>;
}
