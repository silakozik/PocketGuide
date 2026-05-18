import { Link } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/Themed";
import { presets } from "@/src/theme/presets";
import { theme } from "@/src/theme/tokens";

type Field = {
  id: string;
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "words";
  autoComplete?: "email" | "password" | "username" | "password-new";
};

type Props = {
  title: string;
  subtitle: string;
  fields: Field[];
  submitLabel: string;
  submitting: boolean;
  disabled: boolean;
  error: string;
  onSubmit: () => void;
  footerText: string;
  footerLinkText: string;
  footerHref: string;
};

export function AuthScreenLayout({
  title,
  subtitle,
  fields,
  submitLabel,
  submitting,
  disabled,
  error,
  onSubmit,
  footerText,
  footerLinkText,
  footerHref,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <Text style={styles.brandName}>PocketGuide</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.form}>
          {fields.map((field) => (
            <View key={field.id} style={styles.field}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                style={styles.input}
                value={field.value}
                onChangeText={field.onChangeText}
                secureTextEntry={field.secureTextEntry}
                keyboardType={field.keyboardType ?? "default"}
                autoCapitalize={field.autoCapitalize ?? "none"}
                autoComplete={field.autoComplete}
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>
          ))}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [
              styles.submit,
              disabled ? styles.submitDisabled : null,
              pressed && !disabled ? { opacity: 0.9 } : null,
            ]}
            onPress={onSubmit}
            disabled={disabled || submitting}
          >
            <Text style={styles.submitText}>
              {submitting ? "…" : submitLabel}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>
          {footerText}{" "}
          <Link href={footerHref as any} style={styles.footerLink}>
            {footerLinkText}
          </Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.md,
    justifyContent: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: theme.spacing.lg,
  },
  brandDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: theme.colors.accent,
  },
  brandName: {
    fontFamily: theme.typography.fontFamilySerif,
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  title: {
    fontFamily: theme.typography.fontFamilySerif,
    fontSize: theme.typography.h1.fontSize,
    lineHeight: theme.typography.h1.lineHeight,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamilySans,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  form: { gap: theme.spacing.sm },
  field: { gap: 6 },
  label: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
  },
  error: {
    color: "#b42318",
    fontSize: theme.typography.caption.fontSize,
    fontWeight: "600",
  },
  submit: {
    ...presets.primaryButton,
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.accent,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: {
    ...presets.primaryButtonText,
    color: theme.colors.textPrimary,
  },
  footer: {
    marginTop: theme.spacing.lg,
    textAlign: "center",
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
  },
  footerLink: {
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
});
