import {useLocale, useTranslations} from 'next-intl';
import {routing} from '@/i18n/routing';
import LanguageSwitcherSelect from './LanguageSwitcherSelect';

export default function LanguageSwitcher() {
  const t = useTranslations('LocaleSwitcher');
  const locale = useLocale();

  return (
    <LanguageSwitcherSelect defaultValue={locale} label={t('label')}>
      {routing.locales.map((cur) => (
        <option key={cur} value={cur}>
          {t('locale', {locale: cur})}
        </option>
      ))}
    </LanguageSwitcherSelect>
  );
}