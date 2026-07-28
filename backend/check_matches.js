import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./emsme.db');

db.all('SELECT * FROM business_profiles', async (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    for (const b of rows) {
      const matchQuery = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM loan_applications WHERE business_id = ? AND status = "APPROVED"', [b.id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      console.log(`Business ${b.business_name} (ID: ${b.id}) has matchCount: ${matchQuery.count}`);
    }
  }
  db.close();
});
