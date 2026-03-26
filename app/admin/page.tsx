'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, query, where } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../lib/firebase';
import { useRouter } from 'next/navigation';

interface Item {
  id: string;
  name: string;
  price: number;
  change: number[];
}

export default function Admin() {
  const [items, setItems] = useState<Item[]>([]);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newChange1, setNewChange1] = useState('');
  const [newChange2, setNewChange2] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Auth ellenőrzés + redirect ha nincs bejelentkezve
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Adatok betöltése (minden dokumentum, beleértve "Next érme"-t is)
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'next'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Item[];
      setItems(data);
    });

    return () => unsub();
  }, [user]);

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Betöltés...</div>;

  // Ár módosítása
  const handleUpdatePrice = async (id: string) => {
    if (!editPrice) return;
    try {
      await updateDoc(doc(db, 'next', id), {
        price: parseFloat(editPrice)
      });
      setEditingId(null);
      setEditPrice('');
    } catch (err) {
      alert('Hiba történt a módosításkor');
    }
  };

  // Új termék hozzáadása
  const handleAddNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice || !newChange1 || !newChange2) {
      alert('Minden mezőt ki kell tölteni!');
      return;
    }

    try {
      await addDoc(collection(db, 'next'), {
        name: newName,
        price: parseFloat(newPrice),
        change: [parseInt(newChange1), parseInt(newChange2)],
      });

      setNewName('');
      setNewPrice('');
      setNewChange1('');
      setNewChange2('');
      alert('Új termék sikeresen hozzáadva!');
    } catch (err) {
      alert('Hiba az hozzáadáskor');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold">Admin felület – Adatbázis módosítás</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-xl text-sm"
            >
              Kijelentkezés
            </button>
          </div>
        </div>

        {/* Új termék hozzáadása */}
        <div className="bg-gray-900 p-8 rounded-3xl border border-gray-800 mb-12">
          <h2 className="text-2xl font-semibold mb-6">Új termék hozzáadása</h2>
          <form onSubmit={handleAddNew} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Név"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-xl px-5 py-3"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Ár"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-xl px-5 py-3"
            />
            <input
              type="number"
              placeholder="Váltás 1. szám"
              value={newChange1}
              onChange={(e) => setNewChange1(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-xl px-5 py-3"
            />
            <input
              type="number"
              placeholder="Váltás 2. szám"
              value={newChange2}
              onChange={(e) => setNewChange2(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-xl px-5 py-3"
            />
            <button
              type="submit"
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-xl"
            >
              Hozzáadás
            </button>
          </form>
        </div>

        {/* Táblázat – csak Név, Ár, Váltás + Szerkesztés */}
        <div className="bg-gray-900 rounded-3xl overflow-hidden border border-gray-800">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-5 text-left">Név</th>
                <th className="px-6 py-5 text-right">Ár</th>
                <th className="px-6 py-5 text-center">Váltás</th>
                <th className="px-6 py-5 text-center">Művelet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-800/70">
                  <td className="px-6 py-6 font-medium">{item.name}</td>
                  <td className="px-6 py-6 text-right font-mono">
                    {editingId === item.id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="bg-gray-700 w-32 text-right px-3 py-1 rounded"
                        autoFocus
                      />
                    ) : (
                      `$${item.price.toLocaleString('en-US')}`
                    )}
                  </td>
                  <td className="px-6 py-6 text-center font-mono">
                    {item.change[0]}-{item.change[1]}
                  </td>
                  <td className="px-6 py-6 text-center">
                    {editingId === item.id ? (
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={() => handleUpdatePrice(item.id)}
                          className="bg-green-600 hover:bg-green-700 px-4 py-1 rounded-lg text-sm"
                        >
                          Mentés
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setEditPrice(''); }}
                          className="bg-gray-600 hover:bg-gray-700 px-4 py-1 rounded-lg text-sm"
                        >
                          Mégse
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingId(item.id); setEditPrice(item.price.toString()); }}
                        className="bg-yellow-400 hover:bg-yellow-500 text-black px-5 py-1.5 rounded-xl text-sm font-medium"
                      >
                        Ár szerkesztése
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}