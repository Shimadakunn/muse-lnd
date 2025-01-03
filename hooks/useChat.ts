import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { useCallback, useState } from 'react';

import { useUser } from '~/contexts/UserContext';
import { firestore } from '~/utils/firebase';

interface Discussion {
  id: string;
  participants_ids: string[];
  createdAt: Timestamp;
  lastMessage?: {
    text: string;
    createdAt: Timestamp;
  };
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: Timestamp;
}

interface ChatParticipant {
  uid: string;
  username: string;
  profilePicture_url: string;
}

export const useChat = (discussionId?: string) => {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participant, setParticipant] = useState<ChatParticipant | null>(null);
  const { uid } = useUser();

  const fetchDiscussions = useCallback(async () => {
    if (!uid) return;

    const discussionsQuery = query(
      collection(firestore, 'discussions'),
      where('participants_ids', 'array-contains', uid)
    );

    const unsubscribe = onSnapshot(discussionsQuery, async (snapshot) => {
      const discussionsData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          const messagesQuery = query(
            collection(firestore, 'discussions', doc.id, 'messages'),
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          const messagesSnapshot = await getDocs(messagesQuery);
          let lastMessage;
          if (!messagesSnapshot.empty) {
            const lastMessageDoc = messagesSnapshot.docs[0];
            lastMessage = {
              text: lastMessageDoc.data().text,
              createdAt: lastMessageDoc.data().createdAt,
            };
          }
          return {
            id: doc.id,
            ...data,
            lastMessage,
          } as Discussion;
        })
      );
      setDiscussions(discussionsData);
    });

    return unsubscribe;
  }, [uid]);

  const fetchMessages = useCallback(() => {
    if (!discussionId) return;

    const messagesRef = collection(firestore, 'discussions', discussionId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Message
      );
      setMessages(fetchedMessages);
    });

    return unsubscribe;
  }, [discussionId]);

  const fetchParticipantInfo = useCallback(async () => {
    if (!discussionId || !uid) return;

    const discussionRef = doc(firestore, 'discussions', discussionId);
    const discussionSnap = await getDoc(discussionRef);

    if (discussionSnap.exists()) {
      const discussionData = discussionSnap.data();
      const participantId = discussionData.participants_ids.find((id: string) => id !== uid);

      if (participantId) {
        const participantRef = doc(firestore, 'users', participantId);
        const participantSnap = await getDoc(participantRef);

        if (participantSnap.exists()) {
          const participantData = participantSnap.data();
          setParticipant({
            uid: participantId,
            username: participantData.username,
            profilePicture_url: participantData.profilePicture_url,
          });
        }
      }
    }
  }, [discussionId, uid]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (text.trim() === '' || !uid || !discussionId) return;

      const messagesRef = collection(firestore, 'discussions', discussionId, 'messages');
      await addDoc(messagesRef, {
        text,
        senderId: uid,
        createdAt: Timestamp.now(),
      });
    },
    [discussionId, uid]
  );

  const fetchOtherUserInfo = useCallback(
    async (discussionItem: Discussion) => {
      if (!uid) return null;

      const otherUserId = discussionItem.participants_ids.find((id) => id !== uid);
      if (otherUserId) {
        const userDocRef = doc(firestore, 'users', otherUserId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          return userDoc.data() as { username: string; profilePicture_url: string };
        }
      }
      return null;
    },
    [uid]
  );

  return {
    discussions,
    messages,
    participant,
    fetchDiscussions,
    fetchMessages,
    fetchParticipantInfo,
    sendMessage,
    fetchOtherUserInfo,
  };
};
