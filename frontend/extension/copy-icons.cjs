const fs = require('fs');
const path = require('path');

// Copy PNG icons from source to dist
const sourceIconsDir = path.join(__dirname, 'icons');
const distIconsDir = path.join(__dirname, 'dist', 'icons');

// Ensure dist/icons directory exists
if (!fs.existsSync(distIconsDir)) {
  fs.mkdirSync(distIconsDir, { recursive: true });
}

// Copy only the icon-*.png files
const iconSizes = [16, 32, 48, 128];
iconSizes.forEach(size => {
  const sourceFile = path.join(sourceIconsDir, `icon-${size}.png`);
  const destFile = path.join(distIconsDir, `icon-${size}.png`);
  
  if (fs.existsSync(sourceFile)) {
    fs.copyFileSync(sourceFile, destFile);
    console.log(`✅ Copied icon-${size}.png`);
  } else {
    console.warn(`⚠️  icon-${size}.png not found`);
  }
});

// Update manifest.json to use PNG icons
const manifestPath = path.join(__dirname, 'dist', 'manifest.json');
if (fs.existsSync(manifestPath)) {
  let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Set PNG icons
  manifest.icons = {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png", 
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  };
  
  manifest.action.default_icon = {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png", 
    "128": "icons/icon-128.png"
  };
  
  // OAuth2 commented out until configured
  // if (!manifest.oauth2) {
  //   manifest.oauth2 = {
  //     "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
  //     "scopes": ["openid", "email", "profile"]
  //   };
  // }
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ Updated manifest.json');
}

console.log('🎉 Icons setup complete!');
