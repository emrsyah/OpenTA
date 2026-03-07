"use client";

import { AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Cari Dosen route error:", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-destructive/50">
                <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                        <AlertCircle className="w-6 h-6 text-destructive" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Terjadi Kesalahan</h2>
                    <p className="text-muted-foreground text-sm mb-6">
                        Maaf, terjadi kesalahan saat memuat halaman ini. Silakan coba lagi.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-3">
                        <Button variant="outline" onClick={() => window.history.back()}>
                            Kembali
                        </Button>
                        <Button onClick={() => reset()}>Muat Ulang</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
