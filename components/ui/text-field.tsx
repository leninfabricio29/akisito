import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

import { AppText } from './text';

type Props = TextInputProps & {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  hint?: string;
  secure?: boolean;
  right?: React.ReactNode;
};

export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, icon, error, hint, secure, right, style, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(Boolean(secure));
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={styles.wrapper}>
      {label && (
        <AppText variant="caption" color="textSecondary" style={styles.label}>
          {label}
        </AppText>
      )}
      <View style={[styles.field, { borderColor }, focused && styles.focused]}>
        {icon && <Ionicons name={icon} size={18} color={focused ? colors.primary : colors.textMuted} />}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={hidden}
          autoCapitalize={secure ? 'none' : rest.autoCapitalize}
          style={[styles.input, style]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {secure && (
          <Pressable
            onPress={() => setHidden((v) => !v)}
            hitSlop={8}
            accessibilityLabel={hidden ? 'Mostrar contraseña' : 'Ocultar contraseña'}
          >
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={18} color={colors.textMuted} />
          </Pressable>
        )}
        {right}
      </View>
      {(error || hint) && (
        <AppText variant="caption" color={error ? 'danger' : 'textMuted'} style={styles.helper}>
          {error || hint}
        </AppText>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { marginBottom: spacing.xs, marginLeft: spacing.xxs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 50,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  focused: { backgroundColor: colors.primarySoft },
  input: { flex: 1, color: colors.text, fontSize: typography.body.fontSize, paddingVertical: 0 },
  helper: { marginTop: spacing.xs, marginLeft: spacing.xxs },
});
