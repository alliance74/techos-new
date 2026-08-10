export interface Document {
  id: string;
  org_id: string;
  /** API title (preferred) */
  title?: string;
  /** Legacy alias */
  name?: string;
  content?: string;
  type?: string;
  folder?: string | Folder;
  file_url?: string;
  file_type?: string;
  file_size?: number;
  storage_path?: string | null;
  file_mime?: string | null;
  /** True when file can be opened via API or remote URL */
  can_view?: boolean;
  folder_id?: string;
  uploaded_by?: string;
  created_by?: string;
  version?: number;
  is_current_version?: boolean;
  tags?: string[];
  created_at: string;
  updated_at?: string;
}

export interface Folder {
  id: string;
  org_id: string;
  name: string;
  parent_folder_id?: string;
  created_by: string;
  created_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version: number;
  file_url: string;
  uploaded_by: string;
  changes_description?: string;
  created_at: string;
}
