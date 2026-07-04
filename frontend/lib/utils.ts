import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type PickerInput = HTMLInputElement & { showPicker?: () => void }

/** Focus and open the native date/time picker when the browser allows it (never throws). */
export function focusAndShowPicker(input: PickerInput | null | undefined): void {
  if (!input) return
  input.focus()
  try {
    input.showPicker?.()
  } catch {
    // NotAllowedError: some browsers require a stricter gesture chain; month/datetime support varies
  }
}
