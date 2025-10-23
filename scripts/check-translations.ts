import fs from 'fs';
import path from 'path';

const MESSAGES_DIR = path.join(process.cwd(), 'messages');
const SOURCE_LANG = 'en';

type TranslationObject = { [key: string]: string | TranslationObject };

function getAllKeys(obj: TranslationObject, prefix = ''): string[] {
  let keys: string[] = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getAllKeys(obj[key] as TranslationObject, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

function validateTranslations(): void {
  console.log('🔍 Checking translations...\n');
  
  const sourceFile = path.join(MESSAGES_DIR, `${SOURCE_LANG}.json`);
  const sourceContent: TranslationObject = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
  const sourceKeys = getAllKeys(sourceContent);

  console.log(`📚 Source (${SOURCE_LANG}): ${sourceKeys.length} keys\n`);

  const files = fs.readdirSync(MESSAGES_DIR)
    .filter(f => f.endsWith('.json') && f !== `${SOURCE_LANG}.json`);

  let hasErrors = false;

  files.forEach(file => {
    const lang = file.replace('.json', '');
    const langPath = path.join(MESSAGES_DIR, file);
    const langContent: TranslationObject = JSON.parse(fs.readFileSync(langPath, 'utf8'));
    const langKeys = getAllKeys(langContent);

    const missingKeys = sourceKeys.filter(k => !langKeys.includes(k));
    const extraKeys = langKeys.filter(k => !sourceKeys.includes(k));
    const completion = Math.round((langKeys.length / sourceKeys.length) * 100);

    console.log(`🌍 ${lang.toUpperCase()}: ${completion}% complete (${langKeys.length}/${sourceKeys.length} keys)`);
    
    if (missingKeys.length > 0) {
      hasErrors = true;
      console.log(`   ❌ Missing ${missingKeys.length} keys:`);
      missingKeys.forEach(k => console.log(`      - ${k}`));
    }

    if (extraKeys.length > 0) {
      hasErrors = true;
      console.log(`   ⚠️  Extra ${extraKeys.length} keys (not in source):`);
      extraKeys.forEach(k => console.log(`      - ${k}`));
    }

    if (missingKeys.length === 0 && extraKeys.length === 0) {
      console.log(`   ✅ Perfect match!`);
    }
    
    console.log('');
  });

  if (hasErrors) {
    console.log('❌ Translation validation failed!\n');
    console.log('💡 Tip: Update missing translations in your JSON files');
    process.exit(1);
  } else {
    console.log('✅ All translations are in sync!\n');
  }
}

try {
  validateTranslations();
} catch (error) {
  console.error('❌ Error:', (error as Error).message);
  process.exit(1);
}