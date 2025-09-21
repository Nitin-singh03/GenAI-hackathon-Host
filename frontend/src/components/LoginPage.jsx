import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const LoginPage = () => {
  const [email, setEmail] = useState('demo@gmail.com'); // demo email prefilled
  const [password, setPassword] = useState('demo');     // demo password prefilled
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // shared login function used by form submit and demo button
  const loginWithCredentials = async (emailParam, passwordParam) => {
    setError('');
    try {
      const response = await axios.post('https://genai-hackathon-host.onrender.com/login', {
        email: emailParam,
        password: passwordParam,
      });

      console.log('Login successful:', response.data);
      localStorage.setItem('token', response.data.token);
      navigate('/app');
    } catch (err) {
      console.error('Login failed:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    await loginWithCredentials(email, password);
  };

  const handleDemoLogin = async () => {
    // one-click demo login
    await loginWithCredentials('demo@gmail.com', 'demo');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white shadow-2xl rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your Legal Document AI Assistant</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div>
            <label className="block text-gray-700 mb-1" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Sign In
          </button>

          {/* Demo login button — one click to login with prefilled credentials */}
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full mt-2 border border-dashed border-gray-300 text-gray-700 font-medium py-2 rounded-lg transition-all duration-150 hover:bg-gray-50"
          >
            Demo Login (one click)
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600">
          Don’t have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
