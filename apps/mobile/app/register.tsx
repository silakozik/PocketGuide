import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { AuthScreenLayout } from "@/src/components/auth/AuthScreenLayout";
import { useAuth } from "@/src/context/AuthContext";

export default function RegisterScreen() {
  const router = useRouter();
  const { register, user, loading } = useAuth();
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/onboarding" as any);
    }
  }, [loading, user, router]);

  const handleSubmit = async () => {
    setError("");
    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor");
      return;
    }
    setSubmitting(true);
    try {
      await register({ email, password, userName });
      router.replace("/onboarding" as any);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kayıt başarısız");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <AuthScreenLayout
      title="Kayıt ol"
      subtitle="Ücretsiz hesap oluştur; ilgi alanlarına göre öneriler al."
      fields={[
        {
          id: "userName",
          label: "Kullanıcı adı",
          value: userName,
          onChangeText: setUserName,
          autoCapitalize: "none",
          autoComplete: "username",
        },
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
          autoComplete: "password-new",
        },
        {
          id: "confirm",
          label: "Şifre (tekrar)",
          value: confirmPassword,
          onChangeText: setConfirmPassword,
          secureTextEntry: true,
          autoComplete: "password-new",
        },
      ]}
      submitLabel="Kayıt ol"
      submitting={submitting}
      disabled={!email || !userName || !password || !confirmPassword}
      error={error}
      onSubmit={handleSubmit}
      footerText="Zaten hesabın var mı?"
      footerLinkText="Giriş yap"
      footerHref="/login"
    />
  );
}
