import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export interface ConfirmRequest {
  title: string
  description: string
  confirmLabel?: string
  destructive?: boolean
  onConfirm: () => void
}

export function ConfirmDialog({
  request,
  onClose,
}: {
  request: ConfirmRequest | null
  onClose: () => void
}) {
  return (
    <Dialog open={request !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{request?.title}</DialogTitle>
          <DialogDescription>{request?.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={request?.destructive ? 'destructive' : 'default'}
            size="sm"
            onClick={() => {
              request?.onConfirm()
              onClose()
            }}
          >
            {request?.confirmLabel ?? 'Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
