// src/App.tsx
import React, { useState } from 'react';
import { useAuth, AuthProvider } from './AuthProvider';
import AdminView from './AdminView';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { SnackbarProvider } from 'notistack';
import { useSnackbar } from 'notistack';

const App: React.FC = () => {
    const { user } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoginView, setIsLoginView] = useState(true);  // State to toggle views
    const { enqueueSnackbar } = useSnackbar();

    const handleGoogleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error: any) {
            enqueueSnackbar(`Google Sign-In Error: ${error.message}`, { variant: 'error' });
        }
    };

    const handleEmailLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error: any) {
            enqueueSnackbar(`Email Sign-In Error: ${error.message}`, { variant: 'error' });
        }
    };

    const toggleView = () => {
        setIsLoginView(!isLoginView);  // Toggle between Login and alternative view
    };

    return (
        <div className="App">
            {user ? (
                <AdminView />
            ) : (
                <div className="login-container">
                    <div className="login-form">
                        <h2>{isLoginView ? 'Login' : 'Welcome'}</h2> {/* Toggle Title */}
                        
                        {isLoginView ? (
                            <>
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
                                <button onClick={handleEmailLogin}>Login</button>
                                <div className="alternative-login">
                                    <p>Or login with</p>
                                    <a onClick={handleGoogleLogin} style={{ cursor: 'pointer' }}>Google</a>
                                </div>
                            </>
                        ) : (
                            <p>Welcome to our app! Please login or sign up to continue.</p>
                        )}

                        <button onClick={toggleView} style={{ marginTop: '20px' }}>
                            {isLoginView ? 'Go to Welcome View' : 'Back to Login'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const RootApp: React.FC = () => (
  <SnackbarProvider maxSnack={3}>
  <AuthProvider>
      <App />
  </AuthProvider>
</SnackbarProvider>
);

export default RootApp;
