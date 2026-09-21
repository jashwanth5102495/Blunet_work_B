import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { db } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { logAudit } from '../../utils/audit.js';

const STORAGE_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), 'uploads');

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

export const getResources = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const role = req.user?.role || 'EMPLOYEE';
    const { categoryId, search } = req.query;

    const where: any = {
      visibility: { in: ['ALL', role] },
    };

    if (categoryId) where.categoryId = String(categoryId);
    if (search) {
      where.OR = [
        { name: { contains: String(search) } },
        { description: { contains: String(search) } },
      ];
    }

    const resources = await db.resource.findMany({
      where,
      include: {
        category: true,
        fileUpload: true,
        uploadedBy: { select: { id: true, name: true, employeeId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: resources,
    });
  } catch (err) {
    next(err);
  }
};

export const createResource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const file = req.file;
    const { name, description, categoryId, version, visibility } = req.body;
    const userId = req.user?.userId;

    if (!file) {
      throw new AppError('Resource file is required.', 400, 'MISSING_FILE');
    }

    if (!name || !categoryId || !userId) {
      throw new AppError('Resource name and category are required.', 400, 'MISSING_FIELDS');
    }

    const safeKey = `${Date.now()}_${path.basename(file.originalname).replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const targetPath = path.join(STORAGE_DIR, safeKey);

    fs.writeFileSync(targetPath, file.buffer);

    const fileUpload = await db.fileUpload.create({
      data: {
        originalName: file.originalname,
        storageKey: safeKey,
        mimeType: file.mimetype,
        size: file.size,
        uploadedById: userId,
      },
    });

    const resource = await db.resource.create({
      data: {
        name,
        description: description || null,
        version: version || '1.0',
        visibility: visibility || 'ALL',
        categoryId,
        fileUploadId: fileUpload.id,
        uploadedById: userId,
      },
      include: {
        category: true,
        fileUpload: true,
      },
    });

    await logAudit(userId, 'RESOURCE_UPLOADED', 'Resource', resource.id, { name, visibility }, req.ip);

    res.status(201).json({
      success: true,
      data: resource,
      message: 'Resource uploaded successfully.',
    });
  } catch (err) {
    next(err);
  }
};

export const downloadResource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    const role = req.user?.role || 'EMPLOYEE';

    const resource = await db.resource.findUnique({
      where: { id },
      include: { fileUpload: true },
    });

    if (!resource || !resource.fileUpload) {
      throw new AppError('Resource or resource file not found.', 404, 'NOT_FOUND');
    }

    if (resource.visibility !== 'ALL' && resource.visibility !== role && role !== 'ADMIN') {
      throw new AppError('You do not have permission to access this resource.', 403, 'FORBIDDEN');
    }

    const filePath = path.join(STORAGE_DIR, resource.fileUpload.storageKey);

    if (!fs.existsSync(filePath)) {
      throw new AppError('File content missing on server.', 404, 'FILE_MISSING');
    }

    res.setHeader('Content-Type', resource.fileUpload.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(resource.fileUpload.originalName)}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    next(err);
  }
};

export const getResourceCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await db.resourceCategory.findMany({ orderBy: { name: 'asc' } });
    res.status(200).json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
};
