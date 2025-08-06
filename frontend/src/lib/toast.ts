import { Toast } from '@/../wailsjs/go/main/App';
import { toast as sonnerToast } from 'sonner';
import { types } from '@/../wailsjs/go/models';

export default function toast(toastConfig: types.ToastConfig) {
  if (__DESKTOP__) {
    return Toast(toastConfig);
  }

  const options = {
    description: toastConfig.title,
    duration: 5000,
    position: 'top-center' as const,
    action: {
      label: 'Dismiss',
      onClick: () => sonnerToast.dismiss(),
    },
  };

  switch (toastConfig.type) {
    case 'success':
      sonnerToast.success(toastConfig.message, options);
      break;
    case 'error':
      sonnerToast.error(toastConfig.message, options);
      break;
    case 'warning':
      sonnerToast.warning(toastConfig.message, options);
      break;
    case 'info':
      sonnerToast.info(toastConfig.message, options);
      break;
    default:
      sonnerToast(toastConfig.message, options);
      break;
  }
}
