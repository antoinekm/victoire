'use client';

import { Fragment, ReactElement, useEffect, useState } from 'react';
import { TerminalIcon } from 'lucide-react';
import { defaultProviders } from '@victoire/core/src/constants/providers';

export function TerminalAnimation() {
  const installCmd = 'npm i -g victoire';
  const tickTime = 80;
  const timeInstallEnd = installCmd.length + 2;
  const timeVictoireCmd = timeInstallEnd + 3;
  const timeVictoireEnd = timeVictoireCmd + 8; // "victoire"
  const timeProviderSelect = timeVictoireEnd + 2;
  const timeProviderMove = timeProviderSelect + 8;
  const timeEnd = timeProviderMove + 3;

  const [tick, setTick] = useState(timeEnd);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => (prev >= timeEnd ? prev : prev + 1));
    }, tickTime);

    return () => {
      clearInterval(timer);
    };
  }, [timeEnd]);

  const lines: ReactElement[] = [];

  // Phase 1: npm i -g victoire
  if (tick <= timeInstallEnd) {
    lines.push(
      <span key="install">
        $ {installCmd.substring(0, tick)}
        {tick < installCmd.length && (
          <div className="inline-block h-3 w-1 animate-pulse bg-pink-400" />
        )}
      </span>
    );
    
    if (tick >= installCmd.length + 1) {
      lines.push(<span key="install-success" className="text-green-400">✓ victoire installed successfully</span>);
    }
  } else {
    lines.push(<span key="install-done">$ {installCmd}</span>);
    lines.push(<span key="install-success-done" className="text-green-400">✓ victoire installed successfully</span>);
  }

  // Phase 2: victoire command
  if (tick > timeInstallEnd) {
    const victoireCmd = 'victoire';
    const victoireTick = Math.max(0, tick - timeVictoireCmd);
    
    if (tick <= timeVictoireEnd) {
      lines.push(
        <span key="victoire">
          $ {victoireCmd.substring(0, victoireTick)}
          {victoireTick < victoireCmd.length && tick >= timeVictoireCmd && (
            <div className="inline-block h-3 w-1 animate-pulse bg-pink-400" />
          )}
        </span>
      );
    } else {
      lines.push(<span key="victoire-done">$ victoire</span>);
    }
  }

  // Phase 3: Victoire UI
  if (tick > timeVictoireEnd) {
    lines.push(<span key="spacer"> </span>);
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        if (tick >= timeEnd) {
          setTick(0);
        }
      }}
    >
      <pre className="overflow-hidden rounded-xl border text-[13px] shadow-lg">
        <div className="flex flex-row items-center gap-2 border-b px-4 py-2 bg-fd-muted">
          <TerminalIcon className="size-4" />
          <span className="font-bold">Terminal</span>
          <div className="grow" />
          <div className="size-2 rounded-full bg-red-400" />
          <div className="size-2 rounded-full bg-yellow-400" />
          <div className="size-2 rounded-full bg-green-400" />
        </div>
        <div className="min-h-[345px] bg-black text-gray-300 p-4">
          <code className="grid font-mono text-sm leading-relaxed">
            {lines}
          </code>
          
          {tick > timeVictoireEnd && (
            <div className="rounded-lg border border-pink-400 bg-gray-900/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-pink-400 font-bold">⬢</span>
                <span className="text-pink-400 font-bold">victoire v0.0.1</span>
              </div>
              
              <div className="mb-2">
                <span className="text-white">Which AI provider would you like to use?</span>
              </div>
              <div className="mb-4 text-gray-400 text-xs">
                To change this later, run /provider
              </div>
              
              {tick > timeProviderSelect && (
                <div className="space-y-1">
                  {/* OpenAI - sélectionné au début puis non sélectionné */}
                  <div className={`flex items-center gap-2 ${tick < timeProviderMove ? 'text-pink-400' : 'text-white'} pl-4`}>
                    {tick < timeProviderMove && <span>❯</span>}
                    <span>{defaultProviders.openai.name} ({defaultProviders.openai.latestModels.join(', ')})</span>
                  </div>
                  
                  {/* Anthropic - non sélectionné puis sélectionné */}
                  <div className={`flex items-center gap-2 ${tick >= timeProviderMove ? 'text-pink-400' : 'text-white'} pl-4`}>
                    {tick >= timeProviderMove && <span>❯</span>}
                    <span>{defaultProviders.anthropic.name} ({defaultProviders.anthropic.latestModels.join(', ')})</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-white pl-4">
                    <span>{defaultProviders.google.name} ({defaultProviders.google.latestModels.join(', ')})</span>
                  </div>
                  
                  <div className="mt-3 text-gray-400 text-xs">
                    Use arrow keys to navigate, Enter to select.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </pre>
    </div>
  );
}

