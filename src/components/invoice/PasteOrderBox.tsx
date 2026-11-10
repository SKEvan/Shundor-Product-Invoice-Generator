import { useState } from 'react';
import { ClipboardPaste, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface PasteOrderBoxProps {
  /** Called with the pasted text whenever it should be read into the form. */
  onRead: (text: string) => void;
}

/** Step 1: the owner pastes the buyer's filled-in order template here. */
export function PasteOrderBox({ onRead }: PasteOrderBoxProps) {
  const [text, setText] = useState('');
  const [clipboardError, setClipboardError] = useState(false);

  function read(value: string) {
    setText(value);
    if (value.trim()) onRead(value);
  }

  async function pasteFromClipboard() {
    try {
      read(await navigator.clipboard.readText());
      setClipboardError(false);
    } catch {
      setClipboardError(true);
    }
  }

  return (
    <Card
      title="1. Paste the order"
      action={
        <Button variant="secondary" icon={<ClipboardPaste className="size-4" />} onClick={pasteFromClipboard}>
          Paste
        </Button>
      }
    >
      <textarea
        aria-label="Order message from the buyer"
        value={text}
        onChange={(event) => setText(event.target.value)}
        // Pasting fills the form immediately — no extra tap needed.
        onPaste={(event) => {
          const pasted = event.clipboardData.getData('text');
          if (pasted) {
            event.preventDefault();
            read(pasted);
          }
        }}
        rows={text ? 5 : 7}
        placeholder={'নাম: …\nমোবাইল নম্বর( English): …\nঠিকানা: …\nথানা: …\nপন্যের নাম/রঙ: …'}
        className="w-full rounded-xl border-0 bg-brand-50/60 px-3 py-2.5 font-mono text-sm text-gray-800 ring-1 ring-brand-100 placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:outline-none"
      />
      {clipboardError && (
        <p className="mt-2 text-xs text-gray-500">Couldn’t read the clipboard — long-press the box above and choose Paste.</p>
      )}
      {text.trim() && (
        <Button variant="ghost" className="mt-2" icon={<Wand2 className="size-4" />} onClick={() => onRead(text)}>
          Read again after editing
        </Button>
      )}
    </Card>
  );
}
