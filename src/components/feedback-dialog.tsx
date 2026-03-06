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

  const handleSubmit = async () => {
    if (!message.trim() || message.trim().length < 10) {
      toast.error("Message must be at least 10 characters");
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
          className="w-full justify-start gap-2 px-2"
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span>Send Feedback</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Help us improve! Share your thoughts, report bugs, or suggest
            features.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="path">Current Page</Label>
            <Input id="path" value={pathname} readOnly className="bg-muted" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">
              Email {isAuthenticated ? "(your account)" : "(optional)"}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={
                isAuthenticated ? undefined : "Leave your email for follow-up"
              }
              value={isAuthenticated ? session.user.email || "" : email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={isAuthenticated}
              className={isAuthenticated ? "bg-muted" : undefined}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Tell us what you think..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              Minimum 10 characters
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || message.trim().length < 10}
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
