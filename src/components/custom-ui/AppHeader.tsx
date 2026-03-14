import Image from "next/image";
import { Button } from "../ui/button";
import { getSessionUser } from "@/src/lib/session";
import { redirect } from "next/navigation";
import AuthButton from "./AuthButton";

async function AppHeader() {
  const user = await getSessionUser();

  return (
    <div className="w-full h-[75px] shadow-md flex px-[40px] items-center sticky top-0 left-0 bg-background z-10">
      <div className="flex items-center">
        <Image
          src="/Calendar.png"
          alt="Calendar X Logo"
          width={90}
          height={90}
          className=""
        />
        <div className="flex gap-0 flex-col">
          <span className="text-lg font-bold">Calendar X</span>
          <p className="text-[12px] text-muted-foreground max-w-[200px]">
            Calendar app built with Next.js 13
          </p>
        </div>
      </div>

      <div className="ml-auto flex gap-2 items-center">
        <a>
          <Button variant="outline" size="sm">
            View on GitHub
          </Button>
        </a>

        <a>
          <Button variant="default" size="sm">
            Download CV
          </Button>
        </a>
        {user && (
          <span className="text-sm text-muted-foreground">
            User: {user.name}
          </span>
        )}

        <AuthButton isLoggedIn={!!user} />
      </div>
    </div>
  );
}

export default AppHeader;
