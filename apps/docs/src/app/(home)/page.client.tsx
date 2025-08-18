'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { CheckIcon, CopyIcon } from 'lucide-react';

export function InstallCommand() {
  const [copied, setCopied] = useState(false);
  const command = 'npm i -g victoire';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="inline-flex items-center gap-2 rounded-lg border bg-fd-muted/30 px-4 py-2 font-mono text-sm">
      <span className="text-fd-muted-foreground">$</span>
      <span className="font-semibold">{command}</span>
      <button
        onClick={handleCopy}
        className="ml-2 rounded p-1 transition-colors hover:bg-fd-accent"
        aria-label="Copy to clipboard"
      >
        {copied ? (
          <CheckIcon className="h-4 w-4 text-green-500" />
        ) : (
          <CopyIcon className="h-4 w-4 text-fd-muted-foreground" />
        )}
      </button>
    </div>
  );
}

export function PreviewImages() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative mt-8 md:mt-12">
      <div className="absolute inset-0 bg-gradient-to-t from-fd-background via-transparent to-transparent z-10 pointer-events-none" />
      <div className="flex flex-col items-center justify-center gap-4 pb-8">
        <div className="relative w-full max-w-[900px] rounded-lg border bg-fd-card shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2 border-b px-4 py-2 bg-fd-muted/50">
            <div className="flex gap-1.5">
              <div className="size-3 rounded-full bg-red-500" />
              <div className="size-3 rounded-full bg-yellow-500" />
              <div className="size-3 rounded-full bg-green-500" />
            </div>
            <span className="text-xs text-fd-muted-foreground font-mono">victoire --help</span>
          </div>
          <div className="p-4 bg-black text-green-400 font-mono text-sm">
            <pre className="overflow-x-auto">
{`$ victoire --help

  Victoire - Universal CLI for AI Coding Assistants
  
  Usage:
    victoire [command] [options]
    
  Commands:
    code      Start coding session (like Claude Code)
    chat      Interactive chat with your AI
    edit      Edit files with AI assistance  
    refactor  Refactor code intelligently
    debug     Debug with AI guidance
    
  Options:
    --provider    Choose your AI (claude, openai, gemini, local)
    --model       Select model (opus, gpt-4, gemini-pro)
    --context     Include project context
    --help        Show this help message
    
  Examples:
    victoire code "Fix the TypeScript errors"
    victoire edit app.tsx --provider claude
    victoire refactor --context "Make it more functional"
`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}