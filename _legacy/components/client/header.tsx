import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type HeaderClientProps = {
  title: string;
  subtitle: string;
  backButtonProps?: TouchableOpacityProps;
};

const C = {
  white: '#ffffff',
  brand: '#b52b5e',
  brandDark: '#8a1f46',
  brandLight: '#cf4f7b',
};

export function HeaderFirstComponent({
  title,
  subtitle,
  backButtonProps,
}: HeaderClientProps) {
  const shouldShowBackButton = Boolean(backButtonProps);
  const { onPress, style, ...restBackButtonProps } = backButtonProps ?? {};

  return (
        <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }} >
      <LinearGradient
        colors={[C.brandDark, C.brand, C.brandLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.header}
      >
        <View style={s.circle1} />
        <View style={s.circle2} />

        <View style={s.headerTop}>
          {shouldShowBackButton ? (
            <TouchableOpacity
              style={[s.backBtn, style]}
              onPress={onPress ?? (() => router.back())}
              {...restBackButtonProps}
            >
              <Ionicons name="chevron-back" size={20} color={C.white} />
            </TouchableOpacity>
          ) : null}

          <Text style={s.headerTitle}>{title}</Text>

          {shouldShowBackButton ? <View style={s.backBtnSpacer} /> : null}
        </View>

        <Text style={s.headerSub}>{subtitle}</Text>
      </LinearGradient>
    </SafeAreaView>
  );
}

export default HeaderFirstComponent;

const s = StyleSheet.create({
  
  header: {
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingTop: 10, // reducido (antes 16)
    paddingBottom: 18,
    marginBottom: 14,
  },
  circle1: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  circle2: {
    position: 'absolute',
    bottom: -80,
    left: -50,
    width: 170,
    height: 170,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnSpacer: {
    width: 36,
    height: 36,
  },
  headerTitle: {
    flex: 1,
    color: C.white,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
});