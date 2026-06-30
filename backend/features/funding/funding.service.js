class FundingService {
  /**
   * Calculates the priority score for a support request campaign.
   * priorityScore = (fundingGap × 0.5) + (urgencyScore × 0.3) + (impactScore × 0.2)
   */
  calculatePriorityScore(campaign) {
    const goalAmount = Number(campaign.goalAmount || 0);
    const raisedAmount = Number(campaign.raisedAmount || 0);

    // 1. Funding Gap (0 to 1.0)
    let fundingGap = 0;
    if (goalAmount > 0) {
      fundingGap = (goalAmount - raisedAmount) / goalAmount;
      if (fundingGap < 0) fundingGap = 0; // Overfunded
    }

    if (fundingGap === 0) return 0; // Fully funded, exclude

    // 2. Urgency Score (0.25 to 1.0)
    let urgencyScore = 0.5; // Default MEDIUM
    if (campaign.urgency === 'CRITICAL') urgencyScore = 1.0;
    else if (campaign.urgency === 'HIGH') urgencyScore = 0.75;
    else if (campaign.urgency === 'MEDIUM') urgencyScore = 0.5;
    else if (campaign.urgency === 'LOW') urgencyScore = 0.25;

    // 3. Impact Score (0 to 1.0)
    const animalsImpacted = campaign.animalsImpacted || 1;
    let impactScore = animalsImpacted / 5;
    if (impactScore > 1.0) impactScore = 1.0;

    // Final Calculation
    const priorityScore = (fundingGap * 0.5) + (urgencyScore * 0.3) + (impactScore * 0.2);

    return parseFloat(priorityScore.toFixed(4));
  }

  /**
   * Generates a recommended split distribution for a given amount across campaigns
   */
  generateSplitRecommendation(amount, campaigns) {
    if (!campaigns || campaigns.length === 0) return [];
    if (amount <= 0) return [];

    // Sort by priority score descending
    const sorted = [...campaigns]
      .filter(c => c.priorityScore > 0)
      .sort((a, b) => b.priorityScore - a.priorityScore);

    if (sorted.length === 0) return [];

    // Simple distribution algorithm: Proportional to priority score, but capped by remaining goal
    const splits = [];
    let remainingAmount = Number(amount);

    // If only one eligible, give it all
    if (sorted.length === 1) {
      splits.push({
        campaignId: sorted[0].id,
        partnerId: sorted[0].partnerId,
        amount: remainingAmount
      });
      return splits;
    }

    const totalScore = sorted.reduce((sum, c) => sum + c.priorityScore, 0);

    for (let i = 0; i < sorted.length; i++) {
      const campaign = sorted[i];
      let alloc;

      if (i === sorted.length - 1) {
        alloc = remainingAmount; // Give the rest to the last one
      } else {
        const proportion = campaign.priorityScore / totalScore;
        alloc = Math.floor(amount * proportion);
      }

      // Check if alloc exceeds remaining goal amount
      const remainingGoal = Number(campaign.goalAmount) - Number(campaign.raisedAmount);
      if (alloc > remainingGoal && remainingGoal > 0) {
        alloc = remainingGoal;
      }

      if (alloc > 0) {
        splits.push({
          campaignId: campaign.id,
          partnerId: campaign.partnerId,
          amount: alloc
        });
        remainingAmount -= alloc;
      }

      if (remainingAmount <= 0) break;
    }

    return splits;
  }
}

module.exports = new FundingService();
