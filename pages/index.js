import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import ScheduleViewer from '../components/ScheduleViewer';

export default function Home() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Проверяем, является ли пользователь админом через custom claims
        const tokenResult = await currentUser.getIdTokenResult();
        setIsAdmin(tokenResult.claims.admin === true);

        // Загружаем данные пользователя (класс и группу)
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading) return <div className="container"><p>Загрузка...</p></div>;

  if (!user) {
    return (
      <div className="container">
        <h1>Расписание школы</h1>
        <p>Пожалуйста, войдите или зарегистрируйтесь.</p>
        <button onClick={() => router.push('/login')}>Войти</button>
        <button onClick={() => router.push('/register')} className="secondary">Регистрация</button>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Расписание школы</h1>
        <div>
          {isAdmin && (
            <button onClick={() => router.push('/admin')} style={{ marginRight: '10px' }}>
              Панель администратора
            </button>
          )}
          <button onClick={handleLogout} className="secondary">Выйти</button>
        </div>
      </div>

      {isAdmin ? (
        <div className="admin-section">
          <h2>Вы вошли как Администратор</h2>
          <p>Вы можете редактировать расписание для всех классов и групп.</p>
        </div>
      ) : (
        <>
          {userData ? (
            <>
              <p style={{ marginBottom: '15px' }}>
                <strong>Класс:</strong> {userData.grade} | <strong>Группа:</strong> {userData.group}
              </p>
              <ScheduleViewer grade={userData.grade} group={userData.group} />
            </>
          ) : (
            <p className="error">Данные пользователя не найдены. Обратитесь к администратору.</p>
          )}
        </>
      )}
    </div>
  );
}