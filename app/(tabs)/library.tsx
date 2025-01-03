// Page de la bibliothèque des utilisateurs c'est ici
// que les utilisateurs peuvent voir les musiques qu'ils ont ajoutées à leur bibliothèque

import { Stack } from 'expo-router';
import React from 'react';

import Library from '~/components/LibraryPage/Library';

export default function Home() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Library />
    </>
  );
}
