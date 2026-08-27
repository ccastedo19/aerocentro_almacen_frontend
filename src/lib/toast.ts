import { toast } from "@/components/ui/toast"

export function toastExito(title: string, description?: string) {
  toast.add({
    type: "success",
    title,
    description,
    timeout: 3000,
  })
}
