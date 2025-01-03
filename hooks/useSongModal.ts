import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { useLibrary } from './useLibrary';

import { useUser } from '~/contexts/UserContext';
import { firestore } from '~/utils/firebase';

interface UseSongModalProps {
  showModal: boolean;
  swipeId: string;
  setShowModal: (show: boolean) => void;
}

export const useSongModal = ({ showModal, swipeId, setShowModal }: UseSongModalProps) => {
  const { uid } = useUser();
  const { refetch } = useLibrary();
  const [song, setSong] = useState<any>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const router = useRouter();

  // Fetch song details using swipeId
  useEffect(() => {
    const fetchSongDetails = async () => {
      try {
        const swipeRef = doc(firestore, 'swipes', swipeId);
        const swipeSnap = await getDoc(swipeRef);
        const swipeData = swipeSnap.data();

        if (!swipeData) {
          console.error('Swipe data not found');
          return;
        }

        const beatId = swipeData.beat_id;
        const beatRef = doc(firestore, 'beats', beatId);
        const beatSnap = await getDoc(beatRef);
        const beatData = beatSnap.data();

        if (beatData) {
          setSong(beatData);
        } else {
          console.error('Beat data not found');
        }
      } catch (error) {
        console.error('Error fetching song details:', error);
      }
    };

    if (swipeId && showModal) {
      fetchSongDetails();
    }
  }, [showModal]);

  // Handle sound playback
  useEffect(() => {
    const playSound = async () => {
      if (song && song.beatUrl) {
        try {
          const { sound } = await Audio.Sound.createAsync({ uri: song.beatUrl });
          setSound(sound);
          await sound.playAsync();
        } catch (error) {
          console.error('Error playing sound:', error);
        }
      }
    };

    if (showModal) {
      playSound();
    } else {
      if (sound) {
        sound.stopAsync();
        sound.unloadAsync();
      }
      setSong(null);
      setSound(null);
    }

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [showModal, song]);

  const markSwipeAsDeleted = async () => {
    try {
      const swipeRef = doc(firestore, 'swipes', swipeId);
      await updateDoc(swipeRef, {
        deleted: true,
      });
      refetch();
      console.log(`Swipe ${swipeId} marked as deleted`);
    } catch (error) {
      console.error('Error marking swipe as deleted:', error);
    }
  };

  const handleMessageAction = async () => {
    if (!song || !uid) return;

    const creatorId = song.creator_id;
    const discussionsQuery = query(
      collection(firestore, 'discussions'),
      where('participants_ids', 'array-contains', uid)
    );

    const snapshot = await getDocs(discussionsQuery);
    let discussionId = null;

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.participants_ids.includes(creatorId)) {
        discussionId = doc.id;
      }
    });

    if (!discussionId) {
      const discussionRef = await addDoc(collection(firestore, 'discussions'), {
        participants_ids: [uid, creatorId],
        createdAt: new Date(),
      });
      discussionId = discussionRef.id;

      await Promise.all([
        updateDoc(doc(firestore, 'users', uid), {
          discussions_ids: arrayUnion(discussionId),
        }),
        updateDoc(doc(firestore, 'users', creatorId), {
          discussions_ids: arrayUnion(discussionId),
        }),
      ]);
    }
    setShowModal(false);
    router.push(`/chat/${discussionId}`);
  };

  return {
    song,
    markSwipeAsDeleted,
    handleMessageAction,
  };
};
