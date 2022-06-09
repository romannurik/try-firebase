import { initializeApp } from "firebase/app";
import { addDoc, collection, connectFirestoreEmulator, getFirestore, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { useEffect, useState } from 'react';
import './App.css';

const app = initializeApp({
  projectId: 'fake-project-id'
});

const db = getFirestore(app);
connectFirestoreEmulator(db, 'localhost', 8080);

const PHRASES = ['Awesome!', 'Epic!', 'Amazing!', 'Rad!', 'Wowza!', 'Legendary!'];

function App() {
  const [items, setItems] = useState([]);
  const [activeStep, setActiveStep] = useState(4);

  const itemsCollection = collection(db, "items");

  async function addItem() {
    // 1. When you click the button, you're storing a new "document" in the "items"
    // collection in your Firestore
    await addDoc(itemsCollection, {
      name: PHRASES[Math.floor(Math.random() * PHRASES.length)],
      createdAt: serverTimestamp(),
    });
  }

  function completeStep(number) {
    if (activeStep <= number) {
      setActiveStep(number + 1);
      setTimeout(() => window.scrollTo(0, document.body.scrollHeight));
    }
  }

  useEffect(() => {
    if (items.length === 0) {
      setActiveStep(1);
    } else {
      completeStep(1);
    }
  }, [items, activeStep]);

  useEffect(() => {
    // 2. Here, your app is subscribing to changes to the collection (e.g. new documents),
    // and automatically updating your app UI when that happens.
    const unsub = onSnapshot(query(itemsCollection, orderBy('createdAt')), snapshot => {
      setItems(snapshot.docs.map(doc => doc.data()));
    });
    return () => unsub();
  }, []);

  return (
    <div className="App">
      <h1>You're trying out Firebase!</h1>
      <p>In this demo, you'll see how <b>Firestore</b> stores data in the cloud
        and lets your app know in realtime as changes happen</p>
      <Step number={1} heading="Mash that button!" activeStep={activeStep}>
        <p>Write to the Firestore database by adding a few items with the button below</p>
        <button onClick={addItem}>Add an item</button>
        <ul>
          {items.map((item, index) => <li key={index}>{item.name}</li>)}
        </ul>
      </Step>
      <Step number={2} heading="See your data in the Emulator" activeStep={activeStep}>
        <p>Check out the Firestore emulators to see what your data looks like in Firestore!</p>
        <a className="button" href="http://localhost:4000/firestore" onClick={() => completeStep(2)} target="_blank">Open Firestore Emulator</a>
      </Step>
      <Step number={3} heading="Explore the code" activeStep={activeStep}>
        <p>Open up the <code>firebase-demo/src/App.js</code> file in your IDE to see what the
          code looks like!</p>
        <details>
          <summary>See a quick summary of the code</summary>
          <p>Importing the Firestore SDK:</p>
          <pre>{`import { ... } from "firebase/firestore";`}</pre>
          <p>Writing to the database:</p>
          <pre>
            {`addDoc(itemsCollection, {
  name: ...,
  createdAt: serverTimestamp(),
});`}</pre>
          <p>Listening to changes:</p>
          <pre>
            {`onSnapshot(query(itemsCollection, orderBy('createdAt')), snapshot => {
  setItems(snapshot.docs.map(doc => doc.data()));
});`}</pre>
        </details>
        <button onClick={() => completeStep(3)}>Got it</button>
      </Step>
      <Step number={4} heading="Start using Firebase in a real app" activeStep={activeStep}>
        <p>That's how Firebase works! When you're ready, continue in the Firebase
          console to add Firebase to your existing app</p>
        <a className="button" href="https://console.firebase.google.com/" target="_blank">
          Add Firebase to your app
        </a>
      </Step>
    </div >
  );
}

function Step({ number, activeStep, heading, children }) {
  return <div className={"step " + (activeStep < number
    ? 'inactive'
    : activeStep === number ? 'current' : 'done')}>
    <h2>{heading}</h2>
    {activeStep >= number && <>{children}</>}
  </div>;
}

export default App;
