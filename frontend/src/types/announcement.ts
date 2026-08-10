export interface Announcement {
  id: string;
  org_id: string;
  title: string;
  content: string;
  author_id: string;
  is_pinned: boolean;
  created_at: string;
  author?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}
