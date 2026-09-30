import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];

export default function ScheduleViewer({ grade, group }) {
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!grade || !group) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'schedule'),
      where('grade', '==', grade),
      where('group', '==', group)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const scheduleData = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!scheduleData[data.day]) {
          scheduleData[data.day] = [];
        }
        scheduleData[data.day].push({
          id: doc.id,
          ...data,
          lessonNumber: data.lessonNumber
        });
      });

      // Сортируем уроки по номеру
      Object.keys(scheduleData).forEach(day => {
        scheduleData[day].sort((a, b) => a.lessonNumber - b.lessonNumber);
      });

      setSchedule(scheduleData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [grade, group]);

  if (loading) return <p>Загрузка расписания...</p>;

  const hasSchedule = Object.keys(schedule).length > 0;

  if (!hasSchedule) {
    return <p>Для вашего класса и группы расписание пока не добавлено.</p>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: '15px' }}>Ваше расписание</h2>
      {DAYS.map((day) => {
        const lessons = schedule[day];
        if (!lessons || lessons.length === 0) return null;

        return (
          <div key={day} style={{ marginBottom: '25px' }}>
            <h3 style={{ marginBottom: '10px', color: '#1a1a2e' }}>{day}</h3>
            <table className="schedule-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Урок</th>
                  <th>Предмет</th>
                  <th style={{ width: '150px' }}>Учитель</th>
                  <th style={{ width: '100px' }}>Кабинет</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((lesson) => (
                  <tr key={lesson.id}>
                    <td>{lesson.lessonNumber}</td>
                    <td>{lesson.subject}</td>
                    <td>{lesson.teacher || '—'}</td>
                    <td>{lesson.room || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}