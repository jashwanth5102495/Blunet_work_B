import { Request, Response, NextFunction } from 'express';
import { db } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { logAudit } from '../../utils/audit.js';
import { parseLeadFile } from './leadParser.js';

export const VALID_OUTCOMES = [
  'INTERESTED',
  'NOT_INTERESTED',
  'FOLLOW_UP_REQUIRED',
  'CALL_BACK_LATER',
  'NO_ANSWER',
  'WRONG_NUMBER',
  'CLOSED',
];

export const getActiveLead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { campaignId } = req.query;

    const campaignWhere = campaignId
      ? { id: String(campaignId) }
      : { status: 'ACTIVE' };

    const campaign = await db.leadCampaign.findFirst({
      where: campaignWhere,
      orderBy: { createdAt: 'desc' },
    });

    if (!campaign) {
      res.status(200).json({
        success: true,
        data: { activeLead: null, totalLeads: 0, completedLeads: 0, campaign: null },
      });
      return;
    }

    // Find current active lead (first AVAILABLE or RESPONSE_PENDING lead)
    const activeLead = await db.lead.findFirst({
      where: {
        campaignId: campaign.id,
        status: { in: ['AVAILABLE', 'RESPONSE_PENDING'] },
      },
      orderBy: { sequenceNumber: 'asc' },
      include: {
        responses: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    const totalLeads = await db.lead.count({ where: { campaignId: campaign.id } });
    const completedLeads = await db.lead.count({
      where: {
        campaignId: campaign.id,
        status: 'COMPLETED',
      },
    });

    res.status(200).json({
      success: true,
      data: {
        campaign,
        activeLead,
        totalLeads,
        completedLeads,
        remainingLeads: totalLeads - completedLeads,
        progressPercentage: totalLeads > 0 ? Math.round((completedLeads / totalLeads) * 100) : 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const markCallMade = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.userId;

    const lead = await db.lead.findUnique({ where: { id } });

    if (!lead) {
      throw new AppError('Lead not found.', 404, 'LEAD_NOT_FOUND');
    }

    if (lead.status === 'LOCKED') {
      throw new AppError('This lead is locked. Complete the previous lead first.', 403, 'LEAD_LOCKED');
    }

    if (lead.status === 'COMPLETED') {
      throw new AppError('This lead is already completed.', 400, 'LEAD_ALREADY_COMPLETED');
    }

    // Transition state from AVAILABLE to RESPONSE_PENDING
    const updatedLead = await db.lead.update({
      where: { id: lead.id },
      data: { status: 'RESPONSE_PENDING' },
    });

    await logAudit(userId, 'LEAD_CALL_MADE', 'Lead', lead.id, null, req.ip);

    res.status(200).json({
      success: true,
      data: updatedLead,
      message: 'Call marked as made. Please record customer response.',
    });
  } catch (err) {
    next(err);
  }
};

export const submitResponse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { outcome, notes, followUpRequired, followUpDate, followUpNote, dealValue } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('Unauthenticated user.', 401, 'UNAUTHORIZED');
    }

    if (!outcome || !VALID_OUTCOMES.includes(outcome)) {
      throw new AppError(`Invalid response outcome. Allowed: [${VALID_OUTCOMES.join(', ')}]`, 400, 'INVALID_OUTCOME');
    }

    if (!notes || !notes.trim()) {
      throw new AppError('Customer response notes are required.', 400, 'RESPONSE_REQUIRED');
    }

    const isFollowUpNeeded = outcome === 'FOLLOW_UP_REQUIRED' || Boolean(followUpRequired);
    if (isFollowUpNeeded && !followUpDate) {
      throw new AppError('Follow-up date is required when follow-up is indicated.', 400, 'FOLLOWUP_DATE_REQUIRED');
    }

    // Transaction execution for sequential unlock
    const result = await db.$transaction(async (tx) => {
      const currentLead = await tx.lead.findUnique({ where: { id } });

      if (!currentLead) {
        throw new AppError('Lead not found.', 404, 'LEAD_NOT_FOUND');
      }

      if (currentLead.status === 'LOCKED') {
        throw new AppError('Cannot save response for a locked lead. Complete the previous lead first.', 403, 'LEAD_LOCKED');
      }

      if (currentLead.status === 'COMPLETED') {
        throw new AppError('This lead has already been completed.', 400, 'DUPLICATE_SUBMISSION');
      }

      // Record Lead Interaction Response
      const response = await tx.leadResponse.create({
        data: {
          leadId: currentLead.id,
          userId,
          outcome,
          notes: notes.trim(),
          followUpRequired: isFollowUpNeeded,
          followUpDate: followUpDate ? new Date(followUpDate) : null,
          followUpNote: followUpNote ? followUpNote.trim() : null,
          dealValue: dealValue ? parseFloat(dealValue) : 0.0,
        },
      });

      // Mark current lead COMPLETED
      await tx.lead.update({
        where: { id: currentLead.id },
        data: {
          status: 'COMPLETED',
          outcome,
        },
      });

      // Unlock next sequential lead in campaign
      const nextLead = await tx.lead.findFirst({
        where: {
          campaignId: currentLead.campaignId,
          sequenceNumber: currentLead.sequenceNumber + 1,
        },
      });

      let nextLeadAvailable = false;
      let nextLeadId: string | null = null;

      if (nextLead) {
        await tx.lead.update({
          where: { id: nextLead.id },
          data: { status: 'AVAILABLE' },
        });
        nextLeadAvailable = true;
        nextLeadId = nextLead.id;
      }

      return {
        response,
        completedLeadId: currentLead.id,
        nextLeadId,
        nextLeadAvailable,
      };
    });

    await logAudit(userId, 'LEAD_RESPONSE_SAVED', 'LeadResponse', result.response.id, { leadId: id, outcome }, req.ip);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Customer response saved successfully. Next lead unlocked.',
    });
  } catch (err) {
    next(err);
  }
};

export const getCompletedLeads = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { campaignId, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(String(page), 10);
    const limitNum = parseInt(String(limit), 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { status: 'COMPLETED' };
    if (campaignId) where.campaignId = String(campaignId);

    const [total, leads] = await Promise.all([
      db.lead.count({ where }),
      db.lead.findMany({
        where,
        orderBy: { sequenceNumber: 'desc' },
        skip,
        take: limitNum,
        include: {
          responses: {
            include: { user: { select: { id: true, name: true, employeeId: true } } },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        completedLeads: leads,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getLeadQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { campaignId, limit = 10 } = req.query;

    const campaign = campaignId
      ? await db.leadCampaign.findUnique({ where: { id: String(campaignId) } })
      : await db.leadCampaign.findFirst({ where: { status: 'ACTIVE' }, orderBy: { createdAt: 'desc' } });

    if (!campaign) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    const lockedLeads = await db.lead.findMany({
      where: {
        campaignId: campaign.id,
        status: 'LOCKED',
      },
      orderBy: { sequenceNumber: 'asc' },
      take: parseInt(String(limit), 10),
      select: {
        id: true,
        sequenceNumber: true,
        status: true,
      },
    });

    res.status(200).json({
      success: true,
      data: lockedLeads.map((l) => ({
        id: l.id,
        sequenceNumber: l.sequenceNumber,
        status: l.status,
        label: `🔒 Lead #${String(l.sequenceNumber).padStart(3, '0')} (Locked)`,
      })),
    });
  } catch (err) {
    next(err);
  }
};

export const previewImport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const file = req.file;

    if (!file) {
      throw new AppError('Lead file (PDF, CSV, or XLSX) is required.', 400, 'MISSING_FILE');
    }

    const previewResult = await parseLeadFile(file.buffer, file.mimetype, file.originalname);

    res.status(200).json({
      success: true,
      data: previewResult,
    });
  } catch (err) {
    next(err);
  }
};

export const confirmImport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { campaignName, leads } = req.body;
    const userId = req.user?.userId;

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      throw new AppError('No valid leads provided for import.', 400, 'EMPTY_LEADS');
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const campaign = await db.leadCampaign.create({
      data: {
        name: campaignName || `Imported Campaign ${now.toISOString().split('T')[0]}`,
        month: currentMonth,
        year: currentYear,
        status: 'ACTIVE',
      },
    });

    const importedLeads = await db.$transaction(async (tx) => {
      let seq = 1;
      const createdLeads = [];

      for (const item of leads) {
        const status = seq === 1 ? 'AVAILABLE' : 'LOCKED';

        const lead = await tx.lead.create({
          data: {
            sequenceNumber: seq,
            campaignId: campaign.id,
            businessName: item.businessName,
            phone: item.phone,
            email: item.email || null,
            website: item.website || null,
            address: item.address || null,
            city: item.city || null,
            state: item.state || null,
            country: item.country || 'India',
            source: item.source || 'Admin Upload',
            status,
          },
        });
        createdLeads.push(lead);
        seq++;
      }
      return createdLeads;
    });

    await logAudit(userId, 'LEADS_IMPORTED', 'LeadCampaign', campaign.id, { count: importedLeads.length }, req.ip);

    res.status(201).json({
      success: true,
      data: {
        campaign,
        importedCount: importedLeads.length,
      },
      message: `Successfully imported ${importedLeads.length} leads into campaign "${campaign.name}".`,
    });
  } catch (err) {
    next(err);
  }
};
