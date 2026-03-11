import { Heart } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  const utmLink = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`;

  return (
    <footer className="relative z-10 border-t border-border bg-secondary/20 py-8 mt-auto">
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-serif text-muted-foreground">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-primary fill-primary" />
          <span className="font-display font-semibold text-foreground">
            LoveReads
          </span>
          <span>— Where every story matters</span>
        </div>
        <p>
          © {year}. Built with{" "}
          <Heart className="inline w-3 h-3 text-primary fill-primary" /> using{" "}
          <a
            href={utmLink}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </footer>
  );
}
