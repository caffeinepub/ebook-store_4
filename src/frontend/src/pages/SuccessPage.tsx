import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Download,
  Heart,
  Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCompletePurchase,
  useGetEbookDownloadUrl,
  useStripeSessionStatus,
} from "../hooks/useQueries";

function navigateHome() {
  window.location.href = "/";
}

function getSearchParam(name: string): string | undefined {
  return new URLSearchParams(window.location.search).get(name) ?? undefined;
}

export default function SuccessPage() {
  const sessionId = getSearchParam("session_id");
  const ebookId = getSearchParam("ebook_id");

  const { identity } = useInternetIdentity();
  const buyerId = identity?.getPrincipal().toString() ?? "anonymous";

  const sessionQuery = useStripeSessionStatus(sessionId ?? null);
  const completePurchaseMutation = useCompletePurchase();
  const getDownloadUrlMutation = useGetEbookDownloadUrl();

  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paramsRef = useRef({ sessionId, ebookId, buyerId });
  paramsRef.current = { sessionId, ebookId, buyerId };

  const completePurchaseRef = useRef(completePurchaseMutation.mutateAsync);
  completePurchaseRef.current = completePurchaseMutation.mutateAsync;

  const getDownloadUrlRef = useRef(getDownloadUrlMutation.mutateAsync);
  getDownloadUrlRef.current = getDownloadUrlMutation.mutateAsync;

  const didRun = useRef(false);

  useEffect(() => {
    const status = sessionQuery.data;
    if (!status || didRun.current) return;

    const { sessionId: sid, ebookId: eid, buyerId: bid } = paramsRef.current;

    if (status.__kind__ === "completed" && sid && eid) {
      didRun.current = true;
      setCompleted(true);
      Promise.all([
        completePurchaseRef
          .current({ sessionId: sid, buyerId: bid, ebookId: eid })
          .catch(() => {}),
        getDownloadUrlRef
          .current({ sessionId: sid, ebookId: eid })
          .then(setDownloadUrl)
          .catch(() => {}),
      ]);
    } else if (status.__kind__ === "failed") {
      setError(status.failed.error);
    }
  }, [sessionQuery.data]);

  const isLoading =
    sessionQuery.isLoading || (!completed && !error && !!sessionId);

  return (
    <main className="relative z-10 min-h-[70vh] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {isLoading && !error ? (
          <div
            data-ocid="success.loading_state"
            className="flex flex-col items-center gap-6 text-center"
          >
            <Loader2 className="w-14 h-14 text-primary animate-spin" />
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Confirming your purchase…
              </h2>
              <p className="font-serif text-muted-foreground mt-2">
                Please wait while we verify your payment.
              </p>
            </div>
          </div>
        ) : error ? (
          <div
            data-ocid="success.error_state"
            className="flex flex-col items-center gap-6 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Payment Issue
              </h2>
              <p className="font-serif text-muted-foreground mt-2">{error}</p>
            </div>
            <Button
              data-ocid="success.secondary_button"
              variant="outline"
              onClick={navigateHome}
            >
              Return to Store
            </Button>
          </div>
        ) : (
          <div
            data-ocid="success.success_state"
            className="flex flex-col items-center gap-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="relative"
            >
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-primary" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 2,
                  delay: 1,
                }}
                className="absolute -top-1 -right-1"
              >
                <Heart className="w-6 h-6 fill-primary text-primary" />
              </motion.div>
            </motion.div>

            <div>
              <h1 className="font-display text-4xl font-bold text-foreground">
                Thank You!
              </h1>
              <p className="font-serif text-lg text-muted-foreground mt-3 leading-relaxed">
                Your purchase was successful. Your love story is ready to read —
                enjoy every page!
              </p>
            </div>

            <div className="w-full bg-secondary/50 rounded-2xl p-6 border border-border">
              <BookOpen className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-display font-semibold text-foreground mb-1">
                Your Ebook is Ready
              </h3>
              <p className="font-serif text-sm text-muted-foreground mb-4">
                Download your PDF below. Save it to any device or e-reader.
              </p>
              {downloadUrl ? (
                <Button
                  data-ocid="success.primary_button"
                  asChild
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2"
                >
                  <a href={downloadUrl} download>
                    <Download className="w-4 h-4" />
                    Download Your Ebook
                  </a>
                </Button>
              ) : (
                <Button
                  data-ocid="success.loading_state"
                  disabled
                  className="w-full gap-2"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Preparing download…
                </Button>
              )}
            </div>

            <Button
              data-ocid="success.secondary_button"
              variant="ghost"
              onClick={navigateHome}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Browse more stories
            </Button>
          </div>
        )}
      </motion.div>
    </main>
  );
}
