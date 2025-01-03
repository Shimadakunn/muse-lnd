import * as DocumentPicker from 'expo-document-picker';
import { DocumentPickerAsset } from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { ImagePickerAsset } from 'expo-image-picker';
import { router } from 'expo-router';
import { addDoc, arrayUnion, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { useUser } from '~/contexts/UserContext';
import { auth, firestore, storage } from '~/utils/firebase';

interface UserProfile {
  username: string;
  email: string;
  profilePicture_url?: string;
  beats_ids?: string[];
  // Add other user fields as needed
}

export const useProfile = () => {
  const { uid } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [key, setKey] = useState('');
  const [bpm, setBpm] = useState('');
  const [coverUpload, setCoverUpload] = useState<ImagePickerAsset | null>(null);
  const [beatUpload, setBeatUpload] = useState<DocumentPickerAsset | null>(null);

  const fetchUserProfile = async () => {
    if (!uid) return;

    try {
      const userDoc = await getDoc(doc(firestore, 'users', uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data() as UserProfile);
      } else {
        console.log('No user document found!');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [uid]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert('Error', 'Image file is too large. Please choose a smaller image.');
        return;
      }
      setCoverUpload(asset);
    }
  };

  const pickBeat = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        if (selectedFile.size && selectedFile.size > 20 * 1024 * 1024) {
          Alert.alert('Error', 'Audio file is too large. Please choose a smaller file.');
          return;
        }
        setBeatUpload(selectedFile);
      }
    } catch (err) {
      console.error('Error selecting file:', err);
      Alert.alert('Error', 'Failed to select file. Please try again.');
    }
  };

  const uploadCover = async (beatId: string) => {
    if (!coverUpload) {
      Alert.alert('Error', 'Please select a cover');
      return null;
    }

    try {
      const imageRef = ref(storage, `covers/${beatId}`);
      const fileContent = await FileSystem.readAsStringAsync(coverUpload.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const blob = await fetch(`data:${coverUpload.type};base64,${fileContent}`).then((res) =>
        res.blob()
      );
      const uploadTask = uploadBytes(imageRef, blob);
      const snapshot = await uploadTask;
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Error uploading cover:', error);
      Alert.alert('Error', 'Failed to upload cover. Please try again.');
      return null;
    }
  };

  const uploadBeat = async (beatId: string) => {
    if (!beatUpload) {
      Alert.alert('Error', 'Please select a beat');
      return null;
    }

    try {
      const audioRef = ref(storage, `beats/${beatId}`);
      const response = await fetch(beatUpload.uri);
      const blob = await response.blob();
      const uploadTask = uploadBytes(audioRef, blob);
      const snapshot = await uploadTask;
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Error uploading beat:', error);
      Alert.alert('Error', 'Failed to upload beat. Please try again.');
      return null;
    }
  };

  const addSong = async () => {
    if (!uid) return;

    setLoading(true);
    try {
      const beatRef = await addDoc(collection(firestore, 'beats'), {
        title,
        key,
        bpm,
        uploadedAt: new Date(),
        creator_id: uid,
      });

      const beatId = beatRef.id;
      const [coverUrl, beatUrl] = await Promise.all([uploadCover(beatId), uploadBeat(beatId)]);

      await updateDoc(beatRef, {
        coverUrl,
        beatUrl,
      });

      const userRef = doc(firestore, 'users', uid);
      await updateDoc(userRef, {
        beats_ids: arrayUnion(beatId),
      });

      Alert.alert('Success', 'Beat created successfully!');
      router.back();
    } catch (error) {
      console.error('Error creating beat or updating users:', error);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    loading,
    title,
    setTitle,
    key,
    setKey,
    bpm,
    setBpm,
    coverUpload,
    beatUpload,
    pickImage,
    pickBeat,
    addSong,
    handleSignOut,
    userProfile,
    fetchUserProfile,
  };
};
