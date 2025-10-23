// scripts/sync-translations.ts
// This script:
// 1. Adds missing keys with [TRANSLATE] placeholder
// 2. Removes extra keys that don't exist in source (en.json)
import fs from 'fs';
import path from 'path';

const MESSAGES_DIR = path.join(process.cwd(), 'messages');
const SOURCE_LANG = 'en';
const TRANSLATE_MARKER = '[TRANSLATE]';

type TranslationObject = { [key: string]: string | TranslationObject };

function setNestedValue(obj: TranslationObject, keyPath: string, value: string): void {
  const keys = keyPath.split('.');
  let current: any = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
}

function deleteNestedKey(obj: TranslationObject, keyPath: string): void {
  const keys = keyPath.split('.');
  let current: any = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key]) {
      return;
    }
    current = current[key];
  }
  
  delete current[keys[keys.length - 1]];
  
  // Clean up empty parent objects
  for (let i = keys.length - 2; i >= 0; i--) {
    let parent: any = obj;
    for (let j = 0; j < i; j++) {
      parent = parent[keys[j]];
    }
    if (Object.keys(parent[keys[i]]).length === 0) {
      delete parent[keys[i]];
    } else {
      break;
    }
  }
}

function getNestedValue(obj: TranslationObject, keyPath: string): string | null {
  const keys = keyPath.split('.');
  let current: any = obj;
  
  for (const key of keys) {
    if (current[key] === undefined) {
      return null;
    }
    current = current[key];
  }
  
  return typeof current === 'string' ? current : null;
}

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

function syncTranslations(): void {
  console.log('🔄 Syncing translations...\n');
  
  const sourceFile = path.join(MESSAGES_DIR, `${SOURCE_LANG}.json`);
  const sourceContent: TranslationObject = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
  const sourceKeys = getAllKeys(sourceContent);

  console.log(`📚 Source (${SOURCE_LANG}): ${sourceKeys.length} keys\n`);

  const files = fs.readdirSync(MESSAGES_DIR)
    .filter(f => f.endsWith('.json') && f !== `${SOURCE_LANG}.json`);

  let totalAdded = 0;
  let totalRemoved = 0;

  files.forEach(file => {
    const lang = file.replace('.json', '');
    const langPath = path.join(MESSAGES_DIR, file);
    const langContent: TranslationObject = JSON.parse(fs.readFileSync(langPath, 'utf8'));
    const langKeys = getAllKeys(langContent);

    const missingKeys = sourceKeys.filter(k => !langKeys.includes(k));
    const extraKeys = langKeys.filter(k => !sourceKeys.includes(k));

    console.log(`🌍 ${lang.toUpperCase()}:`);
    
    // Add missing keys
    if (missingKeys.length > 0) {
      console.log(`   ➕ Adding ${missingKeys.length} missing keys:`);
      
      missingKeys.forEach(key => {
        const sourceValue = getNestedValue(sourceContent, key);
        if (sourceValue) {
          setNestedValue(langContent, key, `${TRANSLATE_MARKER} ${sourceValue}`);
          console.log(`      + ${key}`);
        }
      });
      totalAdded += missingKeys.length;
    }

    // Remove extra keys
    if (extraKeys.length > 0) {
      console.log(`   ➖ Removing ${extraKeys.length} extra keys (deleted from source):`);
      
      extraKeys.forEach(key => {
        deleteNestedKey(langContent, key);
        console.log(`      - ${key}`);
      });
      totalRemoved += extraKeys.length;
    }

    if (missingKeys.length === 0 && extraKeys.length === 0) {
      console.log(`   ✅ Already in sync`);
    } else {
      // Write back with pretty formatting
      fs.writeFileSync(langPath, JSON.stringify(langContent, null, 2) + '\n', 'utf8');
      console.log(`   💾 Updated ${file}`);
    }
    
    console.log('');
  });

  console.log('━'.repeat(50));
  if (totalAdded > 0) {
    console.log(`✅ Added ${totalAdded} keys`);
    console.log(`💡 Search for "${TRANSLATE_MARKER}" to translate them`);
  }
  if (totalRemoved > 0) {
    console.log(`🗑️  Removed ${totalRemoved} obsolete keys`);
  }
  if (totalAdded === 0 && totalRemoved === 0) {
    console.log('✅ All translations are already in sync!');
  }
  console.log('');
}

try {
  syncTranslations();
} catch (error) {
  console.error('❌ Error:', (error as Error).message);
  process.exit(1);
}