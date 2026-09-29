import { Image } from 'expo-image';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors } from '@/theme';

import { AppText } from './text';

type Props = {
  uri?: string | null;
  name?: string;
  size?: number;
  rounded?: 'full' | 'md';
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function initialsOf(name = ''): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

export function Avatar({ uri, name, size = 44, rounded = 'full', borderColor, style }: Props) {
  const borderRadius = rounded === 'full' ? size / 2 : size * 0.28;
  const frame = [
    styles.frame,
    { width: size, height: size, borderRadius },
    borderColor ? { borderWidth: 3, borderColor } : null,
    style,
  ];

  return (
    <View style={frame}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      ) : (
        <AppText style={{ fontSize: size * 0.38, fontWeight: '700', color: colors.primary }}>{initialsOf(name)}</AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
