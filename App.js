import React, {useState} from 'react';
import RootNavigator from './app/navigation/RootNavigator';

export default function App() {
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const handleLogin = (role = "user") => {
    setIsLoggedIn(true);
    setUserRole(role);
  };

  return (
    <RootNavigator 
      isLoggedIn={isLoggedIn} 
      userRole={userRole} 
      onLogin={handleLogin} 
    />
  );
}
