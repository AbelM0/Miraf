import { ReaderScreen } from "@/components/reader/reader-screen";

export default async function ReadBookPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  return <ReaderScreen bookId={bookId} />;
}
