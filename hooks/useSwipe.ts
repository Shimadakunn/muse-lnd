import { Audio } from 'expo-av';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

import { useUser } from '~/contexts/UserContext';
import { firestore } from '~/utils/firebase';

interface Beat {
  id: string;
  title: string;
  beatUrl: string;
  creator_id: string;
  creator_username?: string;
  // ... other beat properties
}

export const useSwipe = () => {
  const { uid } = useUser();
  const [songs, setSongs] = useState<Beat[]>([]);
  const [swipeHistory, setSwipeHistory] = useState<string[]>([]); // Store swipe IDs
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch songs from the database
  const fetchSongs = useCallback(async () => {
    try {
      // First, get the user's swipe history
      const userRef = doc(firestore, 'users', uid!);
      const userDoc = await getDoc(userRef);
      const userSwipes = userDoc.data()?.swipes_ids || [];
      setSwipeHistory(userSwipes);

      // Get all swipes for this user
      const swipesQuery = query(collection(firestore, 'swipes'), where('swiper_id', '==', uid));
      const swipesSnapshot = await getDocs(swipesQuery);
      const swipedBeatIds = swipesSnapshot.docs.map((doc) => doc.data().beat_id);

      let songsData: Beat[];
      if (swipedBeatIds.length > 0) {
        // Fetch beats that haven't been swiped
        const beatsQuery = query(
          collection(firestore, 'beats'),
          where(documentId(), 'not-in', swipedBeatIds)
        );
        const querySnapshot = await getDocs(beatsQuery);
        songsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Beat[];
      } else {
        // If no beats have been swiped, fetch all beats
        const beatsQuery = query(collection(firestore, 'beats'));
        const querySnapshot = await getDocs(beatsQuery);
        songsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Beat[];
      }

      // Fetch creator usernames
      const creatorIds = [...new Set(songsData.map((song) => song.creator_id))];
      const usersQuery = query(
        collection(firestore, 'users'),
        where(documentId(), 'in', creatorIds)
      );
      const usersSnapshot = await getDocs(usersQuery);
      const userMap = new Map(usersSnapshot.docs.map((doc) => [doc.id, doc.data().username]));

      // Add creator usernames to songs
      const songsWithCreators = songsData.map((song) => ({
        ...song,
        creator_username: userMap.get(song.creator_id) || 'Unknown User',
      }));

      setSongs(songsWithCreators);
    } catch (error) {
      console.error('Error fetching songs:', error);
    }
  }, [uid]);

  // Play sound
  const playSound = async (audioUrl: string) => {
    if (!audioUrl) {
      console.error('Audio URL is null or undefined');
      return;
    }

    try {
      console.log('Playing sound:', audioUrl);
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  // Stop current sound
  const stopSound = async () => {
    if (sound) {
      await sound.stopAsync();
    }
  };

  // Clean up sound when component unmounts
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // Handle sound playback when card changes
  useEffect(() => {
    stopSound();
    const currentSong = songs[currentIndex];
    if (currentSong) {
      playSound(currentSong.beatUrl);
    }
  }, [currentIndex, songs]);

  // Record swipe in database
  const handleSwipe = async (beatId: string, liked: boolean) => {
    try {
      // Create a new swipe document
      const swipeRef = await addDoc(collection(firestore, 'swipes'), {
        swiper_id: uid,
        beat_id: beatId,
        swipedAt: Timestamp.now(),
        liked,
        deleted: false,
      });

      const swipeId = swipeRef.id;

      // Update user document
      const userRef = doc(firestore, 'users', uid!);
      await updateDoc(userRef, {
        swipes_ids: arrayUnion(swipeId),
      });

      // Update beat document
      const beatRef = doc(firestore, 'beats', beatId);
      await updateDoc(beatRef, {
        swipes_ids: arrayUnion(swipeId),
      });

      setSwipeHistory((prev) => [...prev, swipeId]);
      console.log(`Swipe recorded for beat ${beatId}, liked: ${liked}, swipe ID: ${swipeId}`);
    } catch (error) {
      console.error('Error recording swipe:', error);
    }
  };

  // Cancel current swipe
  const handleSwipeBack = async () => {
    if (swipeHistory.length > 0) {
      const lastSwipeId = swipeHistory[swipeHistory.length - 1];
      try {
        // Get the swipe document
        const swipeRef = doc(firestore, 'swipes', lastSwipeId);
        const swipeSnap = await getDoc(swipeRef);
        const swipeData = swipeSnap.data();

        if (swipeData) {
          // Remove swipe ID from user document
          const userRef = doc(firestore, 'users', uid!);
          await updateDoc(userRef, {
            swipes_ids: arrayRemove(lastSwipeId),
          });

          // Remove swipe ID from beat document
          const beatRef = doc(firestore, 'beats', swipeData.beat_id);
          await updateDoc(beatRef, {
            swipes_ids: arrayRemove(lastSwipeId),
          });

          // Delete the swipe document
          await deleteDoc(swipeRef);

          setSwipeHistory((prev) => prev.slice(0, -1));
          console.log(`Removed swipe ${lastSwipeId}`);
        }
      } catch (error) {
        console.error('Error removing swipe:', error);
      }
    }
  };

  return {
    songs,
    setCurrentIndex,
    handleSwipe,
    handleSwipeBack,
    fetchSongs,
  };
};
