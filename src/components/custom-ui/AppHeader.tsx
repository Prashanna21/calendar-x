import Image from "next/image";
import { Button } from "../ui/button";
import { getSessionUser } from "@/src/lib/session";
import AuthButton from "./AuthButton";
import ClientRedirectComponent from "./ClientRedirectComponent";

async function AppHeader() {
  const user = await getSessionUser();

  return (
    <div className="w-full h-[75px] shadow-md flex px-[40px] items-center sticky top-0 left-0 bg-background z-10">
      <ClientRedirectComponent
        redirectUrl="/"
        className="flex items-center cursor-pointer"
      >
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
      </ClientRedirectComponent>

      <div className="ml-auto flex gap-2 items-center">
        <a href="https://github.com/Prashanna21/calendar-x">
          <Button variant="outline" size="sm">
            View on GitHub
          </Button>
        </a>

        <a href="https://drive.google.com/drive/folders/1RFpCR6yuhuwDn6Pi8zTrdGJO6GTZCmOS?usp=sharing">
          <Button variant="default" size="sm">
            View CV
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
