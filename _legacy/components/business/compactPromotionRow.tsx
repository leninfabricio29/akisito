import { PromotionItem } from "@/services/promotion-service";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const C = {
  brand: "#b82a5e",
  brandDark: "#8a1f46",
  brandFaint: "rgba(184,42,94,0.07)",
  brandBorder: "rgba(184,42,94,0.22)",
  borderLight: "rgba(184,42,94,0.12)",
  bg: "#ffffff",
  surfaceGray: "#f7f2f5",
  surfaceBorder: "#ede5ea",
  white: "#ffffff",
  muted: "#9b8492",
  mutedLight: "#c5b5be",
  text: "#1a0f15",
  textSub: "#6b5560",
  green: "#2da06e",
  greenFaint: "rgba(45,160,110,0.08)",
  greenBorder: "rgba(45,160,110,0.25)",
  error: "#e53e3e",
};

interface CompactPromotionRowProps {
  promo: PromotionItem;
  onEdit: (promo: PromotionItem) => Promise<void> | void;
  onDeactivate: (promotionId: string) => void;
  onReactivate: (promotionId: string) => void;
  statusUpdating: boolean;
}

const statusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    active: "Activa",
    inactive: "Inactiva",
    expired: "Expirada",
  };
  return labels[status] || status;
};

const statusStyle = (
  status: string
): { backgroundColor: string; color: string; borderColor: string } => {
  switch (status) {
    case "active":
      return { backgroundColor: "rgba(45,160,110,0.1)", color: C.green, borderColor: "rgba(45,160,110,0.3)" };
    case "inactive":
      return { backgroundColor: "rgba(177,177,177,0.1)", color: "#b1b1b1", borderColor: "rgba(177,177,177,0.3)" };
    case "expired":
      return {
        backgroundColor: "rgba(183,101,101,0.1)",
        color: "#b76565",
        borderColor: "rgba(183,101,101,0.3)",
      };
    default:
      return { backgroundColor: C.surfaceGray, color: C.muted, borderColor: C.surfaceBorder };
  }
};

export function CompactPromotionRow({
  promo,
  onEdit,
  onDeactivate,
  onReactivate,
  statusUpdating,
}: CompactPromotionRowProps) {
  const badge = statusStyle(promo.status);

  return (
    <View style={s.container}>
      {promo.image && (
        <Image source={{ uri: promo.image }} style={s.thumbnail} contentFit="cover" />
      )}
      <TouchableOpacity style={s.content} onPress={() => onEdit(promo)} activeOpacity={0.7}>
        <View style={s.titleSection}>
          <Text style={s.title} numberOfLines={1}>
            {promo.title}
          </Text>
          <View style={[s.statusBadge, { backgroundColor: badge.backgroundColor, borderColor: badge.borderColor }]}>
            <Text style={[s.statusText, { color: badge.color }]}>{statusLabel(promo.status)}</Text>
          </View>
        </View>

        <View style={s.infoSection}>
          <View style={s.pointsBadge}>
            <Ionicons name="flame" size={12} color={C.brand} />
            <Text style={s.pointsText}>{promo.points_required}</Text>
          </View>
          <Text style={s.meta}>{promo.max_claims_per_user} máx/usr</Text>
        </View>
      </TouchableOpacity>

      <View style={s.actions}>
        {promo.status === "active" ? (
          <TouchableOpacity
            style={s.actionBtn}
            onPress={() => onDeactivate(promo._id)}
            disabled={statusUpdating}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {statusUpdating ? (
              <ActivityIndicator size="small" color={C.error} />
            ) : (
              <Ionicons name="ban-outline" size={18} color={C.error} />
            )}
          </TouchableOpacity>
        ) : promo.status === "inactive" ? (
          <TouchableOpacity
            style={s.actionBtn}
            onPress={() => onReactivate(promo._id)}
            disabled={statusUpdating}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {statusUpdating ? (
              <ActivityIndicator size="small" color={C.green} />
            ) : (
              <Ionicons name="refresh-outline" size={18} color={C.green} />
            )}
          </TouchableOpacity>
        ) : (
          <View style={s.actionBtn}>
            <Ionicons name="checkmark-circle" size={18} color={C.muted} />
          </View>
        )}

        <TouchableOpacity
          style={s.editBtn}
          onPress={() => onEdit(promo)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="create-outline" size={18} color={C.brand} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.borderLight,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
    gap: 10,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: C.surfaceGray,
  },
  content: {
    flex: 1,
    gap: 8,
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flex: 1,
    fontWeight: "700",
    fontSize: 14,
    color: C.text,
  },
  statusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  infoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.brandFaint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pointsText: {
    color: C.brand,
    fontWeight: "700",
    fontSize: 12,
  },
  meta: {
    fontSize: 11,
    color: C.muted,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.brandFaint,
  },
});


