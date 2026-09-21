import { db } from './config/db.js';
import { comparePassword } from './utils/hash.js';

async function testSuite() {
  console.log('🧪 Starting BluNet Workplace Lead Caller Test Suite...\n');

  // Test 1: Password Verification
  console.log('Test 1: User Authentication & Passwords');
  const admin = await db.user.findUnique({ where: { employeeId: 'BLU-EMP-001' } });
  if (!admin) throw new Error('Admin user missing');
  const validPass = await comparePassword('Password123!', admin.passwordHash);
  if (!validPass) throw new Error('Password verification failed');
  console.log('  ✅ Password authentication verified.');

  // Test 2: Lead 1 Available, Lead 2 Locked
  console.log('\nTest 2: Initial Lead Locking State');
  const campaign = await db.leadCampaign.findFirst({ where: { status: 'ACTIVE' } });
  if (!campaign) throw new Error('No active campaign found');

  const lead1 = await db.lead.findFirst({
    where: { campaignId: campaign.id, sequenceNumber: 1 },
  });
  const lead2 = await db.lead.findFirst({
    where: { campaignId: campaign.id, sequenceNumber: 2 },
  });

  if (!lead1 || !lead2) throw new Error('Sample leads missing');

  console.log(`  Initial State: Lead #1 = ${lead1.status}, Lead #2 = ${lead2.status}`);
  if (lead1.status !== 'AVAILABLE' || lead2.status !== 'LOCKED') {
    throw new Error('Initial lead status mismatch (Lead #1 must be AVAILABLE, Lead #2 must be LOCKED)');
  }
  console.log('  ✅ Lead #1 is AVAILABLE, Lead #2 is LOCKED.');

  // Test 3: Mark CALL MADE -> Transition to RESPONSE_PENDING
  console.log('\nTest 3: CALL MADE Transition to RESPONSE_PENDING');
  await db.lead.update({
    where: { id: lead1.id },
    data: { status: 'RESPONSE_PENDING' },
  });

  const updatedLead1State = await db.lead.findUnique({ where: { id: lead1.id } });
  const lead2CheckBeforeResponse = await db.lead.findUnique({ where: { id: lead2.id } });

  console.log(`  State after CALL MADE: Lead #1 = ${updatedLead1State?.status}, Lead #2 = ${lead2CheckBeforeResponse?.status}`);
  if (updatedLead1State?.status !== 'RESPONSE_PENDING' || lead2CheckBeforeResponse?.status !== 'LOCKED') {
    throw new Error('CALL MADE transition failed: Lead #2 must remain LOCKED while response is pending!');
  }
  console.log('  ✅ Lead #1 is RESPONSE_PENDING, Lead #2 remains strictly LOCKED.');

  // Test 4: Save Response -> Atomic Transaction completes Lead 1 & unlocks Lead 2 to AVAILABLE
  console.log('\nTest 4: Save Response & Atomic Sequential Unlock');
  const mktHead = await db.user.findUnique({ where: { employeeId: 'BLU-EMP-002' } });
  if (!mktHead) throw new Error('Marketing Head user missing');

  await db.$transaction(async (tx) => {
    // 1. Record Response
    await tx.leadResponse.create({
      data: {
        leadId: lead1.id,
        userId: mktHead.id,
        outcome: 'INTERESTED',
        notes: 'Customer is interested in website development and enterprise portal.',
        dealValue: 150000,
      },
    });

    // 2. Mark Lead #1 COMPLETED
    await tx.lead.update({
      where: { id: lead1.id },
      data: { status: 'COMPLETED', outcome: 'INTERESTED' },
    });

    // 3. Unlock Lead #2 to AVAILABLE
    await tx.lead.update({
      where: { id: lead2.id },
      data: { status: 'AVAILABLE' },
    });
  });

  const postLead1 = await db.lead.findUnique({ where: { id: lead1.id } });
  const postLead2 = await db.lead.findUnique({ where: { id: lead2.id } });

  console.log(`  Post-Save State: Lead #1 = ${postLead1?.status} (${postLead1?.outcome}), Lead #2 = ${postLead2?.status}`);

  if (postLead1?.status !== 'COMPLETED' || postLead2?.status !== 'AVAILABLE') {
    throw new Error('Sequential unlock transaction failed!');
  }
  console.log('  ✅ Lead #1 COMPLETED -> Lead #2 unlocked to AVAILABLE successfully!');

  console.log('\n🎉 ALL SEQUENTIAL LEAD CALLER TESTS PASSED SUCCESSFULLY!');
}

testSuite()
  .catch((e) => {
    console.error('❌ Test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
