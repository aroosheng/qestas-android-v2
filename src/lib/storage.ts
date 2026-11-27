import { supabase } from './supabase';

export async function uploadLawyerDocument(
  file: File,
  userId: string,
  docType: 'license' | 'national_id'
): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${docType}-${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from('lawyer-documents')
    .upload(fileName, file, { upsert: false });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data } = supabase.storage
    .from('lawyer-documents')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function getSignedDocumentUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('lawyer-documents')
    .createSignedUrl(path, 3600);

  if (error) {
    console.error('Signed URL error:', error);
    return null;
  }

  return data.signedUrl;
}

export async function uploadProfilePicture(
  file: File,
  userId: string
): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from('profile-pictures')
    .upload(fileName, file, { upsert: false });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data } = supabase.storage
    .from('profile-pictures')
    .getPublicUrl(fileName);

  return data.publicUrl;
}
