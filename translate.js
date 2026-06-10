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
  ...[
    // Common
    [/Batal/g, "Cancel"],
    [/Simpan/g, "Save"],
    [/Hapus/g, "Delete"],
    [/Tambah/g, "Add"],
    [/Tanggal Mulai/g, "Start Date"],
    [/Tanggal Selesai/g, "End Date"],
    [/Tanggal Terpilih/g, "Selected Date"],
    [/Pilih/g, "Select"],
    [/Aktivitas/g, "Activity"],
    [/Pengaturan/g, "Settings"],
    [/Berhasil/g, "Success"],
    [/Gagal/g, "Failed"],
    [/Jadwal/g, "Schedule"],
    [/Karyawan/g, "Employee"],
    [/Terpilih/g, "Selected"],
  ],
  // Specific phrases
  [/Atur Durasi Aktivitas/g, "Set Activity Duration"],
  [/Pilih durasi aktivitas yang ingin dijadwalkan dari waktu mulai/g, "Select the activity duration to schedule starting from"],
  [/Daftar Pilihan Cepat/g, "Quick Presets"],
  [/Klik Kanan untuk Paksa OFF Jadwal \(Force Off\)/g, "Right Click to Force OFF Schedule"],
  [/Silakan pilih rentang tanggal dan klik "Buat Schedule" untuk mengatur jadwal roster karyawan otomatis berdasarkan komposisi required FTE./g, "Please select a date range and click 'Generate Schedule' to auto-schedule based on required FTE."],
  [/Atur kebutuhan jumlah agent sesuai interval & tanggal/g, "Adjust agent requirement count per interval & date"],
  [/Simpan ke Supabase/g, "Save to Supabase"],
  [/Pilih Periode Tanggal \(Maks 31 Hari\)/g, "Select Date Period (Max 31 Days)"],
  [/Batal atau kosongkan semua data interval/g, "Cancel or clear all interval data"],
  [/Semua Kolom Tanggal \(Matrix Excel\)/g, "All Date Columns (Excel Matrix)"],
  [/Hanya Tanggal:/g, "Only Date:"],
  [/Contoh format kolom tunggal tanggal \(Satu angka per baris\):/g, "Example single column format (One number per row):"],
  [/Untuk <strong>Kolom Tunggal<\/strong>: Pilih tanggal tujuan, lalu salin satu kolom angka dari Excel/g, "For <strong>Single Column<\/strong>: Select target date, then paste one column of numbers from Excel"],
  [/Untuk <strong>Matrix Multi-Tanggal<\/strong>: Pilih durasi/g, "For <strong>Multi-Date Matrix<\/strong>: Select duration"],
  [/lalu salin range baris & kolom di Excel. Kolom akan dicocokkan berurutan dengan tanggal aktif./g, "then paste rows & columns from Excel. Columns will match sequentially with active dates."],
  [/Data yang Anda tempel akan langsung tampil pada sheet grid interaktif dan dapat disunting\/diedit kembali sebelum disimpan permanen ke Supabase./g, "Pasted data will appear on the interactive grid sheet and can be edited before saving permanently to Supabase."],
  [/Metrik Terpilih/g, "Selected Metric"],
  [/Spreadsheet sedia untuk di-edit langsung. Tekan tombol simpan di kanan bawah untuk menyimpan secara permanen ke database Supabase/g, "Spreadsheet is ready for direct editing. Press save button below to save permanently to Supabase"],
  [/Simpan Perubahan/g, "Save Changes"],
  [/Setiap karyawan yang ditambahkan di sini akan otomatis disinkronkan ke tabel terpisah/g, "Every employee added here will automatically sync to the separate table"],
  [/Daftar karyawan ini akan langsung aktif pada tab/g, "This employee list will immediately be active on the"],
  [/untuk plotting jadwal roster./g, "for roster plotting."],
  [/Yakin hapus (.*) karyawan\?/g, "Are you sure to delete $1 employees?"],
  [/Ya, Hapus!/g, "Yes, Delete!"],
  [/Bulk Hapus/g, "Bulk Delete"],
  [/Kelola penjadwalan istirahat otomatis \(Auto Break\) & pembersihan massal/g, "Manage auto break scheduling & bulk clearing"],
  [/Hapus Istirahat/g, "Delete Breaks"],
  [/Sistem akan menganalisis data shift agent aktif pada tanggal terpilih/g, "The system will analyze active agent shift data on the selected date"],
  [/dan secara otomatis menempatkan 4 slot istirahat \(LB - 1 jam\) per agent di waktu terbaik demi kelancaran operasional./g, "and automatically place 4 break slots (LB - 1 hr) per agent at optimal times."],
  [/Jadwalkan Otomatis/g, "Auto Schedule"],
  [/Hapus Break Hari Ini/g, "Delete Break Today"],
  [/Set Libur \(OFF\)/g, "Set Holiday (OFF)"],
  [/Menit/g, "Minutes"],
  [/Jam \((\d+) Slot\)/g, "$1 Hour ($1 Slots)"],
  [/Jam/g, "Hour"],
  [/Sisa Shift/g, "Remaining Shift"],
  [/Atur Manual/g, "Manual Setup"],
  [/Durasi Default Project/g, "Project Default Duration"],
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
