import { Toast } from '@/../wailsjs/go/main/App';
import { toast as sonnerToast } from 'sonner';
import { types } from '@/../wailsjs/go/models';

export default function toast(toastConfig: types.ToastConfig) {
  if (__DESKTOP__) {
    return Toast(toastConfig);
  }
  sonnerToast(toastConfig.message, {
    description: toastConfig.title,
    // variant: toastConfig.type,
    duration: 5000,
    position: 'top-center',
    action: {
      label: 'Dismiss',
      onClick: () => sonnerToast.dismiss(),
    },
  });
}
