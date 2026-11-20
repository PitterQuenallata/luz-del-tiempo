import React, { useState } from 'react';
import { Copy, Check, Terminal, FileCode } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { notify } from '../../../shared/lib/notify';
import { useSound } from '../../../shared/context/sound-context';
import { cn } from '../../../shared/lib/utils';

interface DocCodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

export const DocCodeBlock: React.FC<DocCodeBlockProps> = ({
  code,
  language = 'typescript',
  filename,
}) => {
  const { play } = useSound();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      play('pop');
      notify.success('Código Copiado', 'Fragmento transferido al portapapeles.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify.error('Error al Copiar', 'No se pudo acceder al portapapeles.');
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-neutral-950 text-neutral-100 overflow-hidden shadow-sm my-4 font-mono text-xs">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900/80 border-b border-neutral-800">
        <div className="flex items-center gap-2 text-neutral-400">
          {language === 'bash' ? (
            <Terminal className="h-3.5 w-3.5 text-neutral-400" />
          ) : (
            <FileCode className="h-3.5 w-3.5 text-neutral-400" />
          )}
          <span className="font-medium text-[11px] text-neutral-300">
            {filename || language.toUpperCase()}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-2.5 text-[11px] text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg gap-1.5 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copiar</span>
            </>
          )}
        </Button>
      </div>

      {/* Code Body */}
      <div className="p-4 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-800 leading-relaxed text-neutral-200 selection:bg-primary/30 selection:text-white">
        <pre className="whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
