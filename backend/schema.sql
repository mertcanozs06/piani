-- ============================================================
-- AnıPini Database Schema (MSSQL Server)
-- ============================================================

-- 1. Veritabanı Oluşturma
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'AniPiniDB')
BEGIN
    CREATE DATABASE AniPiniDB;
END
GO

USE AniPiniDB;
GO

-- 2. Users (Kullanıcılar ve Kurumsal Mekanlar) Tablosu
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        FullName NVARCHAR(100) NOT NULL,
        Email NVARCHAR(100) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(255) NOT NULL,
        Bio NVARCHAR(500) NULL,
        AvatarUrl NVARCHAR(500) NULL,
        UserType NVARCHAR(20) NOT NULL DEFAULT 'individual', -- 'individual' (Bireysel) veya 'corporate' (Kurumsal/Mekan)
        Address NVARCHAR(300) NULL, -- Kurumsal Mekan Adresi
        Latitude FLOAT NULL, -- Kurumsal Mekan Enlem Koordinatı
        Longitude FLOAT NULL, -- Kurumsal Mekan Boylam Koordinatı
        IsPrivate BIT NOT NULL DEFAULT 0, -- Gizli Hesap Durumu (1 = Gizli, 0 = Açık)
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
    );
END
GO

-- 3. Categories (Kategoriler) Tablosu
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Categories')
BEGIN
    CREATE TABLE Categories (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(50) NOT NULL,
        Icon NVARCHAR(50) NOT NULL,
        ColorHex NVARCHAR(20) NOT NULL
    );

    INSERT INTO Categories (Name, Icon, ColorHex) VALUES
    (N'Gezi & Seyahat', N'compass', N'#F3D5D8'),
    (N'Yeme & İçme', N'utensils', N'#E2ECE9'),
    (N'Kültür & Sanat', N'palette', N'#DFE7F2'),
    (N'Özel Anı', N'heart', N'#FDE8E0'),
    (N'Doğa & Kamp', N'trees', N'#E2EFCB');
END
GO

-- 4. Pins (Konum Pinleri) Tablosu
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Pins')
BEGIN
    CREATE TABLE Pins (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        CategoryId INT NOT NULL FOREIGN KEY REFERENCES Categories(Id),
        SpotName NVARCHAR(150) NOT NULL,
        SpotSubtitle NVARCHAR(255) NULL,
        Latitude FLOAT NOT NULL,
        Longitude FLOAT NOT NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
    );
END
GO

-- 5. Memories (Anılar) Tablosu
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Memories')
BEGIN
    CREATE TABLE Memories (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        PinId INT NOT NULL FOREIGN KEY REFERENCES Pins(Id) ON DELETE CASCADE,
        UserId INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
        Title NVARCHAR(150) NOT NULL,
        Subtitle NVARCHAR(255) NULL,
        ContentText NVARCHAR(MAX) NULL,
        MediaType NVARCHAR(20) NOT NULL DEFAULT 'image', -- 'image', 'video', 'audio'
        MediaUrl NVARCHAR(500) NULL,
        MemoryDate DATE NOT NULL DEFAULT GETDATE(),
        Visibility NVARCHAR(30) NOT NULL DEFAULT 'public', -- 'public', 'followers', 'selected_followers', 'private'
        AllowedUserIds NVARCHAR(MAX) NULL, -- JSON array string örn: "[2,5,7]"
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
    );
END
GO

-- Dosya yüklemelerinden gelen data URL'ler için uzun medya adresleri
IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('Memories') AND name = 'MediaUrl'
)
BEGIN
    ALTER TABLE Memories ALTER COLUMN MediaUrl NVARCHAR(MAX) NULL;
END
GO

-- 6. MemoryLikes (Anı Beğenileri) Tablosu
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MemoryLikes')
BEGIN
    CREATE TABLE MemoryLikes (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        MemoryId INT NOT NULL FOREIGN KEY REFERENCES Memories(Id) ON DELETE CASCADE,
        UserId INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_Memory_User_Like UNIQUE (MemoryId, UserId)
    );
END
GO

-- 7. MemoryComments (Anı Yorumları & Alt Yorum Yanıtları) Tablosu
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MemoryComments')
BEGIN
    CREATE TABLE MemoryComments (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        MemoryId INT NOT NULL FOREIGN KEY REFERENCES Memories(Id) ON DELETE CASCADE,
        UserId INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
        ParentCommentId INT NULL FOREIGN KEY REFERENCES MemoryComments(Id),
        CommentText NVARCHAR(1000) NOT NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
    );
END
GO

-- 8. CommentLikes (Yorum Beğenileri) Tablosu
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CommentLikes')
BEGIN
    CREATE TABLE CommentLikes (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        CommentId INT NOT NULL FOREIGN KEY REFERENCES MemoryComments(Id) ON DELETE CASCADE,
        UserId INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_Comment_User_Like UNIQUE (CommentId, UserId)
    );
END
GO

-- 9. MemoryReposts (Kurumsal Hesap Retweet / Repost Tablosu)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MemoryReposts')
BEGIN
    CREATE TABLE MemoryReposts (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        MemoryId INT NOT NULL FOREIGN KEY REFERENCES Memories(Id) ON DELETE CASCADE,
        CorporateUserId INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_Corporate_Memory_Repost UNIQUE (MemoryId, CorporateUserId)
    );
END
GO

-- 10. Follows (Bireysel ve Kurumsal Takipçi / Takip İsteği Tablosu)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Follows')
BEGIN
    CREATE TABLE Follows (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        FollowerId INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
        FollowingId INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
        Status NVARCHAR(20) NOT NULL DEFAULT 'accepted', -- 'pending' (Takip İsteği Bekliyor) veya 'accepted' (Takip Ediliyor)
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_Follower_Following UNIQUE (FollowerId, FollowingId)
    );
END
GO

-- 11. SponsorshipBids (Açık Artırma & iyzico Ödemeli Sponsorluk Teklifleri Tablosu)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SponsorshipBids')
BEGIN
    CREATE TABLE SponsorshipBids (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        PinId INT NULL FOREIGN KEY REFERENCES Pins(Id),
        SpotName NVARCHAR(150) NOT NULL,
        SpotSubtitle NVARCHAR(255) NULL,
        Latitude FLOAT NOT NULL,
        Longitude FLOAT NOT NULL,
        BidAmount DECIMAL(18,2) NOT NULL,
        Currency NVARCHAR(10) NOT NULL DEFAULT 'USD', -- 'TL', 'USD', 'EUR'
        Duration NVARCHAR(20) NOT NULL DEFAULT 'monthly', -- 'monthly' (1 Ay) veya 'yearly' (1 Yıl)
        BidScoreTL DECIMAL(18,2) NOT NULL, -- TL cinsinden hesaplanmış puanlama
        PaymentStatus NVARCHAR(30) NOT NULL DEFAULT 'paid_iyzico', -- 'paid_iyzico'
        UserId INT NULL FOREIGN KEY REFERENCES Users(Id),
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
    );
END
GO
