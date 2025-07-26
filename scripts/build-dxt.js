#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * DXT (Desktop Extension) ビルドスクリプト
 * MCPサーバーをDXTパッケージとして準備する
 */
async function buildDXT() {
  console.log('🔨 Building DXT package...');
  
  const buildDir = path.join(projectRoot, 'dxt-build');
  const manifestPath = path.join(projectRoot, 'manifest.json');
  const metadataPath = path.join(projectRoot, 'metadata.json');
  
  // ビルドディレクトリをクリーンアップ
  if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true, force: true });
  }
  fs.mkdirSync(buildDir, { recursive: true });
  
  // マニフェストファイルの検証
  if (!fs.existsSync(manifestPath)) {
    throw new Error('manifest.json not found. Please create it first.');
  }
  
  if (!fs.existsSync(metadataPath)) {
    throw new Error('metadata.json not found. Please create it first.');
  }
  
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  
  // 必要なファイルをコピー
  console.log('📄 Copying necessary files...');
  
  // distディレクトリをコピー
  if (fs.existsSync(path.join(projectRoot, 'dist'))) {
    copyDirectory(path.join(projectRoot, 'dist'), path.join(buildDir, 'dist'));
  } else {
    throw new Error('dist directory not found. Please run "npm run build" first.');
  }
  
  // templatesディレクトリをコピー
  if (fs.existsSync(path.join(projectRoot, 'templates'))) {
    copyDirectory(path.join(projectRoot, 'templates'), path.join(buildDir, 'templates'));
  }
  
  // resourcesディレクトリをコピー（存在する場合）
  if (fs.existsSync(path.join(projectRoot, 'resources'))) {
    copyDirectory(path.join(projectRoot, 'resources'), path.join(buildDir, 'resources'));
  }
  
  // package.json から必要な部分を抽出してコピー
  const originalPackage = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8'));
  const dxtPackage = {
    name: originalPackage.name,
    version: originalPackage.version,
    description: originalPackage.description,
    main: originalPackage.main,
    type: originalPackage.type,
    dependencies: originalPackage.dependencies,
    author: originalPackage.author,
    license: originalPackage.license,
    keywords: originalPackage.keywords
  };
  
  fs.writeFileSync(
    path.join(buildDir, 'package.json'),
    JSON.stringify(dxtPackage, null, 2)
  );
  
  // README.mdをコピー
  if (fs.existsSync(path.join(projectRoot, 'README.md'))) {
    fs.copyFileSync(
      path.join(projectRoot, 'README.md'),
      path.join(buildDir, 'README.md')
    );
  }
  
  // マニフェストとメタデータをコピー
  fs.copyFileSync(manifestPath, path.join(buildDir, 'manifest.json'));
  fs.copyFileSync(metadataPath, path.join(buildDir, 'metadata.json'));
  
  console.log('✅ DXT build completed successfully!');
  console.log(`📦 Build output: ${buildDir}`);
  console.log('🚀 Run "npm run dxt:package" to create the .dxt file');
}

/**
 * ディレクトリを再帰的にコピーする
 */
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// メイン実行
buildDXT().catch(error => {
  console.error('❌ DXT build failed:', error.message);
  process.exit(1);
});