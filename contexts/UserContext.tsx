import { GoogleAuthProvider, signInWithCredential } from '@firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { auth } from '~/utils/firebase';

interface UserContextType {
  uid: string | null;
  setUid: React.Dispatch<React.SetStateAction<string | null>>;
  promptAsync: () => void;
  request: any;
  isPurchased: boolean;
  setIsPurchased: React.Dispatch<React.SetStateAction<boolean>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uid, setUid] = useState<string | null>(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        setUid(firebaseUser.uid);
      } else {
        setUid(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { accessToken, idToken } = response.authentication ?? {};
      const credential = GoogleAuthProvider.credential(idToken, accessToken);

      signInWithCredential(auth, credential)
        .then((userCredential) => console.log(userCredential))
        .catch((error) => {
          console.log({ error });
        });
    }
  }, [response]);

  return (
    <UserContext.Provider
      value={{ uid, setUid, promptAsync, request, isPurchased, setIsPurchased }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
