import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Heart, ShoppingCart, Star } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { Ebook } from "../backend";
import { useCreateCheckoutSession, useEbooks } from "../hooks/useQueries";

const SAMPLE_EBOOKS: Ebook[] = [
  {
    id: "sample-1",
    title: "Whispers of the Heart",
    description:
      "A tender love story set in Paris, where two strangers discover that fate has woven their lives together across time and oceans. A tale of longing, reunion, and the courage to love again.",
    priceInCents: BigInt(499),
    coverImageBlob: {
      getDirectURL: () =>
        "/assets/generated/ebook-cover-love-story.dim_400x560.jpg",
    } as any,
    pdfBlob: { getDirectURL: () => "" } as any,
  },
  {
    id: "sample-2",
    title: "The Last Letter",
    description:
      "When Clara discovers a box of unsent letters in her grandmother's attic, she is drawn into a decades-old romance that still burns as bright as the day it began.",
    priceInCents: BigInt(599),
    coverImageBlob: {
      getDirectURL: () =>
        "/assets/generated/ebook-cover-whispers.dim_400x560.jpg",
    } as any,
    pdfBlob: { getDirectURL: () => "" } as any,
  },
  {
    id: "sample-3",
    title: "Midnight in Verona",
    description:
      "Romeo and Juliet retold for the modern age — two rival restaurant families, a forbidden romance, and a secret recipe that could either unite or destroy them forever.",
    priceInCents: BigInt(399),
    coverImageBlob: {
      getDirectURL: () =>
        "/assets/generated/ebook-cover-love-story.dim_400x560.jpg",
    } as any,
    pdfBlob: { getDirectURL: () => "" } as any,
  },
];

const TRUST_ITEMS = [
  {
    id: "download",
    icon: "📖",
    title: "Instant Download",
    desc: "PDF delivered to you immediately after purchase",
  },
  {
    id: "payment",
    icon: "💳",
    title: "Secure Payment",
    desc: "Powered by Stripe — your payment info is always safe",
  },
  {
    id: "anywhere",
    icon: "📱",
    title: "Read Anywhere",
    desc: "Compatible with all devices, apps, and e-readers",
  },
];

function EbookCard({ ebook, index }: { ebook: Ebook; index: number }) {
  const createCheckout = useCreateCheckoutSession();

  const handleBuy = async () => {
    try {
      const successUrl = `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}&ebook_id=${ebook.id}`;
      const cancelUrl = `${window.location.origin}/`;
      const url = await createCheckout.mutateAsync({
        items: [
          {
            productName: ebook.title,
            productDescription: ebook.description.slice(0, 200),
            currency: "usd",
            priceInCents: ebook.priceInCents,
            quantity: BigInt(1),
          },
        ],
        successUrl,
        cancelUrl,
      });
      window.location.href = url;
    } catch {
      toast.error("Failed to create checkout. Please try again.");
    }
  };

  const price = Number(ebook.priceInCents) / 100;
  const coverUrl = ebook.coverImageBlob?.getDirectURL?.() ?? "";

  return (
    <motion.article
      data-ocid={`store.item.${index + 1}`}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative flex flex-col bg-card rounded-2xl overflow-hidden shadow-book hover:shadow-book-hover transition-all duration-300 hover:-translate-y-1"
    >
      {/* Cover */}
      <div className="relative overflow-hidden aspect-[5/7] bg-muted">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={ebook.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <BookOpen className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground font-semibold text-sm px-3 py-1">
          ${price.toFixed(2)}
        </Badge>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <div className="flex items-start gap-2">
          <Heart className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <h3 className="font-display font-bold text-lg leading-tight text-card-foreground line-clamp-2">
            {ebook.title}
          </h3>
        </div>
        <p className="font-serif text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
          {ebook.description}
        </p>
        <div className="flex items-center gap-1 mb-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className="w-3.5 h-3.5 fill-accent text-accent" />
          ))}
          <span className="text-xs text-muted-foreground ml-1">5.0</span>
        </div>
        <Button
          data-ocid={`store.item.${index + 1}.primary_button`}
          onClick={handleBuy}
          disabled={createCheckout.isPending}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-xl gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          {createCheckout.isPending
            ? "Processing…"
            : `Buy Now — $${price.toFixed(2)}`}
        </Button>
      </div>
    </motion.article>
  );
}

function EbookCardSkeleton() {
  return (
    <div className="flex flex-col bg-card rounded-2xl overflow-hidden shadow-xs">
      <Skeleton className="aspect-[5/7] w-full" />
      <div className="p-5 flex flex-col gap-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-10 w-full mt-2" />
      </div>
    </div>
  );
}

export default function StorefrontPage() {
  const { data: ebooks, isLoading } = useEbooks();

  const displayEbooks = ebooks && ebooks.length > 0 ? ebooks : SAMPLE_EBOOKS;
  const isSample = !ebooks || ebooks.length === 0;

  return (
    <main className="relative z-10">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('/assets/generated/hero-banner.dim_1200x500.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/50 to-background" />
        <div className="relative container mx-auto px-6 py-24 flex flex-col items-center text-center gap-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <Badge
              variant="outline"
              className="border-primary/40 text-primary font-serif text-sm px-4 py-1.5 mb-4"
            >
              ✦ Romance · Love Stories · Fiction
            </Badge>
            <h1 className="font-display font-bold text-5xl md:text-7xl text-foreground leading-tight tracking-tight">
              Stories That
              <span className="block text-primary italic">Touch the Heart</span>
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="font-serif text-xl text-muted-foreground max-w-xl leading-relaxed"
          >
            Beautifully crafted love stories, available instantly as digital
            downloads. Lose yourself in worlds where love always finds a way.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex gap-2 items-center text-sm text-muted-foreground"
          >
            <BookOpen className="w-4 h-4 text-primary" />
            <span>Instant PDF download · Read on any device</span>
          </motion.div>
        </div>
      </section>

      {/* Ebook grid */}
      <section className="container mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-baseline justify-between mb-10"
        >
          <div>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground">
              Our Collection
            </h2>
            <p className="font-serif text-muted-foreground mt-2">
              {isSample
                ? "Curated love stories, ready to download"
                : `${displayEbooks.length} title${
                    displayEbooks.length !== 1 ? "s" : ""
                  } available`}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <Heart className="w-4 h-4 text-primary" />
            <span>Handpicked romance</span>
          </div>
        </motion.div>

        {isLoading ? (
          <div
            data-ocid="store.loading_state"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {[1, 2, 3, 4].map((i) => (
              <EbookCardSkeleton key={i} />
            ))}
          </div>
        ) : displayEbooks.length === 0 ? (
          <div
            data-ocid="store.empty_state"
            className="flex flex-col items-center justify-center py-24 gap-4 text-center"
          >
            <BookOpen className="w-14 h-14 text-muted-foreground/40" />
            <h3 className="font-display text-xl text-muted-foreground">
              No books yet
            </h3>
            <p className="font-serif text-muted-foreground/70">
              New titles coming soon — check back shortly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayEbooks.map((ebook, i) => (
              <EbookCard key={ebook.id} ebook={ebook} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Trust section */}
      <section className="border-t border-border bg-secondary/30 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {TRUST_ITEMS.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex flex-col items-center gap-3"
              >
                <span className="text-3xl">{item.icon}</span>
                <h3 className="font-display font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="font-serif text-sm text-muted-foreground">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
