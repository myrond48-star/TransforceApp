const fs = require('fs');
const path = require('path');

const filePaths = [
  'src/components/WorkforceModule.tsx',
];

const replacements = [
  [/Failed menambahkan karyawan/g, "Failed to add employee"],
  [/Memproses (.*) karyawan\.\.\./g, "Processing $1 employees..."],
  [/Success menambahkan (.*) karyawan secara bulk!/g, "Successfully added $1 employees in bulk!"],
  [/Paste daftar karyawan di bawah ini/g, "Paste employee list below"],
  [/atau cukup pisahkan dengan/g, "or just separate with"],
  [/Gunakan fitur <strong>Bulk Add<\/strong> for memasukkan puluhan karyawan dengan format rapi secara instan./g, "Use <strong>Bulk Add<\/strong> feature to instantly add dozens of employees."],
  [/Belum ada karyawan di database Supabase Anda/g, "No employees in your Supabase database yet"],
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
