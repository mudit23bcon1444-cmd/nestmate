const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const compressedDir = path.join(projectRoot, 'compressed');

if (!fs.existsSync(compressedDir)) {
  fs.mkdirSync(compressedDir, { recursive: true });
}

// Find existing zip version numbers
const files = fs.readdirSync(compressedDir);
let maxVersion = 0;

files.forEach(file => {
  const match = file.match(/^nestmate_v(\d+)\.zip$/);
  if (match) {
    const versionNum = parseInt(match[1], 10);
    if (versionNum > maxVersion) {
      maxVersion = versionNum;
    }
  }
});

const nextVersion = maxVersion + 1;
const zipFileName = `nestmate_v${nextVersion}.zip`;
const zipFilePath = path.join(compressedDir, zipFileName);

console.log(`📦 Creating backup version v${nextVersion}: ${zipFileName}...`);

const zipCmd = `zip -9 -r -q "${zipFilePath}" . ` +
  `-x "node_modules/*" ` +
  `-x "backend/node_modules/*" ` +
  `-x "frontend/node_modules/*" ` +
  `-x ".git/*" ` +
  `-x ".vscode/*" ` +
  `-x "compressed/*" ` +
  `-x "un_used ui/*" ` +
  `-x "nestmate_ppt.key" ` +
  `-x "VIDEO_WALKTHROUGH_SCRIPT.md" ` +
  `-x ".DS_Store" ` +
  `-x "*/.DS_Store" ` +
  `-x ".env" ` +
  `-x "backend/.env" ` +
  `-x "*.env" ` +
  `-x "*/.env" ` +
  `-x "backend/nestmate.db*" ` +
  `-x "*.tmp"`;

try {
  execSync(zipCmd, { cwd: projectRoot, stdio: 'inherit' });
  const stats = fs.statSync(zipFilePath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`✅ Backup successfully created!`);
  console.log(`   File: compressed/${zipFileName}`);
  console.log(`   Size: ${sizeMB} MB`);
} catch (error) {
  console.error(`❌ Failed to create backup:`, error.message);
  process.exit(1);
}
