const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read version from manifest.json
const manifestPath = path.join(__dirname, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const version = manifest.version || '1.0.0';

const zipName = `sidenotes-v${version}.zip`;
const zipPath = path.join(__dirname, zipName);
const genericZipPath = path.join(__dirname, 'sidenotes.zip');

console.log(`📦 Packaging SideNotes version ${version}...`);

// Generate PNG icons first to be certain icons exist
try {
  execSync('node generate_icons.js', { stdio: 'inherit', cwd: __dirname });
} catch (err) {
  console.error('Error generating icons:', err.message);
}

// Remove old zip files if present
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
if (fs.existsSync(genericZipPath)) fs.unlinkSync(genericZipPath);

// Create versioned zip archive
const zipCmd = `zip -r "${zipName}" manifest.json service-worker.js icons sidepanel README.md CHROMEWEBSTORE.md privacy.html docs`;
try {
  execSync(zipCmd, { stdio: 'inherit', cwd: __dirname });
  // Also create a copy named sidenotes.zip for convenience
  fs.copyFileSync(zipPath, genericZipPath);
  console.log(`\n✅ Successfully generated versioned package: ${zipName}`);
  console.log(`✅ Updated release bundle: sidenotes.zip`);
} catch (err) {
  console.error('❌ Failed to zip files:', err.message);
}
