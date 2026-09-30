import { useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [grade, setGrade] = useState('');
  const [group, setGroup] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!grade || !group) {
      setError('Пожалуйста, выберите класс и группу');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Сохраняем класс и группу в Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        grade: grade,
        group: group,
        createdAt: new Date()
      });

      router.push('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      <h1>Регистрация ученика</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <div className="form-group">
          <label>Класс</label>
          <select value={grade} onChange={(e) => setGrade(e.target.value)} required>
            <option value="">Выберите класс</option>
            <option value="1">1 класс</option>
            <option value="2">2 класс</option>
            <option value="3">3 класс</option>
            <option value="4">4 класс</option>
            <option value="5">5 класс</option>
            <option value="6">6 класс</option>
            <option value="7">7 класс</option>
            <option value="8">8 класс</option>
            <option value="9">9 класс</option>
            <option value="10">10 класс</option>
            <option value="11">11 класс</option>
          </select>
        </div>
        <div className="form-group">
          <label>Группа</label>
          <select value={group} onChange={(e) => setGroup(e.target.value)} required>
            <option value="">Выберите группу</option>
            <option value="А">А</option>
            <option value="Б">Б</option>
            <option value="В">В</option>
          </select>
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit">Зарегистрироваться</button>
        <Link href="/login">
          <button type="button" className="secondary">У меня есть аккаунт</button>
        </Link>
      </form>
    </div>
  );
}