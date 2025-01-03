import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import moment from 'moment';
import { useCallback, useState } from 'react';

import { useUser } from '~/contexts/UserContext';
import { firestore } from '~/utils/firebase';

interface SwipedSong {
  swipeId: string;
  coverUrl: string;
  swipedAt: Date;
  beat_id: string;
}

interface GroupedSwipes {
  [key: string]: SwipedSong[];
}

export const useLibrary = () => {
  const { uid } = useUser();
  const [groupedSwipes, setGroupedSwipes] = useState<GroupedSwipes>({});

  const fetchSwipes = useCallback(async () => {
    if (!uid) {
      return;
    }

    try {
      const swipesQuery = query(
        collection(firestore, 'swipes'),
        where('liked', '==', true),
        where('deleted', '==', false)
      );

      const swipesSnapshot = await getDocs(swipesQuery);

      const swipesData = await Promise.all(
        swipesSnapshot.docs.map(async (swipeDoc) => {
          const swipeData = swipeDoc.data();
          const beatRef = doc(firestore, 'beats', swipeData.beat_id);
          const beatSnap = await getDoc(beatRef);
          const beatData = beatSnap.data();

          if (!beatSnap.exists() || !beatData) {
            console.warn(`Beat document missing for beat_id: ${swipeData.beat_id}`);
            return {
              ...swipeData,
              coverUrl: '',
              swipedAt: swipeData.swipedAt.toDate(),
              swipeId: swipeDoc.id,
              beat_id: swipeData.beat_id,
            };
          }

          return {
            ...swipeData,
            coverUrl: beatData.coverUrl || '',
            swipedAt: swipeData.swipedAt.toDate(),
            swipeId: swipeDoc.id,
            beat_id: swipeData.beat_id,
          };
        })
      );

      const validSwipesData = swipesData.filter(Boolean);

      // Group swipes by date
      const grouped = validSwipesData.reduce((acc, swipe) => {
        const daysAgo = moment().diff(moment(swipe.swipedAt), 'days');
        let dateLabel = '';

        switch (daysAgo) {
          case 0:
            dateLabel = 'Today';
            break;
          case 1:
            dateLabel = 'Yesterday';
            break;
          default:
            dateLabel = `${daysAgo} days ago`;
            break;
        }

        if (!acc[dateLabel]) {
          acc[dateLabel] = [];
        }
        acc[dateLabel].push(swipe);

        return acc;
      }, {} as GroupedSwipes);

      setGroupedSwipes(grouped);
    } catch (error) {
      console.error('Error fetching swipes:', error);
    }
  }, [uid]);

  return {
    groupedSwipes,
    refetch: fetchSwipes,
  };
};
