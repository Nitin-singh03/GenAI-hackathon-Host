import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, UserCircle } from 'lucide-react';

function Navbar() {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);    //In short: !! = “convert to a clean boolean.”
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail'); 
    setIsLoggedIn(false);
    setShowLogout(false);
    window.location.href = '/'; // redirect to home
  };

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' }
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-200">
            <FileText className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">DocuSimplify</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`font-medium transition-colors duration-200 ${
                  location.pathname === item.path
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* CTA Buttons / User Icon */}
          <div className="flex items-center space-x-4 relative">
            {/* Login / User Icon */}
            {isLoggedIn ? (
              <div className="relative">
                <UserCircle
                  className="w-8 h-8 text-blue-600 cursor-pointer"
                  onClick={() => setShowLogout(!showLogout)}
                  title="User Menu"
                />
                {showLogout && (
                  <div className="absolute right-0 mt-2 w-24 bg-white border border-gray-200 rounded-lg shadow-lg text-center">
                    <button
                      onClick={handleLogout}
                      className="w-full py-2 px-2 hover:bg-gray-100 text-gray-700 rounded-lg"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-white border border-blue-600 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors duration-200"
              >
                Login
              </Link>
            )}

            {/* Try Now button stays intact */}
            <Link
              to="/app"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Try Now
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;