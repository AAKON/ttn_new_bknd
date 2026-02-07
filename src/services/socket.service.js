const { getIO } = require('../socket');

const emitToUser = (userId, event, data) => {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit(event, data);
  } catch (err) {
    console.error('Socket emit failed:', err.message);
  }
};

const emitProposalStatusChanged = (userId, proposal) => {
  emitToUser(userId, 'proposal:statusChanged', {
    id: proposal.id,
    title: proposal.title,
    status: proposal.status,
  });
};

const emitNewComment = (userId, comment) => {
  emitToUser(userId, 'proposal:newComment', {
    proposal_id: comment.sourcing_proposal_id,
    comment,
  });
};

const emitClaimStatusChanged = (userId, claim) => {
  emitToUser(userId, 'company:claimStatusChanged', {
    id: claim.id,
    status: claim.status,
  });
};

const emitNotification = (userId, notification) => {
  emitToUser(userId, 'notification:new', notification);
};

module.exports = {
  emitToUser,
  emitProposalStatusChanged,
  emitNewComment,
  emitClaimStatusChanged,
  emitNotification,
};
