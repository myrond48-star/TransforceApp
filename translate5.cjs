const fs = require('fs');
const path = require('path');

const filePaths = [
  'src/components/WorkforceModule.tsx',
];

const replacements = [
  [/Buat Schedule/g, "Generate Schedule"],
  [/Belum ada schedule yang dibuat. Please buat schedule terlebih dahulu di tab/gi, "No schedule generated yet. Please generate schedule first in the"],
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
