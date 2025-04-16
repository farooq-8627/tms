-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(100),
  email VARCHAR(255),
  password_hash VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(50) NOT NULL UNIQUE,
  host_user_id INTEGER REFERENCES users(id),
  name VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Biometric sessions table
CREATE TABLE IF NOT EXISTS biometric_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  room_id INTEGER REFERENCES rooms(id),
  start_time TIMESTAMP NOT NULL DEFAULT NOW(),
  end_time TIMESTAMP,
  description TEXT,
  metadata JSON
);

-- Heart rate measurements table
CREATE TABLE IF NOT EXISTS heart_rate_measurements (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES biometric_sessions(id),
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  bpm INTEGER NOT NULL,
  confidence REAL
);

-- Emotion measurements table
CREATE TABLE IF NOT EXISTS emotion_measurements (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES biometric_sessions(id),
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  dominant_emotion VARCHAR(50) NOT NULL,
  emotions JSON
);

-- Attention measurements table
CREATE TABLE IF NOT EXISTS attention_measurements (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES biometric_sessions(id),
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  attention_score INTEGER NOT NULL,
  fixation_count INTEGER,
  saccade_count INTEGER,
  blink_rate REAL
);

-- Eye tracking measurements table
CREATE TABLE IF NOT EXISTS eye_tracking_measurements (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES biometric_sessions(id),
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  left_eye_position JSON,
  right_eye_position JSON,
  gaze_direction JSON
);

-- Room participants table
CREATE TABLE IF NOT EXISTS room_participants (
  user_id INTEGER NOT NULL REFERENCES users(id),
  room_id INTEGER NOT NULL REFERENCES rooms(id),
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  left_at TIMESTAMP,
  role VARCHAR(50) DEFAULT 'viewer',
  PRIMARY KEY (user_id, room_id)
);