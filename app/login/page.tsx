'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/admin');        // sikeres login után admin oldalra
    } catch (err: any) {
      setError('Hibás email vagy jelszó. Próbáld újra!');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-gray-900 p-10 rounded-3xl border border-gray-800">
        <h1 className="text-3xl font-bold text-center mb-8">
          Next <span className="text-yellow-400">Érme</span> – Admin
        </h1>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-5 py-3 focus:outline-none focus:border-yellow-400"
              placeholder="admin@next-erme.hu"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Jelszó</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-5 py-3 focus:outline-none focus:border-yellow-400"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 rounded-xl transition disabled:opacity-70"
          >
            {loading ? 'Bejelentkezés...' : 'Bejelentkezés'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-8">
          Regisztráció nincs engedélyezve.
        </p>
      </div>
    </main>
  );
}