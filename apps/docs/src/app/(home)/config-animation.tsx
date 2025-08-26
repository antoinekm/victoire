'use client';

import { useEffect, useState } from 'react';
import { TerminalIcon } from 'lucide-react';
import { defaultProviders } from '@victoire.run/core/src/constants/providers';

export function ConfigAnimation() {
  const apiKey = 'sk-ant-api03_bRs5mK8XzY9wQ2fJ7nP4tU6v';
  const tickTime = 60;
  const timeEnd = apiKey.length + 5;

  const [tick, setTick] = useState(timeEnd);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => (prev >= timeEnd ? prev : prev + 1));
    }, tickTime);

    return () => {
      clearInterval(timer);
    };
  }, [timeEnd]);

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
          <div className="rounded-lg border border-pink-400 bg-gray-900/50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-pink-400 font-bold">⬢</span>
              <span className="text-pink-400 font-bold">victoire › anthropic setup</span>
            </div>
            
            <div className="mb-2">
              <span className="text-white">Get your API key from:</span>
            </div>
            <div className="mb-4 text-pink-400 text-sm">
              {defaultProviders.anthropic.url}
            </div>
            
            <div className="flex items-center gap-2 text-white">
              <span className="text-gray-400">{'>'}</span>
              <span className="text-white">{apiKey.substring(0, tick)}</span>
              {tick < apiKey.length && (
                <div className="inline-block h-4 w-2 animate-pulse bg-pink-400" />
              )}
              {tick < apiKey.length && (
                <span className="text-gray-500 ml-2">({defaultProviders.anthropic.prefix})</span>
              )}
            </div>
            
            {tick >= apiKey.length && (
              <div className="mt-4 text-green-400 text-sm">
                ✓ API key configured successfully
              </div>
            )}
          </div>
          
          {tick >= apiKey.length + 2 && (
            <div className="mt-2 text-gray-400 text-xs">
              Press Esc to go back
            </div>
          )}
        </div>
      </pre>
    </div>
  );
}