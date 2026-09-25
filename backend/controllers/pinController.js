const { getPool, sql } = require('../config/db');

const isCorporateVenue = async (pool, latitude, longitude) => {
  const result = await pool.request()
    .input('Latitude', sql.Float, latitude)
    .input('Longitude', sql.Float, longitude)
    .query(`
      SELECT TOP 1 1 AS IsVenue
      FROM Users
      WHERE UserType = 'corporate'
        AND Latitude IS NOT NULL AND Longitude IS NOT NULL
        AND ABS(Latitude - @Latitude) < 0.0015
        AND ABS(Longitude - @Longitude) < 0.0015
    `);
  return result.recordset.length > 0;
};

// @desc   Tüm Konum Pinlerini Getir (İçerdikleri Anı Sayısı İle)
// @route  GET /api/pins
const getAllPins = async (req, res, next) => {
  try {
    const { categoryId } = req.query;
    const pool = getPool();

    let query = `
      SELECT 
        p.Id, p.SpotName, p.SpotSubtitle, p.Latitude, p.Longitude, p.CreatedAt,
        p.CategoryId, c.Name as CategoryName, c.Icon as CategoryIcon, c.ColorHex as CategoryColor,
        COUNT(DISTINCT m.Id) as MemoryCount,
        MAX(CASE WHEN u.UserType = 'corporate' THEN 1 ELSE 0 END) as IsVenue
      FROM Pins p
      INNER JOIN Categories c ON p.CategoryId = c.Id
      LEFT JOIN Memories m ON p.Id = m.PinId
      LEFT JOIN Users u ON u.UserType = 'corporate'
        AND u.Latitude IS NOT NULL AND u.Longitude IS NOT NULL
        AND ABS(u.Latitude - p.Latitude) < 0.0015
        AND ABS(u.Longitude - p.Longitude) < 0.0015
      WHERE 1=1
    `;

    const request = pool.request();

    if (categoryId) {
      query += ` AND p.CategoryId = @CategoryId`;
      request.input('CategoryId', sql.Int, categoryId);
    }

    query += ` GROUP BY p.Id, p.SpotName, p.SpotSubtitle, p.Latitude, p.Longitude, p.CreatedAt, p.CategoryId, c.Name, c.Icon, c.ColorHex ORDER BY p.CreatedAt DESC`;

    const result = await request.query(query);

    const pins = result.recordset.map(row => ({
      id: row.Id,
      spotName: row.SpotName,
      spotSubtitle: row.SpotSubtitle,
      latitude: row.Latitude,
      longitude: row.Longitude,
      createdAt: row.CreatedAt,
      memoryCount: row.MemoryCount || 0,
      isVenue: row.IsVenue === 1,
      category: {
        id: row.CategoryId,
        name: row.CategoryName,
        icon: row.CategoryIcon,
        colorHex: row.CategoryColor
      }
    }));

    return res.json({ success: true, count: pins.length, data: pins });
  } catch (error) {
    next(error);
  }
};

// @desc   Bir Pindeki Tüm Anıları ve Detayları Getir (Foto/Video/Ses, Beğeniler, Yorumlar)
// @route  GET /api/pins/:id
const getPinDetails = async (req, res, next) => {
  try {
    const pinId = req.params.id;
    const currentUserId = req.user ? req.user.id : null;
    const pool = getPool();

    // 1. Pin Bilgisi
    const pinResult = await pool.request()
      .input('Id', sql.Int, pinId)
      .query(`
        SELECT p.*, c.Name as CategoryName, c.Icon as CategoryIcon, c.ColorHex as CategoryColor
        FROM Pins p
        INNER JOIN Categories c ON p.CategoryId = c.Id
        WHERE p.Id = @Id
      `);

    if (pinResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Pin konumu bulunamadı.' });
    }

    const pinRow = pinResult.recordset[0];

    // 2. Anılar
    const memoriesResult = await pool.request()
      .input('PinId', sql.Int, pinId)
      .query(`
        SELECT 
          m.Id, m.Title, m.Subtitle, m.ContentText, m.MediaType, m.MediaUrl, m.MemoryDate, m.CreatedAt,
          u.Id as UserId, u.FullName as UserFullName, u.AvatarUrl as UserAvatar, u.UserType
        FROM Memories m
        INNER JOIN Users u ON m.UserId = u.Id
        WHERE m.PinId = @PinId
        ORDER BY m.CreatedAt DESC
      `);

    const memories = [];

    for (const mem of memoriesResult.recordset) {
      // Beğeni Sayısı ve Kullanıcının Beğenip Beğenmediği
      const likesResult = await pool.request()
        .input('MemoryId', sql.Int, mem.Id)
        .query('SELECT COUNT(*) as LikeCount FROM MemoryLikes WHERE MemoryId = @MemoryId');
      
      let isLikedByMe = false;
      if (currentUserId) {
        const myLikeResult = await pool.request()
          .input('MemoryId', sql.Int, mem.Id)
          .input('UserId', sql.Int, currentUserId)
          .query('SELECT 1 FROM MemoryLikes WHERE MemoryId = @MemoryId AND UserId = @UserId');
        isLikedByMe = myLikeResult.recordset.length > 0;
      }

      // Yorumlar
      const commentsResult = await pool.request()
        .input('MemoryId', sql.Int, mem.Id)
        .query(`
          SELECT c.Id, c.ParentCommentId, c.CommentText, c.CreatedAt,
            u.Id as UserId, u.FullName as UserFullName, u.AvatarUrl as UserAvatar
          FROM MemoryComments c
          INNER JOIN Users u ON c.UserId = u.Id
          WHERE c.MemoryId = @MemoryId
          ORDER BY c.CreatedAt ASC
        `);

      const commentRows = commentsResult.recordset;
      const commentsById = new Map();
      for (const comment of commentRows) {
        const likes = await pool.request()
          .input('CommentId', sql.Int, comment.Id)
          .query('SELECT COUNT(*) as LikeCount FROM CommentLikes WHERE CommentId = @CommentId');
        let isLikedByMe = false;
        if (currentUserId) {
          const myLike = await pool.request()
            .input('CommentId', sql.Int, comment.Id)
            .input('UserId', sql.Int, currentUserId)
            .query('SELECT 1 FROM CommentLikes WHERE CommentId = @CommentId AND UserId = @UserId');
          isLikedByMe = myLike.recordset.length > 0;
        }
        commentsById.set(comment.Id, {
          id: comment.Id,
          parentCommentId: comment.ParentCommentId,
          commentText: comment.CommentText,
          createdAt: comment.CreatedAt,
          likeCount: likes.recordset[0].LikeCount || 0,
          isLikedByMe,
          replies: [],
          user: {
            id: comment.UserId,
            fullName: comment.UserFullName,
            avatarUrl: comment.UserAvatar
          }
        });
      }
      const topLevelComments = [];
      for (const comment of commentsById.values()) {
        if (comment.parentCommentId && commentsById.has(comment.parentCommentId)) {
          commentsById.get(comment.parentCommentId).replies.push(comment);
        } else {
          topLevelComments.push(comment);
        }
      }

      const repostCountResult = await pool.request()
        .input('MemoryId', sql.Int, mem.Id)
        .query('SELECT COUNT(*) as RepostCount FROM MemoryReposts WHERE MemoryId = @MemoryId');
      let isRepostedByMe = false;
      if (currentUserId) {
        const myRepost = await pool.request()
          .input('MemoryId', sql.Int, mem.Id)
          .input('CorporateUserId', sql.Int, currentUserId)
          .query('SELECT 1 FROM MemoryReposts WHERE MemoryId = @MemoryId AND CorporateUserId = @CorporateUserId');
        isRepostedByMe = myRepost.recordset.length > 0;
      }

      memories.push({
        id: mem.Id,
        title: mem.Title,
        subtitle: mem.Subtitle,
        contentText: mem.ContentText,
        mediaType: mem.MediaType || 'image',
        mediaUrl: mem.MediaUrl,
        memoryDate: mem.MemoryDate,
        createdAt: mem.CreatedAt,
        user: {
          id: mem.UserId,
          fullName: mem.UserFullName,
          avatarUrl: mem.UserAvatar,
          userType: mem.UserType
        },
        likeCount: likesResult.recordset[0].LikeCount || 0,
        isLikedByMe,
        repostCount: repostCountResult.recordset[0].RepostCount || 0,
        isRepostedByMe,
        comments: topLevelComments
      });
    }

    return res.json({
      success: true,
      data: {
        id: pinRow.Id,
        spotName: pinRow.SpotName,
        spotSubtitle: pinRow.SpotSubtitle,
        latitude: pinRow.Latitude,
        longitude: pinRow.Longitude,
        category: {
          id: pinRow.CategoryId,
          name: pinRow.CategoryName,
          icon: pinRow.CategoryIcon,
        colorHex: pinRow.CategoryColor
        },
        isVenue: await isCorporateVenue(pool, pinRow.Latitude, pinRow.Longitude),
        memories
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc   Bir Pine Yeni Anı Ekle (Görsel / Video / Ses Kaydı)
// @route  POST /api/pins/:id/memories
const addMemoryToPin = async (req, res, next) => {
  try {
    const pinId = req.params.id;
    const userId = req.user.id;
    const { title, subtitle, contentText, mediaType, mediaUrl, memoryDate, visibility, allowedUserIds } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Anı başlığı girmek zorunludur.' });
    }

    const pool = getPool();
    const allowedIdsJson = Array.isArray(allowedUserIds) ? JSON.stringify(allowedUserIds) : null;

    const result = await pool.request()
      .input('PinId', sql.Int, pinId)
      .input('UserId', sql.Int, userId)
      .input('Title', sql.NVarChar, title)
      .input('Subtitle', sql.NVarChar, subtitle || '')
      .input('ContentText', sql.NVarChar, contentText || '')
      .input('MediaType', sql.NVarChar, mediaType || 'image')
      .input('MediaUrl', sql.NVarChar(sql.MAX), mediaUrl || null)
      .input('MemoryDate', sql.Date, memoryDate || new Date())
      .input('Visibility', sql.NVarChar, visibility || 'public')
      .input('AllowedUserIds', sql.NVarChar, allowedIdsJson)
      .query(`
        INSERT INTO Memories (PinId, UserId, Title, Subtitle, ContentText, MediaType, MediaUrl, MemoryDate, Visibility, AllowedUserIds)
        OUTPUT INSERTED.Id, INSERTED.CreatedAt
        VALUES (@PinId, @UserId, @Title, @Subtitle, @ContentText, @MediaType, @MediaUrl, @MemoryDate, @Visibility, @AllowedUserIds)
      `);

    const newMemoryId = result.recordset[0].Id;

    return res.status(201).json({
      success: true,
      message: 'Anınız bu pine başarıyla eklendi! 🌸',
      data: { id: newMemoryId }
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Yeni Bir Pin Konumu & İlk Anısını Oluştur
// @route  POST /api/pins
const createPinWithMemory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { spotName, spotSubtitle, categoryId, latitude, longitude, title, subtitle, contentText, mediaType, mediaUrl, memoryDate, visibility, allowedUserIds } = req.body;

    if (!spotName || !categoryId || latitude === undefined || longitude === undefined || !title) {
      return res.status(400).json({ success: false, message: 'Konum adı, kategori, koordinat ve anı başlığı zorunludur.' });
    }

    const pool = getPool();
    const allowedIdsJson = Array.isArray(allowedUserIds) ? JSON.stringify(allowedUserIds) : null;

    // 1. Konum Pini Ekle
    const pinResult = await pool.request()
      .input('CategoryId', sql.Int, categoryId)
      .input('SpotName', sql.NVarChar, spotName)
      .input('SpotSubtitle', sql.NVarChar, spotSubtitle || '')
      .input('Latitude', sql.Float, latitude)
      .input('Longitude', sql.Float, longitude)
      .query(`
        INSERT INTO Pins (CategoryId, SpotName, SpotSubtitle, Latitude, Longitude)
        OUTPUT INSERTED.Id, INSERTED.CreatedAt
        VALUES (@CategoryId, @SpotName, @SpotSubtitle, @Latitude, @Longitude)
      `);

    const newPinId = pinResult.recordset[0].Id;

    // 2. İlk Anıyı Ekle
    await pool.request()
      .input('PinId', sql.Int, newPinId)
      .input('UserId', sql.Int, userId)
      .input('Title', sql.NVarChar, title)
      .input('Subtitle', sql.NVarChar, subtitle || '')
      .input('ContentText', sql.NVarChar, contentText || '')
      .input('MediaType', sql.NVarChar, mediaType || 'image')
      .input('MediaUrl', sql.NVarChar(sql.MAX), mediaUrl || null)
      .input('MemoryDate', sql.Date, memoryDate || new Date())
      .input('Visibility', sql.NVarChar, visibility || 'public')
      .input('AllowedUserIds', sql.NVarChar, allowedIdsJson)
      .query(`
        INSERT INTO Memories (PinId, UserId, Title, Subtitle, ContentText, MediaType, MediaUrl, MemoryDate, Visibility, AllowedUserIds)
        VALUES (@PinId, @UserId, @Title, @Subtitle, @ContentText, @MediaType, @MediaUrl, @MemoryDate, @Visibility, @AllowedUserIds)
      `);

    return res.status(201).json({
      success: true,
      message: 'Yeni konum ve anı haritaya başarıyla eklendi! 🌸',
      data: { pinId: newPinId }
    });

  } catch (error) {
    next(error);
  }
};

// @desc   Kendi Anını Sil
// @route  DELETE /api/memories/:id
const deleteMemory = async (req, res, next) => {
  try {
    const memoryId = req.params.id;
    const userId = req.user.id;
    const pool = getPool();

    const checkMem = await pool.request()
      .input('Id', sql.Int, memoryId)
      .query('SELECT * FROM Memories WHERE Id = @Id');

    if (checkMem.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Anı bulunamadı.' });
    }

    if (checkMem.recordset[0].UserId !== userId) {
      return res.status(403).json({ success: false, message: 'Bu anıyı silmeye yetkiniz yok.' });
    }

    await pool.request()
      .input('Id', sql.Int, memoryId)
      .query('DELETE FROM Memories WHERE Id = @Id');

    return res.json({ success: true, message: 'Anı başarıyla silindi.' });
  } catch (error) {
    next(error);
  }
};

// @desc   Anıyı Beğen / Beğeniyi Kaldır
// @route  POST /api/memories/:id/like
const toggleLikeMemory = async (req, res, next) => {
  try {
    const memoryId = req.params.id;
    const userId = req.user.id;
    const pool = getPool();

    const checkLike = await pool.request()
      .input('MemoryId', sql.Int, memoryId)
      .input('UserId', sql.Int, userId)
      .query('SELECT * FROM MemoryLikes WHERE MemoryId = @MemoryId AND UserId = @UserId');

    if (checkLike.recordset.length > 0) {
      await pool.request()
        .input('MemoryId', sql.Int, memoryId)
        .input('UserId', sql.Int, userId)
        .query('DELETE FROM MemoryLikes WHERE MemoryId = @MemoryId AND UserId = @UserId');

      const count = await pool.request()
        .input('MemoryId', sql.Int, memoryId)
        .query('SELECT COUNT(*) as LikeCount FROM MemoryLikes WHERE MemoryId = @MemoryId');
      return res.json({ success: true, isLiked: false, likeCount: count.recordset[0].LikeCount, message: 'Beğeni kaldırıldı.' });
    } else {
      await pool.request()
        .input('MemoryId', sql.Int, memoryId)
        .input('UserId', sql.Int, userId)
        .query('INSERT INTO MemoryLikes (MemoryId, UserId) VALUES (@MemoryId, @UserId)');

      const count = await pool.request()
        .input('MemoryId', sql.Int, memoryId)
        .query('SELECT COUNT(*) as LikeCount FROM MemoryLikes WHERE MemoryId = @MemoryId');
      return res.json({ success: true, isLiked: true, likeCount: count.recordset[0].LikeCount, message: 'Anı beğenildi ❤️' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc   Anıya Yorum veya Alt Yorum Yanıtı Ekle
// @route  POST /api/memories/:id/comments
const addComment = async (req, res, next) => {
  try {
    const memoryId = req.params.id;
    const userId = req.user.id;
    const { commentText, parentCommentId } = req.body;

    if (!commentText || !commentText.trim()) {
      return res.status(400).json({ success: false, message: 'Yorum metni boş olamaz.' });
    }

    const pool = getPool();
    if (parentCommentId) {
      const parent = await pool.request()
        .input('ParentCommentId', sql.Int, parentCommentId)
        .input('MemoryId', sql.Int, memoryId)
        .query('SELECT 1 FROM MemoryComments WHERE Id = @ParentCommentId AND MemoryId = @MemoryId');
      if (parent.recordset.length === 0) {
        return res.status(400).json({ success: false, message: 'Yanıtlanacak yorum bu anıya ait değil.' });
      }
    }

    const result = await pool.request()
      .input('MemoryId', sql.Int, memoryId)
      .input('UserId', sql.Int, userId)
      .input('ParentCommentId', sql.Int, parentCommentId || null)
      .input('CommentText', sql.NVarChar, commentText.trim())
      .query(`
        INSERT INTO MemoryComments (MemoryId, UserId, ParentCommentId, CommentText)
        OUTPUT INSERTED.Id, INSERTED.CreatedAt
        VALUES (@MemoryId, @UserId, @ParentCommentId, @CommentText)
      `);

    return res.status(201).json({
      success: true,
      message: 'Yorum eklendi.',
      data: {
        id: result.recordset[0].Id,
        commentText: commentText.trim(),
        parentCommentId: parentCommentId || null,
        createdAt: result.recordset[0].CreatedAt,
        user: { id: userId, fullName: req.user.fullName }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Yorumu Beğen / Beğeniyi Kaldır
// @route  POST /api/memories/comments/:commentId/like
const toggleLikeComment = async (req, res, next) => {
  try {
    const commentId = req.params.commentId;
    const userId = req.user.id;
    const pool = getPool();

    const checkLike = await pool.request()
      .input('CommentId', sql.Int, commentId)
      .input('UserId', sql.Int, userId)
      .query('SELECT * FROM CommentLikes WHERE CommentId = @CommentId AND UserId = @UserId');

    if (checkLike.recordset.length > 0) {
      await pool.request()
        .input('CommentId', sql.Int, commentId)
        .input('UserId', sql.Int, userId)
        .query('DELETE FROM CommentLikes WHERE CommentId = @CommentId AND UserId = @UserId');

      const count = await pool.request()
        .input('CommentId', sql.Int, commentId)
        .query('SELECT COUNT(*) as LikeCount FROM CommentLikes WHERE CommentId = @CommentId');
      return res.json({ success: true, isLiked: false, likeCount: count.recordset[0].LikeCount, message: 'Yorum beğenisi kaldırıldı.' });
    } else {
      await pool.request()
        .input('CommentId', sql.Int, commentId)
        .input('UserId', sql.Int, userId)
        .query('INSERT INTO CommentLikes (CommentId, UserId) VALUES (@CommentId, @UserId)');

      const count = await pool.request()
        .input('CommentId', sql.Int, commentId)
        .query('SELECT COUNT(*) as LikeCount FROM CommentLikes WHERE CommentId = @CommentId');
      return res.json({ success: true, isLiked: true, likeCount: count.recordset[0].LikeCount, message: 'Yorum beğenildi ❤️' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc   Kurumsal Hesabın Anıyı Repost Etmesi / Geri Çekmesi
// @route  POST /api/memories/:id/repost
const toggleRepostMemory = async (req, res, next) => {
  try {
    const memoryId = req.params.id;
    const corporateUserId = req.user.id;
    const pool = getPool();

    const result = await pool.request()
      .input('MemoryId', sql.Int, memoryId)
      .input('CorporateUserId', sql.Int, corporateUserId)
      .query(`
        SET XACT_ABORT ON;
        BEGIN TRANSACTION;
        IF EXISTS (
          SELECT 1 FROM MemoryReposts WITH (UPDLOCK, HOLDLOCK)
          WHERE MemoryId = @MemoryId AND CorporateUserId = @CorporateUserId
        )
        BEGIN
          DELETE FROM MemoryReposts
          WHERE MemoryId = @MemoryId AND CorporateUserId = @CorporateUserId;
          SELECT CAST(0 AS BIT) AS IsReposted;
        END
        ELSE
        BEGIN
          INSERT INTO MemoryReposts (MemoryId, CorporateUserId)
          VALUES (@MemoryId, @CorporateUserId);
          SELECT CAST(1 AS BIT) AS IsReposted;
        END
        COMMIT TRANSACTION;
      `);

    const isReposted = Boolean(Number(result.recordset[0].IsReposted));
    return res.json({
      success: true,
      isReposted,
      message: isReposted
        ? 'Anı mekanınızda paylaşıldı! 🏢🔄'
        : 'Anı profilinizden kaldırıldı.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc   En Yüksek Teklifi Veren İlk 5 Sponsorlu Mekanı Getir (Açık Artırma Sıralaması)
// @route  GET /api/pins/sponsored
const getTopSponsoredPins = async (req, res, next) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT TOP 5 
        b.Id, b.PinId, b.SpotName, b.SpotSubtitle, b.Latitude, b.Longitude, b.BidAmount, b.Currency, b.BidScoreTL, b.CreatedAt
      FROM SponsorshipBids b
      ORDER BY b.BidScoreTL DESC, b.CreatedAt DESC
    `);

    const sponsoredPins = result.recordset.map(b => ({
      id: b.Id,
      pinId: b.PinId,
      spotName: b.SpotName,
      spotSubtitle: b.SpotSubtitle,
      latitude: b.Latitude,
      longitude: b.Longitude,
      bidAmount: b.BidAmount,
      currency: b.Currency,
      bidScoreTL: b.BidScoreTL,
      createdAt: b.CreatedAt
    }));

    return res.json({ success: true, count: sponsoredPins.length, data: sponsoredPins });
  } catch (error) {
    next(error);
  }
};

// @desc   Yeni Sponsorluk Teklifi Ver (Açık Artırma Teklifi Gönder)
// @route  POST /api/pins/sponsored
const submitSponsorshipBid = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const { spotName, spotSubtitle, latitude, longitude, bidAmount, currency, pinId } = req.body;

    if (!spotName || !bidAmount || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Mekan adı, konum koordinatı ve teklif tutarı zorunludur.' });
    }

    const curr = (currency || 'USD').toUpperCase();
    const amount = parseFloat(bidAmount);

    // TL Bazlı Açık Artırma Puanlama Hesabı (1 USD = 35 TL, 1 EUR = 38 TL)
    let bidScoreTL = amount;
    if (curr === 'USD') bidScoreTL = amount * 35;
    else if (curr === 'EUR') bidScoreTL = amount * 38;

    const pool = getPool();
    const result = await pool.request()
      .input('PinId', sql.Int, pinId || null)
      .input('SpotName', sql.NVarChar, spotName)
      .input('SpotSubtitle', sql.NVarChar, spotSubtitle || '')
      .input('Latitude', sql.Float, latitude)
      .input('Longitude', sql.Float, longitude)
      .input('BidAmount', sql.Decimal(18,2), amount)
      .input('Currency', sql.NVarChar, curr)
      .input('BidScoreTL', sql.Decimal(18,2), bidScoreTL)
      .input('UserId', sql.Int, userId)
      .query(`
        INSERT INTO SponsorshipBids (PinId, SpotName, SpotSubtitle, Latitude, Longitude, BidAmount, Currency, BidScoreTL, UserId)
        OUTPUT INSERTED.Id, INSERTED.CreatedAt
        VALUES (@PinId, @SpotName, @SpotSubtitle, @Latitude, @Longitude, @BidAmount, @Currency, @BidScoreTL, @UserId)
      `);

    return res.status(201).json({
      success: true,
      message: 'Sponsorluk teklifiniz başarıyla alındı! Açık artırma sıralamasında yerinizi aldınız ✨',
      data: { id: result.recordset[0].Id }
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Kategorileri Getir
// @route  GET /api/pins/categories
const getCategories = async (req, res, next) => {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT Id as id, Name as name, Icon as icon, ColorHex as colorHex FROM Categories');
    return res.json({ success: true, data: result.recordset });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPins,
  getPinDetails,
  createPinWithMemory,
  addMemoryToPin,
  deleteMemory,
  toggleLikeMemory,
  addComment,
  toggleLikeComment,
  toggleRepostMemory,
  getTopSponsoredPins,
  submitSponsorshipBid,
  getCategories
};
