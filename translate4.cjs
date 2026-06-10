const fs = require('fs');
const path = require('path');

const filePaths = [
  'src/components/WorkforceModule.tsx',
];

const replacements = [
  [/Please masukkan nama-nama terlebih dahulu\./g, "Please enter names first."],
  [/Klik kanan pada nama Agent for <span className="text-rose-500 font-black">Force OFF<\/span>\. \(Klik ulang Buat Schedule setelahnya\)/g, "Right click on Agent name to <span className=\"text-rose-500 font-bold\">Force OFF</span>. (Click Generate Schedule again)"],
  [/Atau cukup ketik nama saja per baris \(kolom lain otomatis default\):/g, "Or just type names per row (other columns will default):"],
  [/Nama Employee/g, "Employee Name"],
  [/Nama lengkap\.\.\./g, "Full name..."],
  [/example format lengkap \(9 kolom\):/g, "example full format (9 columns):"],
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
