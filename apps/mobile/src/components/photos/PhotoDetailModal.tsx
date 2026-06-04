import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/context/AuthContext";
import {
  addPhotoComment,
  getPhotoComments,
  getPhotoDetail,
  likePhoto,
  type PhotoComment,
  type PhotoDetail,
  type TravelPhoto,
} from "@/src/lib/photosApi";
import { theme } from "@/src/theme/tokens";

export type PhotoDetailInitial = Partial<PhotoDetail> &
  Pick<TravelPhoto, "id" | "imageUrl">;

type Props = {
  photoId: string;
  initialPhoto?: PhotoDetailInitial;
  onClose: () => void;
};

function formatPhotoDate(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
    });
  } catch {
    return "";
  }
}

function formatCommentTime(iso: string): string {
  try {
    const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diffMin < 1) return "Az önce";
    if (diffMin < 60) return `${diffMin} dk`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} sa`;
    return new Date(iso).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

export function PhotoDetailModal({ photoId, initialPhoto, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [photo, setPhoto] = useState<PhotoDetail | null>(
    initialPhoto
      ? {
          id: initialPhoto.id,
          imageUrl: initialPhoto.imageUrl,
          caption: initialPhoto.caption ?? null,
          cityName: initialPhoto.cityName ?? null,
          locationName: initialPhoto.locationName ?? null,
          createdAt: initialPhoto.createdAt ?? new Date().toISOString(),
          userId: initialPhoto.userId ?? "",
          userName: initialPhoto.userName ?? "Kullanıcı",
          likeCount: initialPhoto.likeCount ?? 0,
        }
      : null,
  );
  const [comments, setComments] = useState<PhotoComment[]>([]);
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialPhoto);

  useEffect(() => {
    if (initialPhoto?.isPublic === false) return;
    let cancelled = false;
    (async () => {
      try {
        const [detailRes, commentsRes] = await Promise.all([
          getPhotoDetail(photoId).catch(() => null),
          getPhotoComments(photoId).catch(() => ({ data: [] as PhotoComment[] })),
        ]);
        if (cancelled) return;
        if (detailRes?.data) setPhoto(detailRes.data);
        setComments(commentsRes.data ?? []);
      } catch {
        if (!cancelled) setError("Fotoğraf yüklenemedi");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [photoId, initialPhoto?.isPublic]);

  const handleLike = async () => {
    if (!user) {
      setError("Beğenmek için giriş yapmalısın");
      return;
    }
    if (liked) return;
    try {
      const res = await likePhoto(photoId);
      setLiked(true);
      setPhoto((prev) => (prev ? { ...prev, likeCount: res.likeCount } : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Beğeni eklenemedi");
    }
  };

  const handleComment = async () => {
    const text = commentText.trim();
    if (!text || !user) {
      if (!user) setError("Yorum yapmak için giriş yapmalısın");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await addPhotoComment(photoId, text);
      setComments((prev) => [...prev, res.data]);
      setCommentText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yorum eklenemedi");
    } finally {
      setSubmitting(false);
    }
  };

  const locationLabel = [photo?.cityName, photo?.locationName]
    .filter(Boolean)
    .join(" · ");

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Pressable style={styles.close} onPress={onClose} hitSlop={12}>
          <Text style={styles.closeText}>×</Text>
        </Pressable>

        {loading && !photo ? (
          <ActivityIndicator style={styles.loader} color={theme.colors.accent} />
        ) : photo ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
            keyboardShouldPersistTaps="handled"
          >
            <Image source={{ uri: photo.imageUrl }} style={styles.image} resizeMode="contain" />

            <View style={styles.panel}>
              <View style={styles.header}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarLetter}>
                    {(photo.userName?.[0] ?? "?").toUpperCase()}
                  </Text>
                </View>
                <View style={styles.headerInfo}>
                  <Text style={styles.userName}>{photo.userName}</Text>
                  {locationLabel ? (
                    <Text style={styles.location}>{locationLabel}</Text>
                  ) : null}
                </View>
              </View>

              {photo.caption ? (
                <View style={styles.captionRow}>
                  <Text style={styles.captionUser}>{photo.userName} </Text>
                  <Text style={styles.captionBody}>{photo.caption}</Text>
                </View>
              ) : null}

              {comments.map((c) => (
                <View key={c.id} style={styles.comment}>
                  <Text style={styles.commentUser}>{c.userName} </Text>
                  <Text style={styles.commentBody}>{c.body}</Text>
                  <Text style={styles.commentTime}>{formatCommentTime(c.createdAt)}</Text>
                </View>
              ))}

              <View style={styles.meta}>
                {photo.likeCount > 0 ? (
                  <Text style={styles.likes}>
                    {photo.likeCount.toLocaleString("tr-TR")} beğenme
                  </Text>
                ) : null}
                <Text style={styles.date}>{formatPhotoDate(photo.createdAt)}</Text>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>
          </ScrollView>
        ) : (
          <Text style={styles.error}>Fotoğraf yüklenemedi</Text>
        )}

        {photo && initialPhoto?.isPublic !== false ? (
          <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
            <View style={styles.actions}>
              <Pressable onPress={() => void handleLike()}>
                <Text style={styles.actionIcon}>{liked ? "❤️" : "🤍"}</Text>
              </Pressable>
            </View>
            <View style={styles.commentForm}>
              <TextInput
                style={styles.commentInput}
                placeholder={user ? "Yorum ekle..." : "Giriş yap"}
                placeholderTextColor={theme.colors.textMuted}
                value={commentText}
                onChangeText={setCommentText}
                editable={!!user && !submitting}
              />
              <Pressable
                onPress={() => void handleComment()}
                disabled={!user || submitting || !commentText.trim()}
              >
                <Text
                  style={[
                    styles.postBtn,
                    (!user || !commentText.trim()) && styles.postBtnDisabled,
                  ]}
                >
                  Paylaş
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  close: {
    position: "absolute",
    top: 48,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: "#fff", fontSize: 28, lineHeight: 30 },
  loader: { flex: 1, alignSelf: "center" },
  scroll: { flex: 1 },
  image: { width: "100%", height: 360, backgroundColor: "#111" },
  panel: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -16,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  header: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.textPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { color: "#fff", fontWeight: "800" },
  headerInfo: { flex: 1 },
  userName: { fontWeight: "800", fontSize: 15, color: theme.colors.textPrimary },
  location: { fontSize: 12, color: theme.colors.textSecondary },
  captionRow: { flexDirection: "row", flexWrap: "wrap" },
  captionUser: { fontWeight: "800", color: theme.colors.textPrimary },
  captionBody: { color: theme.colors.textPrimary, flex: 1 },
  comment: { marginBottom: 8 },
  commentUser: { fontWeight: "800", color: theme.colors.textPrimary },
  commentBody: { color: theme.colors.textPrimary },
  commentTime: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },
  meta: { marginTop: theme.spacing.sm, gap: 4 },
  likes: { fontWeight: "800", fontSize: 14, color: theme.colors.textPrimary },
  date: { fontSize: 11, color: theme.colors.textMuted, textTransform: "uppercase" },
  error: { color: theme.colors.danger, fontSize: 13 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  actions: { flexDirection: "row", marginBottom: theme.spacing.xs },
  actionIcon: { fontSize: 26 },
  commentForm: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  postBtn: { fontWeight: "800", color: theme.colors.accent, fontSize: 14 },
  postBtnDisabled: { opacity: 0.4 },
});
