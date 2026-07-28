import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./emsme.db');

db.all('SELECT * FROM loan_applications', (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log(JSON.stringify(rows, null, 2));
  }
  db.close();
});
