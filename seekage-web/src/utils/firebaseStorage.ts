import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { firebaseStorage } from './firebase';

const safeSegment = (value: string) =>
  value.trim().replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');

export async function uploadContentFileToFirebase(
  file: File,
  groupId: string,
  subjectId: string
) {
  if (!firebaseStorage) {
    throw new Error('Firebase is not configured. Add Firebase values to seekage-web/.env.');
  }

  const fileName = safeSegment(file.name || 'content-file');
  const path = `content/${safeSegment(groupId)}/${safeSegment(subjectId)}/${Date.now()}-${fileName}`;
  const fileRef = ref(firebaseStorage, path);

  const snapshot = await uploadBytes(fileRef, file, {
    contentType: file.type || 'application/octet-stream',
  });
  const downloadUrl = await getDownloadURL(snapshot.ref);

  return { downloadUrl, path };
}
