import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const C = {
  brand: '#b82a5e',
  brandDark: '#8a1f46',
  brandLight: '#d73a70',
  text: '#1a0f15',
  textSub: '#6b5560',
};

interface HeaderModalProps {
  title: string;
  subtitle: string;
  onClose: () => void;
}

export function HeaderModal({ title, subtitle, onClose }: HeaderModalProps) {
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
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>{title}</Text>
          <Text style={s.headerSub}>{subtitle}</Text>
        </View>

        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={20} color={C.textSub} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
        </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -40,
    right: -20,
  },
  circle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: -30,
    left: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: 'white',
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: 'white',
    fontFamily: 'semibold',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});
