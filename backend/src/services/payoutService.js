const prisma = require("../prisma");
async function initiateRazorpayPayout(user, amount, claimId) {
  const payoutId = `pout_${claimId}_${Date.now()}`;
  const payout = await prisma.payout.create({
    data: {
      claimId,
      payoutStatus: "PROCESSED",
      payoutMethod: "UPI",
      razorpayPayoutId: payoutId,
      razorpayFundAccountId: user.upiId || `mock_fund_${user.id}`,
    },
  });

  return {
    ...payout,
    payoutStatus: "processed",
    payoutId,
    amount,
  };
}

module.exports = {
  initiateRazorpayPayout,
};
