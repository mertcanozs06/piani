const { getPool, sql } = require('../config/db');

// @desc   Kullanıcı Profilini ve İstatistiklerini Getir
// @route  GET /api/users/profile
const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const pool = getPool();

    // Kullanıcı bilgisi
    const userResult = await pool.request()
      .input('Id', sql.Int, userId)
      .query('SELECT Id, FullName, Email, Bio, AvatarUrl, UserType, CreatedAt FROM Users WHERE Id = @Id');

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
    }

    const user = userResult.recordset[0];
    const userType = user.UserType || 'individual';

    // İstatistikler: Kullanıcının eklediği toplam anı sayısı
    const memStatsResult = await pool.request()
      .input('UserId', sql.Int, userId)
      .query('SELECT COUNT(*) as MemoryCount FROM Memories WHERE UserId = @UserId');

    const memoryCount = memStatsResult.recordset[0].MemoryCount || 0;

    // Takipçi ve Takip Edilen sayıları
    let followersCount = 0;
    let followingCount = 0;

    const followersResult = await pool.request()
      .input('UserId', sql.Int, userId)
      .query('SELECT COUNT(*) as Count FROM Follows WHERE FollowingId = @UserId');
    followersCount = followersResult.recordset[0].Count || 0;

    if (userType === 'individual') {
      const followingResult = await pool.request()
        .input('UserId', sql.Int, userId)
        .query('SELECT COUNT(*) as Count FROM Follows WHERE FollowerId = @UserId');
      followingCount = followingResult.recordset[0].Count || 0;
    }

    // Kullanıcının doğrudan eklediği anılar
    const memoriesResult = await pool.request()
      .input('UserId', sql.Int, userId)
      .query(`
        SELECT 
          m.Id, m.Title, m.Subtitle, m.ContentText, m.MediaType, m.MediaUrl, m.MemoryDate, m.Visibility, m.CreatedAt,
          p.Id as PinId, p.SpotName, p.SpotSubtitle, p.Latitude, p.Longitude,
          c.Id as CategoryId, c.Name as CategoryName, c.Icon as CategoryIcon, c.ColorHex as CategoryColor
        FROM Memories m
        INNER JOIN Pins p ON m.PinId = p.Id
        INNER JOIN Categories c ON p.CategoryId = c.Id
        WHERE m.UserId = @UserId
        ORDER BY m.CreatedAt DESC
      `);

    const ownMemories = memoriesResult.recordset.map(mem => ({
      id: mem.Id,
      title: mem.Title,
      subtitle: mem.Subtitle,
      contentText: mem.ContentText,
      mediaType: mem.MediaType,
      mediaUrl: mem.MediaUrl,
      memoryDate: mem.MemoryDate,
      visibility: mem.Visibility || 'public',
      createdAt: mem.CreatedAt,
      pin: {
        id: mem.PinId,
        spotName: mem.SpotName,
        spotSubtitle: mem.SpotSubtitle,
        latitude: mem.Latitude,
        longitude: mem.Longitude,
        category: {
          id: mem.CategoryId,
          name: mem.CategoryName,
          icon: mem.CategoryIcon,
          colorHex: mem.CategoryColor
        }
      }
    }));

    // Kurumsal hesap için repost edilen (retweeted) anılar
    let repostedMemories = [];
    if (userType === 'corporate') {
      const repostsResult = await pool.request()
        .input('CorporateUserId', sql.Int, userId)
        .query(`
          SELECT 
            m.Id, m.Title, m.Subtitle, m.ContentText, m.MediaType, m.MediaUrl, m.MemoryDate, m.CreatedAt,
            u.Id as AuthorId, u.FullName as AuthorFullName, u.AvatarUrl as AuthorAvatar,
            p.Id as PinId, p.SpotName, p.SpotSubtitle, p.Latitude, p.Longitude,
            c.Id as CategoryId, c.Name as CategoryName, c.Icon as CategoryIcon, c.ColorHex as CategoryColor
          FROM MemoryReposts r
          INNER JOIN Memories m ON r.MemoryId = m.Id
          INNER JOIN Users u ON m.UserId = u.Id
          INNER JOIN Pins p ON m.PinId = p.Id
          INNER JOIN Categories c ON p.CategoryId = c.Id
          WHERE r.CorporateUserId = @CorporateUserId
          ORDER BY r.CreatedAt DESC
        `);

      repostedMemories = repostsResult.recordset.map(mem => ({
        id: mem.Id,
        title: mem.Title,
        subtitle: mem.Subtitle,
        contentText: mem.ContentText,
        mediaType: mem.MediaType,
        mediaUrl: mem.MediaUrl,
        memoryDate: mem.MemoryDate,
        createdAt: mem.CreatedAt,
        isReposted: true,
        isRepostedByMe: true,
        author: {
          id: mem.AuthorId,
          fullName: mem.AuthorFullName,
          avatarUrl: mem.AuthorAvatar
        },
        pin: {
          id: mem.PinId,
          spotName: mem.SpotName,
          spotSubtitle: mem.SpotSubtitle,
          latitude: mem.Latitude,
          longitude: mem.Longitude,
          category: {
            id: mem.CategoryId,
            name: mem.CategoryName,
            icon: mem.CategoryIcon,
            colorHex: mem.CategoryColor
          }
        }
      }));
    }

    return res.json({
      success: true,
      data: {
        user: {
          id: user.Id,
          fullName: user.FullName,
          email: user.Email,
          bio: user.Bio,
          avatarUrl: user.AvatarUrl,
          userType
        },
        stats: {
          totalPins: memoryCount,
          memoryCount,
          followersCount,
          followingCount
        },
        memories: ownMemories,
        repostedMemories
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Kullanıcı Biyografisini Güncelle
// @route  PUT /api/users/profile
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { bio, fullName, avatarUrl, email } = req.body;
    const pool = getPool();
    let normalizedEmail = null;
    if (email !== undefined) {
      normalizedEmail = String(email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({ success: false, message: 'Geçerli bir e-posta adresi girin.' });
      }
    }

    const request = pool.request()
      .input('Id', sql.Int, userId)
      .input('Bio', sql.NVarChar, bio)
      .input('FullName', sql.NVarChar, fullName)
      .input('AvatarUrl', sql.NVarChar, avatarUrl || null)
      .input('Email', sql.NVarChar(100), normalizedEmail);

    await request.query(`
        UPDATE Users 
        SET Bio = COALESCE(@Bio, Bio),
            FullName = COALESCE(@FullName, FullName),
            AvatarUrl = COALESCE(@AvatarUrl, AvatarUrl),
            Email = COALESCE(@Email, Email)
        WHERE Id = @Id
      `);

    return res.json({ success: true, message: 'Profil bilgileri güncellendi.' });
  } catch (error) {
    next(error);
  }
};

// @desc   Kullanıcı ve Mekan Arama
// @route  GET /api/users/search
const searchUsersAndVenues = async (req, res, next) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user ? req.user.id : null;
    const pool = getPool();

    if (!query || !query.trim()) {
      return res.json({ success: true, data: [] });
    }

    const searchPattern = `%${query.trim()}%`;
    const usersResult = await pool.request()
      .input('Query', sql.NVarChar, searchPattern)
      .query(`
        SELECT Id, FullName, Email, Bio, AvatarUrl, UserType, CreatedAt
        FROM Users
        WHERE FullName LIKE @Query OR Email LIKE @Query
        ORDER BY UserType DESC, FullName ASC
      `);

    const searchResults = [];

    for (const u of usersResult.recordset) {
      // Takipçi Sayısı
      const followersRes = await pool.request()
        .input('UserId', sql.Int, u.Id)
        .query('SELECT COUNT(*) as Count FROM Follows WHERE FollowingId = @UserId');
      const followerCount = followersRes.recordset[0].Count || 0;

      // Kullanıcı takip ediyor mu?
      let isFollowing = false;
      if (currentUserId) {
        const checkFollow = await pool.request()
          .input('FollowerId', sql.Int, currentUserId)
          .input('FollowingId', sql.Int, u.Id)
          .query('SELECT 1 FROM Follows WHERE FollowerId = @FollowerId AND FollowingId = @FollowingId');
        isFollowing = checkFollow.recordset.length > 0;
      }

      searchResults.push({
        id: u.Id,
        fullName: u.FullName,
        email: u.Email,
        bio: u.Bio,
        avatarUrl: u.AvatarUrl,
        userType: u.UserType || 'individual',
        followerCount,
        isFollowing
      });
    }

    return res.json({ success: true, data: searchResults });
  } catch (error) {
    next(error);
  }
};

// @desc   Kullanıcı veya Mekanı Takip Et / Takipten Çık
// @route  POST /api/users/:id/follow
const toggleFollowUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    if (parseInt(targetUserId, 10) === currentUserId) {
      return res.status(400).json({ success: false, message: 'Kendi hesabınızı takip edemezsiniz.' });
    }

    const pool = getPool();
    const checkFollow = await pool.request()
      .input('FollowerId', sql.Int, currentUserId)
      .input('FollowingId', sql.Int, targetUserId)
      .query('SELECT * FROM Follows WHERE FollowerId = @FollowerId AND FollowingId = @FollowingId');

    if (checkFollow.recordset.length > 0) {
      await pool.request()
        .input('FollowerId', sql.Int, currentUserId)
        .input('FollowingId', sql.Int, targetUserId)
        .query('DELETE FROM Follows WHERE FollowerId = @FollowerId AND FollowingId = @FollowingId');

      return res.json({ success: true, isFollowing: false, message: 'Takipten çıkıldı.' });
    } else {
      await pool.request()
        .input('FollowerId', sql.Int, currentUserId)
        .input('FollowingId', sql.Int, targetUserId)
        .query('INSERT INTO Follows (FollowerId, FollowingId) VALUES (@FollowerId, @FollowingId)');

      return res.json({ success: true, isFollowing: true, message: 'Hesap takip edilmeye başlandı 🌸' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc   Başka Bir Kullanıcının/Mekanın Profilini Getir
// @route  GET /api/users/:id/profile
const getUserProfileById = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user ? req.user.id : null;
    const pool = getPool();

    const userResult = await pool.request()
      .input('Id', sql.Int, targetUserId)
      .query('SELECT Id, FullName, Email, Bio, AvatarUrl, UserType, Address, Latitude, Longitude, IsPrivate, CreatedAt FROM Users WHERE Id = @Id');

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
    }

    const user = userResult.recordset[0];
    const userType = user.UserType || 'individual';

    // Takipçi Sayısı
    const followersResult = await pool.request()
      .input('UserId', sql.Int, targetUserId)
      .query('SELECT COUNT(*) as Count FROM Follows WHERE FollowingId = @UserId');
    const followersCount = followersResult.recordset[0].Count || 0;

    let followingCount = 0;
    if (userType === 'individual') {
      const followingResult = await pool.request()
        .input('UserId', sql.Int, targetUserId)
        .query('SELECT COUNT(*) as Count FROM Follows WHERE FollowerId = @UserId');
      followingCount = followingResult.recordset[0].Count || 0;
    }

    // Takip İlişkisi Durumu ('none', 'pending', 'accepted')
    let followStatus = 'none';
    if (currentUserId) {
      const followResult = await pool.request()
        .input('FollowerId', sql.Int, currentUserId)
        .input('FollowingId', sql.Int, targetUserId)
        .query('SELECT Status FROM Follows WHERE FollowerId = @FollowerId AND FollowingId = @FollowingId');
      if (followResult.recordset.length > 0) {
        followStatus = followResult.recordset[0].Status || 'accepted';
      }
    }

    // Eğer kullanıcı gizli ise ve takipçi kabul edilmemişse anılar kilitlenir!
    const isLocked = user.IsPrivate && followStatus !== 'accepted' && currentUserId !== parseInt(targetUserId, 10);

    let ownMemories = [];
    if (!isLocked) {
      const memoriesResult = await pool.request()
        .input('UserId', sql.Int, targetUserId)
        .query(`
          SELECT 
            m.Id, m.Title, m.Subtitle, m.ContentText, m.MediaType, m.MediaUrl, m.MemoryDate, m.Visibility, m.CreatedAt,
            p.Id as PinId, p.SpotName, p.SpotSubtitle, p.Latitude, p.Longitude,
            c.Id as CategoryId, c.Name as CategoryName, c.Icon as CategoryIcon, c.ColorHex as CategoryColor
          FROM Memories m
          INNER JOIN Pins p ON m.PinId = p.Id
          INNER JOIN Categories c ON p.CategoryId = c.Id
          WHERE m.UserId = @UserId
          ORDER BY m.CreatedAt DESC
        `);

      ownMemories = memoriesResult.recordset.map(mem => ({
        id: mem.Id,
        title: mem.Title,
        subtitle: mem.Subtitle,
        contentText: mem.ContentText,
        mediaType: mem.MediaType,
        mediaUrl: mem.MediaUrl,
        memoryDate: mem.MemoryDate,
        visibility: mem.Visibility || 'public',
        createdAt: mem.CreatedAt,
        pin: {
          id: mem.PinId,
          spotName: mem.SpotName,
          spotSubtitle: mem.SpotSubtitle,
          latitude: mem.Latitude,
          longitude: mem.Longitude,
          category: {
            id: mem.CategoryId,
            name: mem.CategoryName,
            icon: mem.CategoryIcon,
            colorHex: mem.CategoryColor
          }
        }
      }));
    }

    return res.json({
      success: true,
      data: {
        user: {
          id: user.Id,
          fullName: user.FullName,
          email: user.Email,
          bio: user.Bio,
          avatarUrl: user.AvatarUrl,
          userType,
          address: user.Address,
          latitude: user.Latitude,
          longitude: user.Longitude,
          isPrivate: user.IsPrivate
        },
        stats: {
          totalPins: ownMemories.length,
          followersCount,
          followingCount
        },
        followStatus,
        isLocked,
        memories: ownMemories
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  getUserProfileById,
  updateProfile,
  searchUsersAndVenues,
  toggleFollowUser
};
