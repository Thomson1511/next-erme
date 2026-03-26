'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Item {
  id: string;
  name: string;
  price: number;
  change: number[];
}

type SortOrder = 'none' | 'asc' | 'desc';
type FilterType = 'all' | 'below';

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [headerPrice, setHeaderPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Szűrő és rendezés állapot
  const [sortOrder, setSortOrder] = useState<SortOrder>('none');
  const [filterType, setFilterType] = useState<FilterType>('all');

  useEffect(() => {
    // Header: "Next érme" ár
    const headerQuery = query(
      collection(db, 'next'),
      where('name', '==', 'Next érme')
    );

    const headerUnsub = onSnapshot(headerQuery, (snapshot) => {
      if (!snapshot.empty) {
        setHeaderPrice(snapshot.docs[0].data().price);
      } else {
        setHeaderPrice(null);
      }
    });

    // Táblázat adatok (kivéve "Next érme")
    const tableQuery = query(
      collection(db, 'next'),
      where('name', '!=', 'Next érme'),
      orderBy('name')
    );

    const tableUnsub = onSnapshot(tableQuery, (snapshot) => {
      const data: Item[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Item[];
      setItems(data);
      setLoading(false);
    });

    return () => {
      headerUnsub();
      tableUnsub();
    };
  }, []);

  // Számítások + szűrés + rendezés (memoized a teljesítmény miatt)
  const processedItems = useMemo(() => {
    let result = [...items];

    // 1. Számítás minden sorra
    result = result.map((item) => {
      const change0 = item.change[0] ?? 0;
      const change1 = item.change[1] ?? 0;
      const isGreater = change1 > change0;

      const ertekeDarabban = isGreater
        ? item.price / change1
        : item.price * change0;

      const amiAlattMegeri = headerPrice !== null
        ? (isGreater ? headerPrice * change1 : headerPrice / change0)
        : 0;

      return {
        ...item,
        ertekeDarabban,
        amiAlattMegeri,
      };
    });

    // 2. Szűrés: csak azok, ahol Értéke darabban < Next érme ára
    if (filterType === 'below' && headerPrice !== null) {
      result = result.filter(item => item.ertekeDarabban < headerPrice);
    }

    // 3. Rendezés az "Értéke darabban" szerint
    if (sortOrder !== 'none') {
      result.sort((a, b) => {
        if (sortOrder === 'asc') {
          return a.ertekeDarabban - b.ertekeDarabban;
        } else {
          return b.ertekeDarabban - a.ertekeDarabban;
        }
      });
    }

    return result;
  }, [items, headerPrice, sortOrder, filterType]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-xl">Betöltés a Firebase-ből...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Fejléc */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Next <span className="text-yellow-400">Érme</span>
              {headerPrice !== null && (
                <span className="text-2xl font-normal text-yellow-400 ml-3">
                  : {headerPrice}
                </span>
              )}
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Érmék és befektetések követése • {processedItems.length} tétel
          </p>
        </div>

        {/* Szűrő és Rendezés vezérlők */}
        <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 mb-8 flex flex-wrap gap-6 items-center">
          <div>
            <p className="text-sm text-gray-400 mb-2">Értéke darabban rendezés</p>
            <div className="flex gap-2">
              <button
                onClick={() => setSortOrder('none')}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition ${sortOrder === 'none' ? 'bg-yellow-400 text-black' : 'bg-gray-800 hover:bg-gray-700'}`}
              >
                Eredeti
              </button>
              <button
                onClick={() => setSortOrder('asc')}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition ${sortOrder === 'asc' ? 'bg-yellow-400 text-black' : 'bg-gray-800 hover:bg-gray-700'}`}
              >
                ↑ Növekvő
              </button>
              <button
                onClick={() => setSortOrder('desc')}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition ${sortOrder === 'desc' ? 'bg-yellow-400 text-black' : 'bg-gray-800 hover:bg-gray-700'}`}
              >
                ↓ Csökkenő
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Szűrés</p>
            <button
              onClick={() => setFilterType(filterType === 'below' ? 'all' : 'below')}
              className={`px-6 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                filterType === 'below' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              {filterType === 'below' ? '✅ Csak ami alatt van' : 'Mutass mindent'}
            </button>
          </div>

          {filterType === 'below' && headerPrice && (
            <p className="text-sm text-green-400">
              Csak azok látszanak, ahol Értéke darabban &lt; {headerPrice}
            </p>
          )}
        </div>

        {/* Táblázat */}
        <div className="bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 shadow-2xl">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="px-6 py-5 text-left font-semibold text-gray-300">Név</th>
                <th className="px-6 py-5 text-right font-semibold text-gray-300">Ár</th>
                <th className="px-6 py-5 text-center font-semibold text-gray-300">Váltás</th>
                <th className="px-6 py-5 text-right font-semibold text-gray-300">Értéke darabban</th>
                <th className="px-6 py-5 text-right font-semibold text-gray-300">Ami alatt megéri</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {processedItems.map((item) => {
                const change0 = item.change[0] ?? 0;
                const change1 = item.change[1] ?? 0;

                return (
                  <tr 
                    key={item.id} 
                    className="hover:bg-gray-800/70 transition-colors duration-200"
                  >
                    <td className="px-6 py-6 font-medium text-lg">{item.name}</td>
                    
                    <td className="px-6 py-6 text-right font-mono text-xl">
                      ${item.price.toLocaleString('en-US')}
                    </td>
                    
                    <td className="px-6 py-6 text-center font-mono text-lg">
                      {change0}-{change1}
                    </td>
                    
                    <td className="px-6 py-6 text-right font-mono text-lg">
                      ${item.ertekeDarabban.toLocaleString('en-US', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </td>
                    
                    <td className="px-6 py-6 text-right font-mono text-lg text-yellow-400">
                      ${item.amiAlattMegeri.toLocaleString('en-US', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </td>
                  </tr>
                );
              })}

              {processedItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                    Nincs találat a jelenlegi szűrővel.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          Realtime adatok • Szűrés és rendezés az "Értéke darabban" oszlop alapján
        </div>
      </div>
    </main>
  );
}