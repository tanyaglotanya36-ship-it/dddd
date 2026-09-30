import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];
const GRADES = ['1','2','3','4','5','6','7','8','9','10','11'];
const GROUPS = ['А', 'Б', 'В'];

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [grade, setGrade] = useState('1');
  const [group, setGroup] = useState('А');
  const [day, setDay] = useState('Понедельник');
  const [lessonNumber, setLessonNumber] = useState('1');
  const [subject, setSubject] = useState('');
  const [teacher, setTeacher] = useState('');
  const [room, setRoom] = useState('');
  const [schedule, setSchedule] = useState([]);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const tokenResult = await currentUser.getIdTokenResult();
        if (tokenResult.claims.admin !== true) {
          router.push('/');
          return;
        }
        setUser(currentUser);
        setIsAdmin(true);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Загрузка расписания для выбранного класса/группы
  useEffect(() => {
    if (!isAdmin) return;

    const loadSchedule = async () => {
      const q = query(
        collection(db, 'schedule'),
        where('grade', '==', grade),
        where('group', '==', group)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => a.day.localeCompare(b.day) || a.lessonNumber - b.lessonNumber);
      setSchedule(data);
    };

    loadSchedule();
  }, [grade, group, isAdmin]);

  const handleAddLesson = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!subject) {
      setMessage('Введите название предмета');
      return;
    }

    try {
      await addDoc(collection(db, 'schedule'), {
        grade,
        group,
        day,
        lessonNumber: parseInt(lessonNumber),
        subject,
        teacher: teacher || '',
        room: room || ''
      });

      setMessage('Урок добавлен!');
      setSubject('');
      setTeacher('');
      setRoom('');

      // Перезагружаем список
      const q = query(
        collection(db, 'schedule'),
        where('grade', '==', grade),
        where('group', '==', group)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => a.day.localeCompare(b.day) || a.lessonNumber - b.lessonNumber);
      setSchedule(data);
    } catch (err) {
      setMessage('Ошибка: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить этот урок?')) return;
    try {
      await deleteDoc(doc(db, 'schedule', id));
      setSchedule(schedule.filter(item => item.id !== id));
      setMessage('Урок удалён');
    } catch (err) {
      setMessage('Ошибка удаления: ' + err.message);
    }
  };

  if (loading) return <div className="container"><p>Проверка прав...</p></div>;
  if (!isAdmin) return null;

  return (
    <div className="container">
      <h1>Панель администратора</h1>
      <button onClick={() => router.push('/')} className="secondary" style={{ marginBottom: '20px' }}>
        ← На главную
      </button>

      <div className="admin-section">
        <h2>Добавить урок</h2>
        <form onSubmit={handleAddLesson}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label>Класс</label>
              <select value={grade} onChange={(e) => setGrade(e.target.value)}>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Группа</label>
              <select value={group} onChange={(e) => setGroup(e.target.value)}>
                {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>День</label>
              <select value={day} onChange={(e) => setDay(e.target.value)}>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Номер урока</label>
              <select value={lessonNumber} onChange={(e) => setLessonNumber(e.target.value)}>
                {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label>Предмет</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Математика" required />
            </div>
            <div className="form-group">
              <label>Учитель</label>
              <input value={teacher} onChange={(e) => setTeacher(e.target.value)} placeholder="Иванова А.П." />
            </div>
            <div className="form-group">
              <label>Кабинет</label>
              <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="101" />
            </div>
          </div>
          <button type="submit">Добавить урок</button>
          {message && <p className={message.includes('Ошибка') ? 'error' : 'success'}>{message}</p>}
        </form>
      </div>

      <div className="admin-section">
        <h2>Расписание: {grade} класс, группа {group}</h2>
        {schedule.length === 0 ? (
          <p>Нет уроков для этого класса и группы.</p>
        ) : (
          <table className="schedule-table">
            <thead>
              <tr>
                <th>День</th>
                <th>№</th>
                <th>Предмет</th>
                <th>Учитель</th>
                <th>Кабинет</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((item) => (
                <tr key={item.id}>
                  <td>{item.day}</td>
                  <td>{item.lessonNumber}</td>
                  <td>{item.subject}</td>
                  <td>{item.teacher || '—'}</td>
                  <td>{item.room || '—'}</td>
                  <td>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      style={{ background: '#e74c3c', padding: '6px 12px', fontSize: '14px' }}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}