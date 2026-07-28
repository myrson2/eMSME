import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./emsme.db');

db.run('DELETE FROM loan_applications', (err) => {
  if (err) {
    console.error(err);
  } else {
    console.log('All loan applications cleared.');
  }
  db.close();
});
