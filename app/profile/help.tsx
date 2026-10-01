import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, StackHeader } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { colors, radius, SCREEN_PADDING, spacing } from '@/theme';

const SUPPORT_NUMBER = '999069254';

const CLIENT_FAQS = [
  {
    q: '¿Cómo gano puntos?',
    a: 'Al llegar a un negocio aliado toca el botón central "Escanear" y apunta al código QR del local. Confirmamos tu ubicación y sumas puntos al instante.',
  },
  {
    q: '¿Por qué me pide la ubicación?',
    a: 'Para comprobar que estás en el negocio. Solo la usamos en el momento de escanear; no rastreamos tu ubicación.',
  },
  {
    q: '¿Cada cuánto puedo sumar puntos en el mismo negocio?',
    a: 'Puedes registrar una visita con puntos cada pocas horas en cada negocio. Si escaneas antes, la app te dirá desde qué hora puedes volver a sumar.',
  },
  {
    q: '¿Cómo gano puntos por reseñas?',
    a: 'Después de escanear te invitamos a dejar una reseña (tienes 48 horas; también puedes hacerlo desde Perfil > Historial de visitas). Los puntos no dependen de la calificación que pongas.',
  },
  {
    q: '¿Mis puntos sirven en cualquier negocio?',
    a: 'No. Los puntos son de cada negocio: los que ganas en una cafetería se canjean por premios de esa misma cafetería.',
  },
  {
    q: '¿Cómo canjeo un premio?',
    a: 'En Premios toca "Canjear". Te damos un código que debes mostrar en caja. Si no lo usas antes de que venza, te devolvemos los puntos automáticamente.',
  },
];

const BUSINESS_FAQS = [
  {
    q: '¿Cómo empiezan mis clientes a sumar puntos?',
    a: 'Cuando aprobemos tu negocio, imprime tu QR desde Mi negocio > Mi código QR y colócalo en caja. Tus clientes lo escanean al llegar y suman puntos automáticamente.',
  },
  {
    q: '¿Cómo evito que alguien sume puntos sin venir?',
    a: 'La app confirma la ubicación del cliente al escanear: solo suma si está dentro del radio de tu local. Además cada cliente puede sumar una vez cada pocas horas. Si crees que tu QR fue copiado, regéneralo.',
  },
  {
    q: '¿Cómo entrego una recompensa?',
    a: 'El cliente te muestra un código de 8 caracteres. Toca el botón central "Validar", escríbelo, revisa qué premio es y confirma la entrega.',
  },
  {
    q: '¿Qué pasa si el cliente no usa su código?',
    a: 'El código vence y los puntos vuelven automáticamente a su monedero. No tienes que hacer nada.',
  },
  {
    q: '¿Puedo cambiar cuántos puntos doy?',
    a: 'Sí. En Mi negocio > Perfil del negocio > Programa de puntos puedes definir los puntos por visita, por reseña y el radio para escanear.',
  },
  {
    q: '¿Cómo recupero clientes que dejaron de venir?',
    a: 'En Clientes filtra "En riesgo" o "Inactivos". Akisito además les envía un recordatorio automático cuando pasan varios días sin visitarte.',
  },
];

export default function HelpScreen() {
  const { isBusiness } = useAuth();
  const FAQS = isBusiness ? BUSINESS_FAQS : CLIENT_FAQS;
  const [open, setOpen] = useState<number | null>(0);

  return (
    <View style={styles.root}>
      <StackHeader title="Ayuda" subtitle="Preguntas frecuentes" />
      <ScrollView contentContainerStyle={{ padding: SCREEN_PADDING, gap: spacing.sm, paddingBottom: spacing.xxxl }}>
        {FAQS.map((item, i) => {
          const expanded = open === i;
          return (
            <Card key={item.q} padded={false}>
              <Pressable
                onPress={() => setOpen(expanded ? null : i)}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                style={styles.question}
              >
                <AppText variant="title" style={{ flex: 1 }}>
                  {item.q}
                </AppText>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
              </Pressable>
              {expanded && (
                <AppText color="textSecondary" style={styles.answer}>
                  {item.a}
                </AppText>
              )}
            </Card>
          );
        })}

        <View style={styles.contact}>
          <Ionicons name="chatbubbles-outline" size={28} color={colors.primary} />
          <AppText variant="title" align="center">
            ¿Necesitas más ayuda?
          </AppText>
          <AppText color="textSecondary" align="center">
            Escríbenos y te respondemos lo antes posible.
          </AppText>
          <Button
            title="Contactar soporte"
            icon="mail-outline"
            variant="secondary"
            onPress={() => Linking.openURL(`whatsapp://send?phone=+593${SUPPORT_NUMBER}`)}
            style={{ marginTop: spacing.sm }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  question: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  answer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  contact: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
  },
});
