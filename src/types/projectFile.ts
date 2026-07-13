export type ProjectFileStatus = 'pending' | 'processing' | 'ready' | 'failed';

export interface ProjectFile {
  id: number;
  project: number;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  status: ProjectFileStatus;
  error_message: string;
  file_url: string;
  thumbnail_url: string | null;
  created_at: string;
}
