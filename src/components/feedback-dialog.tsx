"use client";

import { Loader2, MessageSquarePlus } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth/client";

export function FeedbackDialog() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const isAuthenticated = !!session?.user;

  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  // Validation constants (must match API)
  const MIN_MESSAGE_LENGTH = 10;
  const MAX_MESSAGE_LENGTH = 2000;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const isMessageValid =
    message.trim().length >= MIN_MESSAGE_LENGTH &&
    message.trim().length <= MAX_MESSAGE_LENGTH;
  const isEmailValid = isAuthenticated || !email.trim() || EMAIL_REGEX.test(email.trim());
  const handleSubmit = async () => {
    if (!isMessageValid) {
      toast.error(
        `Message must be between ${MIN_MESSAGE_LENGTH} and ${MAX_MESSAGE_LENGTH} characters`,
      );
      return;
    }

    if (!isEmailValid) {
      toast.error("Please provide a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message.trim(),
          email: isAuthenticated ? undefined : email.trim() || undefined,
          path: pathname,
        }),
      });

      if (response.ok) {
        toast.success("Thank you for your feedback!");
        setMessage("");
        setEmail("");
        setOpen(false);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to submit feedback");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setMessage("");
      setEmail("");
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start group-data-[collapsible=icon]:justify-center gap-2 px-2"
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span className="group-data-[collapsible=icon]:hidden">Send Feedback</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Help us improve! Share your thoughts, report bugs, or suggest
            features.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!isAuthenticated && (
            <div className="grid gap-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="Leave your email for follow-up"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Tell us what you think..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px]"
              maxLength={MAX_MESSAGE_LENGTH + 100}
              autoFocus={isAuthenticated}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Minimum {MIN_MESSAGE_LENGTH} characters</span>
              <span
                className={
                  message.length > MAX_MESSAGE_LENGTH
                    ? "text-destructive"
                    : undefined
                }
              >
                {message.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !isMessageValid || !isEmailValid}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Feedback"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
