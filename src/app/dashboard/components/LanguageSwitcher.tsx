'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { Button } from '@mui/material';
import { routing } from '@/i18n/routing';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: 'en' | 'km') => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div>
      <Button
        variant={locale === 'en' ? 'contained' : 'outlined'}
        onClick={() => handleLanguageChange('en')}
      >
        🇺🇸 English
      </Button>
      <Button
        variant={locale === 'km' ? 'contained' : 'outlined'}
        onClick={() => handleLanguageChange('km')}
      >
        🇰🇭 ខ្មែរ
      </Button>
    </div>
  );
}