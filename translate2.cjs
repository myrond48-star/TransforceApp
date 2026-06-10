const fs = require('fs');
const path = require('path');

const filePaths = [
  'src/components/WorkforceModule.tsx',
  'src/components/Settings.tsx',
  'src/components/SupportModule.tsx',
  'src/components/AnalyticsModule.tsx',
  'src/components/Header.tsx',
  'src/components/Sidebar.tsx',
  'src/App.tsx'
];

const replacements = [
  [/Hari Ini/g, "Today"],
  [/Hari Kerja/g, "Work Days"],
  [/Hari Libur/g, "Off Days"],
  [/Hari/ig, "Days"],
  [/Silakan/ig, "Please"],
  [/Untuk/g, "For"],
  [/untuk/g, "for"],
  [/Semua/g, "All"],
  [/Pencarian/ig, "Search"],
  [/Berdasarkan/ig, "Based on"],
  [/Tampilkan/ig, "Show"],
  [/Tutup/g, "Close"],
  [/Kebutuhan jumlah agent per shift/g, "Agent requirement per shift"],
  [/berdasarkan interval/g, "based on interval"],
  [/TIPS: Sesuaikan angka kebutuhan interval/g, "TIP: Adjust interval requirement numbers"],
  [/di atas untuk memperbarui komposisi shift secara real-time!/g, "above to update shift composition in real-time!"],
  [/Sisa/g, "Remaining"],
  [/Simpan/g, "Save"], // In case some were missed
  [/bulanan/g, "monthly"],
  [/mingguan/g, "weekly"],
  [/harian/g, "daily"],
  [/Semua Kolom/g, "All Columns"],
  [/durasi/g, "duration"],
  [/tanggal aktif/g, "active dates"],
  [/Tujuan/g, "Target"],
  [/Data Interval/g, "Interval Data"],
  [/Hanya Tanggal/g, "Only Date"],
  [/contoh format/gi, "example format"],
  [/salin/g, "copy"],
  [/tempel/g, "paste"],
  [/Periode Tanggal/g, "Date Period"],
  [/Maks/g, "Max"],
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
