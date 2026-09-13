const fs = require('fs');
const path = require('path');
const srcDir = path.join(__dirname, 'src');
const keep = [
  'App.jsx', 'AuthPage.jsx', 'DashboardPage.jsx', 'MatrixRain.jsx',
  'MessagesPage.jsx', 'Navbar.jsx', 'Rocket.jsx', 'ScrollVideo.jsx',
  'SecurityPage.jsx', 'CollaborationPage.jsx', 'VaultPage.jsx',
  'ResearchPage.jsx', 'SettingsPage.jsx', 'UserContext.jsx',
  'main.jsx', 'index.css'
];

const files = fs.readdirSync(srcDir);
const toDelete = files.filter(f => f.endsWith('.jsx') && !keep.includes(f));
toDelete.forEach(f => {
  fs.unlinkSync(path.join(srcDir, f));
  console.log('Deleted:', f);
});
console.log('\\nRemaining files:', fs.readdirSync(srcDir).join(', '));
