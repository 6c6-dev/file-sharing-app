// src/LoginModal.tsx
import React, { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

interface LoginModalProps {
    onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleGoogleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            onClose();
        } catch (error) {
            console.error("Google Sign-In Error:", error);
        }
    };

    const handleEmailLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            onClose();
        } catch (error) {
            console.error("Email Sign-In Error:", error);
        }
    };

    return (
        <div className="modal">
            <h2>Login</h2>
            <button onClick={handleGoogleLogin}>Login with Google</button>
            <hr />
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
            />
            <button onClick={handleEmailLogin}>Login with Email</button>
        </div>
    );
};

export default LoginModal;
