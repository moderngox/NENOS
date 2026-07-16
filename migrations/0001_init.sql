CREATE TABLE books (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  traits TEXT NOT NULL DEFAULT '[]',
  universe TEXT NOT NULL,
  story_prompt TEXT NOT NULL,
  appearance_details TEXT NOT NULL DEFAULT '',
  hair_color TEXT,
  eye_color TEXT,
  secondary_characters TEXT NOT NULL DEFAULT '[]',
  photo_key TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  pages TEXT,
  front_cover TEXT,
  back_cover TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
