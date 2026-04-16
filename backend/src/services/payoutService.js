// payoutService.js
// Handles automated RazorpayX payouts to gig workers' UPI IDs
// Flow: Create Fund Account → Create Payout → Track Status

const Razorpay = require("razorpay");
const prisma = require("../prisma");

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Creates a RazorpayX fund account for a user's UPI VPA.
 * Fund accounts are reusable — in production you'd cache these.
 */
async function createFundAccount(user) {
  try {
    // First, create a contact (the person receiving money)
    const contact = await rzp.fundAccount.create({
      contact: {
        name: user.fullName,
        contact: user.phone,
        type: "employee",
      },
      account_type: "vpa",
      vpa: {
        address: user.upiId,
      },
    });

    return contact;
  } catch (error) {
    console.error(`[PayoutService] Fund account creation failed for ${user.fullName}:`, error.message);
    return null;
  }
}

/**
 * Initiates a payout to a worker via RazorpayX.
 * Falls back gracefully if RazorpayX is not activated on the account.
 *
 * @param {Object} user     — Prisma User record (with upiId, fullName, phone)
 * @param {number} amount   — Amount in INR (not paise)
 * @param {number} claimId  — Claim ID for reference
 * @returns {Object} payout record
 */
async function initiateRazorpayPayout(user, amount, claimId) {
  const amountPaise = Math.round(amount * 100);

  try {
    // Step 1: Create fund account
    const fundAccount = await createFundAccount(user);

    if (!fundAccount || !fundAccount.id) {
      throw new Error("Fund account creation returned no ID");
    }

    // Step 2: Create the payout
    const razorpayPayout = await rzp.payouts.create({
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER, // Your RazorpayX account
      fund_account_id: fundAccount.id,
      amount: amountPaise,
      currency: "INR",
      mode: "UPI",
      purpose: "payout",
      queue_if_low_balance: true,
      reference_id: `claim_${claimId}`,
      narration: `InsuriFyx Claim #${claimId} Payout`,
    });

    console.log(`[PayoutService] ✅ RazorpayX payout created: ${razorpayPayout.id} → ₹${amount} to ${user.upiId}`);

    // Step 3: Update DB record
    const payout = await prisma.payout.create({
      data: {
        claimId,
        payoutStatus: "PROCESSED",
        payoutMethod: "UPI",
        razorpayPayoutId: razorpayPayout.id,
        razorpayFundAccountId: fundAccount.id,
      },
    });

    return payout;
  } catch (error) {
    // RazorpayX not activated or other API error — fall back gracefully
    console.warn(`[PayoutService] ⚠️ RazorpayX payout failed (${error.message}). Recording as PENDING.`);

    const payout = await prisma.payout.create({
      data: {
        claimId,
        payoutStatus: "PENDING",
        payoutMethod: "UPI",
        failureReason: error.message,
      },
    });

    return payout;
  }
}

module.exports = {
  initiateRazorpayPayout,
  createFundAccount,
};
