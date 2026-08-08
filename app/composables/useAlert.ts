interface AlertOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
}

interface AlertState extends AlertOptions {
  open: boolean
  resolve: ((value: boolean) => void) | null
}

const alertState = ref<AlertState | null>(null)

export function useAlert() {
  function alert(options: AlertOptions): Promise<boolean> {
    return new Promise((resolve) => {
      alertState.value = {
        ...options,
        open: true,
        resolve,
      }
    })
  }

  function confirm(title: string, description: string, options?: Partial<AlertOptions>): Promise<boolean> {
    return alert({
      title,
      description,
      confirmText: options?.confirmText ?? 'Confirm',
      cancelText: options?.cancelText ?? 'Cancel',
      variant: options?.variant ?? 'default',
    })
  }

  function destructive(title: string, description: string, options?: Partial<AlertOptions>): Promise<boolean> {
    return alert({
      title,
      description,
      confirmText: options?.confirmText ?? 'Delete',
      cancelText: options?.cancelText ?? 'Cancel',
      variant: 'danger',
    })
  }
  function notify(description: string, title = 'Notice'): Promise<boolean> {
    return alert({
      title,
      description,
      confirmText: 'OK',
      cancelText: '',
    })
  }

  function handleConfirm() {
    if (alertState.value?.resolve) {
      alertState.value.resolve(true)
    }
    alertState.value = null
  }

  function handleCancel() {
    if (alertState.value?.resolve) {
      alertState.value.resolve(false)
    }
    alertState.value = null
  }

  return {
    alertState,
    alert,
    notify,
    confirm,
    destructive,
    handleConfirm,
    handleCancel,
  }
}
