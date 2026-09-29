import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, StyleSheet, View } from 'react-native';

import type { Banner } from '@/services';
import { colors, radius } from '@/theme';

type Props = { banners: Banner[]; width: number; onPress: (banner: Banner) => void };

const AUTO_PLAY_MS = 5000;

export function BannerCarousel({ banners, width, onPress }: Props) {
  const listRef = useRef<FlatList<Banner>>(null);
  const [index, setIndex] = useState(0);
  const height = Math.round(width * 0.42);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => {
      const next = (index + 1) % banners.length;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setIndex(next);
    }, AUTO_PLAY_MS);
    return () => clearInterval(timer);
  }, [banners.length, index]);

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  if (!banners.length) return null;

  return (
    <View>
      <FlatList
        ref={listRef}
        data={banners}
        keyExtractor={(b) => String(b.id)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onPress(item)}
            accessibilityRole="imagebutton"
            accessibilityLabel={item.title || 'Publicidad'}
            style={{ width, height }}
          >
            <Image source={{ uri: item.image }} style={[styles.image, { height }]} contentFit="cover" transition={200} />
          </Pressable>
        )}
      />
      {banners.length > 1 && (
        <View style={styles.dots}>
          {banners.map((b, i) => (
            <View key={b.id} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', borderRadius: radius.lg, backgroundColor: colors.surfaceMuted },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { width: 18, backgroundColor: colors.primary },
});
