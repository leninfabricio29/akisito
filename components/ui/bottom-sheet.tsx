import { Keyboard, Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKeyboardHeight } from '@/hooks/use-keyboard-height';
import { colors, radius, spacing } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

/**
 * Hoja inferior modal que se mantiene sobre el teclado.
 * Tocar el fondo con el teclado abierto solo lo oculta; con el teclado cerrado, cierra la hoja.
 */
export function BottomSheet({ visible, onClose, children }: Props) {
  const keyboard = useKeyboardHeight();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const onBackdrop = () => (keyboard > 0 ? Keyboard.dismiss() : onClose());

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.overlay, { paddingBottom: keyboard }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onBackdrop} accessibilityLabel="Cerrar" />
        <View style={[styles.sheet, { maxHeight: height - keyboard - insets.top - spacing.xl }]}>
          <View style={styles.handle} />
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: (keyboard ? spacing.lg : insets.bottom + spacing.xl) }}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
});
