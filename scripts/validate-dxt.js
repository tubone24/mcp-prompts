#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * DXT検証スクリプト
 * manifest.json と metadata.json の構造と内容を検証する
 */
async function validateDXT() {
  console.log('🔍 Validating DXT configuration...');
  
  const manifestPath = path.join(projectRoot, 'manifest.json');
  const metadataPath = path.join(projectRoot, 'metadata.json');
  
  let hasErrors = false;
  
  // manifest.json の検証
  console.log('\n📄 Validating manifest.json...');
  if (!fs.existsSync(manifestPath)) {
    console.error('❌ manifest.json not found');
    hasErrors = true;
  } else {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      hasErrors = validateManifest(manifest) || hasErrors;
    } catch (error) {
      console.error('❌ manifest.json is not valid JSON:', error.message);
      hasErrors = true;
    }
  }
  
  // metadata.json の検証
  console.log('\n📄 Validating metadata.json...');
  if (!fs.existsSync(metadataPath)) {
    console.error('❌ metadata.json not found');
    hasErrors = true;
  } else {
    try {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      hasErrors = validateMetadata(metadata) || hasErrors;
    } catch (error) {
      console.error('❌ metadata.json is not valid JSON:', error.message);
      hasErrors = true;
    }
  }
  
  // 必要なファイルの存在確認
  console.log('\n📁 Checking required files...');
  const requiredFiles = [
    'src/server.ts',
    'package.json',
    'tsconfig.json'
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(projectRoot, file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Required file missing: ${file}`);
      hasErrors = true;
    } else {
      console.log(`✅ ${file}`);
    }
  }
  
  // templatesディレクトリの確認
  const templatesDir = path.join(projectRoot, 'templates');
  if (!fs.existsSync(templatesDir)) {
    console.warn('⚠️ templates directory not found');
  } else {
    const templates = fs.readdirSync(templatesDir);
    console.log(`✅ Found ${templates.length} template(s)`);
  }
  
  if (hasErrors) {
    console.log('\n❌ DXT validation failed. Please fix the errors above.');
    process.exit(1);
  } else {
    console.log('\n✅ DXT validation passed! Ready to build.');
  }
}

/**
 * manifest.json の構造を検証
 */
function validateManifest(manifest) {
  let hasErrors = false;
  
  const requiredFields = [
    'name', 'displayName', 'version', 'description', 
    'author', 'license', 'capabilities', 'entry'
  ];
  
  for (const field of requiredFields) {
    if (!manifest[field]) {
      console.error(`❌ Missing required field in manifest.json: ${field}`);
      hasErrors = true;
    }
  }
  
  // バージョン形式の確認
  if (manifest.version && !/^\d+\.\d+\.\d+/.test(manifest.version)) {
    console.error('❌ Invalid version format in manifest.json (should be semver)');
    hasErrors = true;
  }
  
  // entry の確認
  if (manifest.entry) {
    if (!manifest.entry.command || !manifest.entry.args) {
      console.error('❌ Invalid entry configuration in manifest.json');
      hasErrors = true;
    }
  }
  
  // capabilities の確認
  if (manifest.capabilities) {
    if (!manifest.capabilities.prompts && !manifest.capabilities.resources && !manifest.capabilities.tools) {
      console.warn('⚠️ No capabilities defined in manifest.json');
    } else {
      console.log('✅ manifest.json structure is valid');
    }
  }
  
  return hasErrors;
}

/**
 * metadata.json の構造を検証
 */
function validateMetadata(metadata) {
  let hasErrors = false;
  
  const requiredFields = [
    'id', 'name', 'version', 'description', 'category', 'author'
  ];
  
  for (const field of requiredFields) {
    if (!metadata[field]) {
      console.error(`❌ Missing required field in metadata.json: ${field}`);
      hasErrors = true;
    }
  }
  
  // ID形式の確認
  if (metadata.id && !/^[a-z][a-z0-9.-]*[a-z0-9]$/.test(metadata.id)) {
    console.error('❌ Invalid ID format in metadata.json (should be reverse domain notation)');
    hasErrors = true;
  }
  
  // カテゴリの確認
  const validCategories = [
    'productivity', 'development', 'communication', 'entertainment', 
    'education', 'business', 'utilities', 'other'
  ];
  
  if (metadata.category && !validCategories.includes(metadata.category)) {
    console.warn(`⚠️ Unknown category in metadata.json: ${metadata.category}`);
  }
  
  if (!hasErrors) {
    console.log('✅ metadata.json structure is valid');
  }
  
  return hasErrors;
}

// メイン実行
validateDXT().catch(error => {
  console.error('❌ DXT validation failed:', error.message);
  process.exit(1);
});