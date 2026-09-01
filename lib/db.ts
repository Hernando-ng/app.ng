import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.NODE_ENV === 'test'
  ? ':memory:'
  : path.join(process.cwd(), 'prisma', 'dev.db');

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema tables
db.exec(`
  CREATE TABLE IF NOT EXISTS User (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    passwordHash TEXT NOT NULL,
    image TEXT,
    bio TEXT DEFAULT 'Hey there! I am using app.ng.',
    isPhoneVerified INTEGER DEFAULT 0,
    isBusiness INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS BusinessProfile (
    id TEXT PRIMARY KEY,
    userId TEXT UNIQUE NOT NULL,
    businessName TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    operatingHours TEXT,
    contactEmail TEXT,
    contactPhone TEXT,
    website TEXT,
    address TEXT,
    isVerified INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES User(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS PrivacySettings (
    id TEXT PRIMARY KEY,
    userId TEXT UNIQUE NOT NULL,
    profileVisibility TEXT DEFAULT 'EVERYONE',
    lastSeenVisibility TEXT DEFAULT 'EVERYONE',
    readReceiptsEnabled INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES User(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Conversation (
    id TEXT PRIMARY KEY,
    isGroup INTEGER DEFAULT 0,
    name TEXT,
    groupImage TEXT,
    description TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ConversationMember (
    id TEXT PRIMARY KEY,
    conversationId TEXT NOT NULL,
    userId TEXT NOT NULL,
    isAdmin INTEGER DEFAULT 0,
    joinedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(conversationId) REFERENCES Conversation(id) ON DELETE CASCADE,
    FOREIGN KEY(userId) REFERENCES User(id) ON DELETE CASCADE,
    UNIQUE(conversationId, userId)
  );

  CREATE TABLE IF NOT EXISTS Message (
    id TEXT PRIMARY KEY,
    conversationId TEXT NOT NULL,
    senderId TEXT NOT NULL,
    content TEXT,
    mediaUrl TEXT,
    mediaType TEXT,
    fileName TEXT,
    fileSize INTEGER,
    replyToId TEXT,
    isForwarded INTEGER DEFAULT 0,
    isEdited INTEGER DEFAULT 0,
    deletedForEveryone INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(conversationId) REFERENCES Conversation(id) ON DELETE CASCADE,
    FOREIGN KEY(senderId) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY(replyToId) REFERENCES Message(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS MessageReceipt (
    id TEXT PRIMARY KEY,
    messageId TEXT NOT NULL,
    userId TEXT NOT NULL,
    status TEXT DEFAULT 'DELIVERED',
    readAt TEXT,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(messageId) REFERENCES Message(id) ON DELETE CASCADE,
    FOREIGN KEY(userId) REFERENCES User(id) ON DELETE CASCADE,
    UNIQUE(messageId, userId)
  );

  CREATE TABLE IF NOT EXISTS MessageDelete (
    id TEXT PRIMARY KEY,
    messageId TEXT NOT NULL,
    userId TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(messageId) REFERENCES Message(id) ON DELETE CASCADE,
    FOREIGN KEY(userId) REFERENCES User(id) ON DELETE CASCADE,
    UNIQUE(messageId, userId)
  );
`);

export default db;
