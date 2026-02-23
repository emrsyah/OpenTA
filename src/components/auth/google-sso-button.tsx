import { Button } from "@/components/ui/button";
import { signInGoogle } from "@/lib/auth/client";

export const GoogleSsoButton = () => {
    return (
        <Button onClick={() => signInGoogle()}>Sign in with Google</Button>
    )
}