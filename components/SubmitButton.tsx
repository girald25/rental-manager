'use client'

import { useFormStatus } from 'react-dom'

interface SubmitButtonProps {
  label: string
  pendingLabel?: string
  className?: string
}

export default function SubmitButton({ label, pendingLabel, className }: SubmitButtonProps) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        'px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
      }
    >
      {pending ? (pendingLabel ?? 'Saving…') : label}
    </button>
  )
}
