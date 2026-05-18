import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { AuthScreenLayout } from "@/src/components/auth/AuthScreenLayout";
import { useAuth } from "@/src/context/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { login, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/(tabs)" as any);
    }
  }, [loading, user, router]);

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      await login({ email, password });
      router.replace("/(tabs)" as any);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Giriş başarısız");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <AuthScreenLayout
      title="Giriş yap"
      subtitle="Hesabına giriş yap ve rotalarını kaydet."
      fields={[
        {
          id: "email",
          label: "E-posta",
          value: email,
          onChangeText: setEmail,
          keyboardType: "email-address",
          autoComplete: "email",
        },
        {
          id: "password",
          label: "Şifre",
          value: password,
          onChangeText: setPassword,
          secureTextEntry: true,
          autoComplete: "password",
        },
      ]}
      submitLabel="Giriş yap"
      submitting={submitting}
      disabled={!email || !password}
      error={error}
      onSubmit={handleSubmit}
      footerText="Hesabın yok mu?"
      footerLinkText="Kayıt ol"
      footerHref="/register"
    />
  );
}
