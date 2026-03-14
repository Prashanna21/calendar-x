"use client";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { logoutAction } from "@/src/actions/auth-actions";

export default function AuthButton({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();

  const handleLoginLogout = () => {
    if (isLoggedIn) {
      logoutAction().then(() => {
        router.push("/login");
      });
    } else {
      router.push("/login");
    }
  };
  return (
    <Button onClick={handleLoginLogout}>
      {isLoggedIn ? "Logout" : "Login"}
    </Button>
  );
}
