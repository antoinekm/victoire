import Link from 'next/link';
import { cn } from '@/lib/cn';

export function Hero() {
  return (
    <div className="relative z-2 flex flex-col border-x border-t bg-fd-background/80 px-4 pt-12 pb-12 max-md:text-center md:px-12 md:pt-16 md:pb-16 overflow-hidden">
      <div
        className="absolute inset-0 z-[-1] blur-2xl hidden dark:block"
        style={{
          maskImage:
            'linear-gradient(to bottom, transparent, white, transparent)',
          background:
            'repeating-linear-gradient(65deg, var(--color-fd-primary), var(--color-fd-primary) 12px, color-mix(in oklab, var(--color-fd-accent) 30%, transparent) 20px, transparent 200px)',
        }}
      />
      <div
        className="absolute inset-0 z-[-1] blur-2xl dark:hidden"
        style={{
          maskImage:
            'linear-gradient(to bottom, transparent, white, transparent)',
          background:
            'repeating-linear-gradient(65deg, var(--color-fd-accent), var(--color-fd-accent) 12px, color-mix(in oklab, var(--color-fd-primary) 30%, transparent) 20px, transparent 200px)',
        }}
      />
      <h1 className="mb-8 text-4xl font-medium md:hidden">AI Coding Assistant</h1>
      <h1 className="mb-8 max-w-[600px] text-4xl font-medium max-md:hidden">
        The universal CLI for AI-powered coding assistants
      </h1>
      <p className="mb-8 text-fd-muted-foreground md:max-w-[80%] md:text-xl">
        Victoire brings Claude Code, GitHub Copilot, and Gemini capabilities to your terminal. 
        One CLI to rule them all - switch between providers seamlessly while keeping your workflow.
      </p>
      <div className="inline-flex items-center gap-3 max-md:mx-auto">
        <Link
          href="/docs"
          className={cn(
            "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-fd-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
            "bg-fd-primary text-fd-primary-foreground hover:bg-fd-primary/90",
            "h-11 rounded-full px-8"
          )}
        >
          Getting Started
        </Link>
        <a
          href="https://github.com/antoinekm/victoire"
          target="_blank"
          rel="noreferrer noopener"
          className={cn(
            "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-fd-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
            "border border-fd-input hover:bg-fd-accent hover:text-fd-accent-foreground",
            "h-11 rounded-full px-8 bg-fd-background"
          )}
        >
          View on GitHub
        </a>
      </div>
    </div>
  );
}