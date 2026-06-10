const fs = require('fs');
const path = require('path');

const filePaths = [
  'src/components/WorkforceModule.tsx',
  'src/components/Settings.tsx'
];

const replacements = [
  [/Select duration aktivitas yang ingin dijadwalkan dari waktu mulai/g, "Select activity duration to schedule starting from"],
  [/Buka Form/g, "Open Form"],
];

for (const fp of filePaths) {
  const fullPath = path.join(__dirname, fp);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    for (const [regex, replacement] of replacements) {
      content = content.replace(regex, replacement);
    }
    fs.writeFileSync(fullPath, content, 'utf8');
  }
}
