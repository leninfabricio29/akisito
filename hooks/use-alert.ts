import { AlertConfig } from '@/components/ui/alert';
import { useCallback, useState } from 'react';

interface UseAlertReturn {
  visibleConfig: boolean;
  config: AlertConfig;
  show: (config: Omit<AlertConfig, 'onDismiss'>) => void;
  hide: () => void;
  success: (title: string, message: string, buttons?: AlertConfig['buttons']) => void;
  error: (title: string, message: string, buttons?: AlertConfig['buttons']) => void;
  info: (title: string, message: string, buttons?: AlertConfig['buttons']) => void;
  confirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => void;
}

const defaultConfig: AlertConfig = {
  type: 'info',
  title: '',
  message: '',
  buttons: [{ text: 'OK' }],
};

export const useAlert = (): UseAlertReturn => {
  const [visibleConfig, setVisibleConfig] = useState(false);
  const [config, setConfig] = useState<AlertConfig>(defaultConfig);

  const hide = useCallback(() => {
    setVisibleConfig(false);
  }, []);

  const show = useCallback((newConfig: Omit<AlertConfig, 'onDismiss'>) => {
    setConfig({
      ...newConfig,
      onDismiss: hide,
    });
    setVisibleConfig(true);
  }, [hide]);

  const success = useCallback(
    (title: string, message: string, buttons?: AlertConfig['buttons']) => {
      show({
        type: 'success',
        title,
        message,
        buttons: buttons || [{ text: 'OK' }],
      });
    },
    [show]
  );

  const error = useCallback(
    (title: string, message: string, buttons?: AlertConfig['buttons']) => {
      show({
        type: 'error',
        title,
        message,
        buttons: buttons || [{ text: 'OK' }],
      });
    },
    [show]
  );

  const info = useCallback(
    (title: string, message: string, buttons?: AlertConfig['buttons']) => {
      show({
        type: 'info',
        title,
        message,
        buttons: buttons || [{ text: 'OK' }],
      });
    },
    [show]
  );

  const confirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      onCancel?: () => void
    ) => {
      show({
        type: 'confirm',
        title,
        message,
        buttons: [
          {
            text: 'Cancelar',
            onPress: onCancel,
            style: 'cancel',
          },
          {
            text: 'Continuar',
            onPress: onConfirm,
            style: 'default',
          },
        ],
      });
    },
    [show]
  );

  return {
    visibleConfig,
    config,
    show,
    hide,
    success,
    error,
    info,
    confirm,
  };
};
