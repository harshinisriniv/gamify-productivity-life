import React, { useState } from "react";
import "./loginform.css";
import { auth, db } from "./firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

type LoginFormProps = {
  onLogin: (email: string, userData: any) => void;
};

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Enter both email and password");
      return;
    }

    try {
      let userCredential;

      try {
        // Try to sign in
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (err) {
        // If sign-in fails, create new user
        userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Create default user data in Firestore
        const username = email.split("@")[0]; // optional: use part before @ as display name
        await setDoc(doc(db, "users", email), {
          xp: 0,
          level: 1,
          tasks: [],
        });
      }

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, "users", email));
      const userData = userDoc.exists() ? userDoc.data() : { xp: 0, level: 1, tasks: [] };

      setError("");
      onLogin(email, userData);
    } catch (err: any) {
      console.error("Firebase login error:", err.code, err.message);
      setError("Login failed: " + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        className="login-username"
        type="email"
        placeholder="EMAIL"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="login-password"
        type="password"
        placeholder="PASSWORD"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="login-button" type="submit">LOGIN</button>

      {error && (
        <div
          style={{
            color: "red",
            position: "absolute",
            top: "58%",
            left: "54%",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "6px",
          }}
        >
          {error}
        </div>
      )}
    </form>
  );
}
