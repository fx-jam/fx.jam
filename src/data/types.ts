export interface SpotifyPlaylist {
  id: string;
  spotify_title: string;
  spotify_cover: string;
  spotify_tracks: number;
  visible: boolean;
  category: string;
  description: string;
}

export interface FacetMix {
  title: string;
  date: string;
  genre: string;
  duration_min: number;
  mixcloud_url: string;
  soundcloud_url: string;
  image: string;
}

export interface SonData {
  label: string;
  teaser: string;
  headline?: string;
  note_stub?: string;
  cover_image: string;
  bio: string;
  genres: string[];
  mixes: FacetMix[];
  spotify_user_id?: string;
  spotify_playlists?: SpotifyPlaylist[];
  links: {
    soundcloud: string;
    mixcloud: string;
    spotify: string;
    presskit: string;
    instagram: string;
    facebook: string;
  };
  photos?: string[];
  image_fond?: string;
}

export interface RegieEquipment {
  name: string;
  detail: string;
}

export interface RegieReference {
  event: string;
  venue: string;
  year: number;
  role: string;
}

export interface RegieData {
  label: string;
  teaser: string;
  headline?: string;
  note_stub?: string;
  cover_image: string;
  bio: string;
  equipment: RegieEquipment[];
  references: RegieReference[];
  contact_email: string;
  links?: Record<string, string>;
  photos?: string[];
  image_fond?: string;
}

export interface CoursCourse {
  title: string;
  description: string;
  level: string;
  tools: string;
  price: string;
  duration: string;
}

export interface CoursData {
  label: string;
  teaser: string;
  headline?: string;
  note_stub?: string;
  cover_image: string;
  bio?: string;
  intro: string;
  courses: CoursCourse[];
  schedule_info: string;
  registration_link: string;
  links?: Record<string, string>;
  photos?: string[];
  image_fond?: string;
}

export interface OutilTool {
  name: string;
  description: string;
  url: string;
  icon: string;
}

export interface OutilsData {
  label: string;
  teaser: string;
  headline?: string;
  note_stub?: string;
  cover_image: string;
  bio?: string;
  description: string;
  tools: OutilTool[];
  links?: Record<string, string>;
  photos?: string[];
  image_fond?: string;
}

export interface ContactData {
  label: string;
  teaser: string;
  headline?: string;
  note_stub?: string;
  cover_image: string;
  bio: string;
  email?: string;
  booking_email: string;
  press_kit_url: string;
  social: {
    mixcloud: string;
    soundcloud: string;
    spotify: string;
    instagram: string;
    facebook: string;
    youtube: string;
  };
  links?: Record<string, string>;
  photos?: string[];
  image_fond?: string;
}
