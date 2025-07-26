#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * DXTパッケージング スクリプト
 * ビルドされたファイルを .dxt ファイルにパッケージする
 */
async function packageDXT() {
  console.log('📦 Packaging DXT file...');
  
  const buildDir = path.join(projectRoot, 'dxt-build');
  const outputDir = path.join(projectRoot, 'dist-dxt');
  
  if (!fs.existsSync(buildDir)) {
    throw new Error('Build directory not found. Please run "npm run dxt:build" first.');
  }
  
  // 出力ディレクトリを作成
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // マニフェストから情報を取得
  const manifest = JSON.parse(fs.readFileSync(path.join(buildDir, 'manifest.json'), 'utf-8'));
  const dxtFileName = `${manifest.name}-v${manifest.version}.dxt`;
  const dxtFilePath = path.join(outputDir, dxtFileName);
  
  console.log(`📄 Creating ${dxtFileName}...`);
  
  // ZIPファイルを作成（DXT仕様に準拠）
  await createZip(buildDir, dxtFilePath);
  
  // ファイルサイズを取得
  const stats = fs.statSync(dxtFilePath);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log('✅ DXT package created successfully!');
  console.log(`📦 File: ${dxtFilePath}`);
  console.log(`📏 Size: ${fileSizeInMB} MB`);
  console.log('🚀 Ready for distribution!');
  
  // インストール方法を表示
  console.log('\n📋 Installation Instructions:');
  console.log('1. Open Claude Desktop');
  console.log('2. Go to Settings > Extensions');
  console.log(`3. Click "Install Extension" and select ${dxtFileName}`);
  console.log('4. The MCP server will be automatically configured');
}

/**
 * ZIP作成関数
 * archiverライブラリを使用してDXTファイル（ZIP形式）を作成
 */
async function createZip(sourceDir, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // 最高圧縮レベル
    });
    
    output.on('close', () => {
      console.log(`✅ DXT archive created: ${archive.pointer()} total bytes`);
      resolve();
    });
    
    output.on('error', (err) => {
      reject(err);
    });
    
    archive.on('error', (err) => {
      reject(err);
    });
    
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('⚠️ Archive warning:', err);
      } else {
        reject(err);
      }
    });
    
    archive.pipe(output);
    
    // DXTルートにファイルを配置
    archive.directory(sourceDir, false);
    
    archive.finalize();
  });
}

// メイン実行
packageDXT().catch(error => {
  console.error('❌ DXT packaging failed:', error.message);
  if (error.code === 'MODULE_NOT_FOUND' && error.message.includes('archiver')) {
    console.log('💡 Installing archiver dependency...');
    console.log('Run: npm install --save-dev archiver');
  }
  process.exit(1);
});