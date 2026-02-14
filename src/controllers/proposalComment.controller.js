const prisma = require('../config/database');
const { success, error, notFound } = require('../utils/response');
const { emitNewComment } = require('../services/socket.service');

const addComment = async (req, res, next) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const raw = body.comment ?? body.message ?? body.content ?? body.text ?? '';
    const commentText = typeof raw === 'string' ? raw.trim() : '';
    if (!commentText) return error(res, 'Comment text is required', 400);

    const proposal = await prisma.sourcing_proposals.findFirst({
      where: { id: BigInt(req.params.proposalId), deleted_at: null },
    });
    if (!proposal) return notFound(res, 'Proposal not found');

    const comment = await prisma.proposal_comments.create({
      data: {
        sourcing_proposal_id: proposal.id,
        user_id: req.user.id,
        comment: commentText,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: { users: true },
    });

    const formatted = {
      id: Number(comment.id),
      comment: comment.comment,
      created_at: comment.created_at,
      user: {
        id: Number(comment.users.id),
        first_name: comment.users.first_name,
        last_name: comment.users.last_name,
      },
      replies: [],
    };

    // Emit socket event to proposal owner
    if (proposal.user_id !== req.user.id) {
      emitNewComment(Number(proposal.user_id), {
        ...formatted,
        sourcing_proposal_id: Number(proposal.id),
      });
    }

    return success(res, formatted, 'Comment added successfully');
  } catch (err) {
    next(err);
  }
};

const addReply = async (req, res, next) => {
  try {
    const comment = await prisma.proposal_comments.findFirst({
      where: { id: BigInt(req.params.commentId), deleted_at: null },
    });
    if (!comment) return notFound(res, 'Comment not found');

    const reply = await prisma.proposal_comment_replies.create({
      data: {
        proposal_comment_id: comment.id,
        user_id: req.user.id,
        reply: req.body.reply || req.body.comment,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: { users: true },
    });

    return success(res, {
      id: Number(reply.id),
      reply: reply.reply,
      created_at: reply.created_at,
      user: {
        id: Number(reply.users.id),
        first_name: reply.users.first_name,
        last_name: reply.users.last_name,
      },
    }, 'Reply added successfully');
  } catch (err) {
    next(err);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const comment = await prisma.proposal_comments.findFirst({
      where: { id: BigInt(req.params.commentId), user_id: req.user.id, deleted_at: null },
    });
    if (!comment) return notFound(res, 'Comment not found');

    await prisma.proposal_comments.update({
      where: { id: comment.id },
      data: { deleted_at: new Date() },
    });

    return success(res, null, 'Comment deleted successfully');
  } catch (err) {
    next(err);
  }
};

const deleteReply = async (req, res, next) => {
  try {
    const reply = await prisma.proposal_comment_replies.findFirst({
      where: { id: BigInt(req.params.replyId), user_id: req.user.id, deleted_at: null },
    });
    if (!reply) return notFound(res, 'Reply not found');

    await prisma.proposal_comment_replies.update({
      where: { id: reply.id },
      data: { deleted_at: new Date() },
    });

    return success(res, null, 'Reply deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { addComment, addReply, deleteComment, deleteReply };
