"use client";
function ClientRedirectComponent({
  redirectUrl,
  children,
  className,
}: {
  redirectUrl: string;
  children: React.ReactNode;
  className?: string;
}) {
  const handleRedirect = () => {
    window.location.href = redirectUrl;
  };

  return (
    <div onClick={handleRedirect} className={className}>
      {children}
    </div>
  );
}

export default ClientRedirectComponent;
