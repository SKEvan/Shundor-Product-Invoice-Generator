import { Download, FileImage, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { ExportKind } from '@/hooks/useInvoiceExport';
import { formatMoney } from '@/utils/format';
import { canShareFiles } from '@/utils/invoiceExport';

interface ExportBarProps {
  amountDue: number;
  busy: ExportKind | null;
  onExport: (kind: ExportKind) => void;
}

const shareSupported = canShareFiles();

/** Amount due + the download/share buttons. */
export function ExportBar({ amountDue, busy, onExport }: ExportBarProps) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-xs font-medium text-gray-500">Amount due (cash on delivery)</span>
        <span className="text-lg font-bold text-brand-700">{formatMoney(amountDue)}</span>
      </div>
      <div className={`grid gap-2 ${shareSupported ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <Button
          icon={<Download className="size-4" />}
          loading={busy === 'pdf'}
          disabled={busy !== null}
          onClick={() => onExport('pdf')}
        >
          PDF
        </Button>
        <Button
          variant="secondary"
          icon={<FileImage className="size-4" />}
          loading={busy === 'jpg'}
          disabled={busy !== null}
          onClick={() => onExport('jpg')}
        >
          JPG
        </Button>
        {shareSupported && (
          <Button
            variant="secondary"
            icon={<Share2 className="size-4" />}
            loading={busy === 'share'}
            disabled={busy !== null}
            onClick={() => onExport('share')}
          >
            Share
          </Button>
        )}
      </div>
    </div>
  );
}
