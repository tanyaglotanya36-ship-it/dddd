const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Скачайте из Firebase Console → Project settings → Service accounts

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const email = 'admin@school.ru'; // Замените на email администратора

admin.auth().getUserByEmail(email)
  .then((user) => {
    return admin.auth().setCustomUserClaims(user.uid, { admin: true });
  })
  .then(() => {
    console.log('Админ успешно назначен!');
    process.exit();
  })
  .catch((error) => {
    console.error('Ошибка:', error);
    process.exit(1);
  });