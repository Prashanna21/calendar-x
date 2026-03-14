export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex page-container items-center justify-center bg-muted/30 p-4">
      {children}
    </main>
  );
}
