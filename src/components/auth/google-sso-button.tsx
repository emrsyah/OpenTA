import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signInGoogle } from "@/lib/auth/client";

export const GoogleSsoButton = () => {
  return (
    <Button onClick={() => signInGoogle()} className="w-full justify-center">
      <LogIn className="h-4 w-4 group-data-[collapsible=icon]:block hidden" />
      <span className="group-data-[collapsible=icon]:hidden">
        Sign in with Google
      </span>
    </Button>
  );
};
