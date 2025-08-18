import { TerminalAnimation } from './terminal-animation';
import { ConfigAnimation } from './config-animation';

export function Introduction() {
  const badgeClasses = 'inline-flex size-7 items-center justify-center rounded-full bg-fd-primary font-medium text-fd-primary-foreground';
  
  return (
    <div className="grid grid-cols-1 border-r bg-fd-background md:grid-cols-2">
      <div className="flex flex-col gap-2 border-l border-t px-6 py-12 md:py-16">
        <div className={badgeClasses}>1</div>
        <h3 className="text-xl font-semibold">Install it.</h3>
        <p className="mb-8 text-fd-muted-foreground">
          Get started in seconds with npm, yarn, or pnpm.
        </p>
        <TerminalAnimation />
      </div>
      <div className="flex flex-col gap-2 border-l border-t px-6 py-12 md:py-16">
        <div className={badgeClasses}>2</div>
        <h3 className="text-xl font-semibold">Configure.</h3>
        <p className="mb-8 text-fd-muted-foreground">
          Choose your AI provider and add your API keys.
        </p>
        <ConfigAnimation />
      </div>
      <div className="col-span-full flex flex-col items-center gap-2 border-l border-t px-6 py-16 text-center">
        <div className={badgeClasses}>3</div>
        <h3 className="text-2xl font-semibold">Code.</h3>
        <p className="text-fd-muted-foreground">
          Start coding with AI assistance from any provider, right in your terminal.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
          <div className="rounded-lg border bg-fd-card/50 p-4">
            <code className="font-mono text-fd-primary">victoire code</code>
            <p className="mt-2 text-fd-muted-foreground">Interactive coding session</p>
          </div>
          <div className="rounded-lg border bg-fd-card/50 p-4">
            <code className="font-mono text-fd-primary">victoire edit app.tsx</code>
            <p className="mt-2 text-fd-muted-foreground">Edit files with AI</p>
          </div>
          <div className="rounded-lg border bg-fd-card/50 p-4">
            <code className="font-mono text-fd-primary">victoire debug</code>
            <p className="mt-2 text-fd-muted-foreground">Debug with AI guidance</p>
          </div>
        </div>
      </div>
    </div>
  );
}