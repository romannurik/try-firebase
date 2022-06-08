import { initializeApp } from "firebase/app";
import { addDoc, collection, connectFirestoreEmulator, getFirestore, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { useEffect, useState } from 'react';
import './App.css';

const app = initializeApp({ projectId: 'fake-project-id' });
const db = getFirestore(app);
connectFirestoreEmulator(db, 'localhost', 8080);

const PHRASES = ['Awesome!', 'Epic!', 'Amazing!', 'Rad!', 'Wowza!', 'Legendary!'];

function App() {
  const [items, setItems] = useState([]);

  const coll = collection(db, "items");

  useEffect(() => {
    const unsub = onSnapshot(query(coll, orderBy('createdAt')), (snapshot) => {
      setItems(snapshot.docs.map(doc => doc.data()));
    });
    return () => unsub();
  }, []);

  async function addItem() {

    await addDoc(coll, {
      name: PHRASES[Math.floor(Math.random() * PHRASES.length)],
      createdAt: serverTimestamp(),
    });
  }

  return (
    <div className="App">
      <h1>This is a simple Firestore demo!</h1>
      <h2>Step 1. Mash that button!</h2>
      <p>Add a few items with the button below</p>
      <button onClick={addItem}>Add an item</button>
      <ul>
        {items.map((item, index) => <li key={index}>{item.name}</li>)}
      </ul>
      <h2>Step 2. See your data</h2>
      <p>Check out the <a href="http://localhost:4000/firestore" target="_blank">Firestore Emulator</a> to
        see what your data looks like in Firestore!</p>
      <h2>Step 3. Explore the code</h2>
      <p>Open up the directory you specified in VS Code or another IDE to see what the
        code looks like!
      </p>
    </div>
  );
}

export default App;
