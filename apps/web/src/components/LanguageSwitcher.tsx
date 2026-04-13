import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '@pocketguide/i18n';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="language-switcher" style={{ display: 'flex', gap: '8px' }}>
      {SUPPORTED_LANGUAGES.map((lang) => (
        <button
          key={lang}
          onClick={() => changeLanguage(lang)}
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            background: i18n.language === lang ? 'var(--primary)' : 'transparent',
            color: i18n.language === lang ? 'white' : 'inherit',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase'
          }}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
