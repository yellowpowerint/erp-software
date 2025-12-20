'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Edit2, MessageSquare, Send, Trash2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useDocuments } from '@/hooks/useDocuments';
import { DocumentComment } from '@/types/document';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/types/auth';

interface CommentsPanelProps {
  documentId: string;
}

function CommentComposer({
  placeholder,
  submitLabel,
  disabled,
  initialValue = '',
  onCancel,
  onSubmit,
}: {
  placeholder: string;
  submitLabel: string;
  disabled?: boolean;
  initialValue?: string;
  onCancel?: () => void;
  onSubmit: (content: string) => Promise<void>;
}) {
  const [value, setValue] = useState(initialValue);
  const canSubmit = value.trim().length > 0 && !disabled;

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none text-sm outline-none"
      />
      <div className="mt-2 flex items-center justify-end space-x-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-sm rounded border border-gray-200 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          disabled={!canSubmit}
          onClick={async () => {
            if (!canSubmit) return;
            await onSubmit(value.trim());
            setValue('');
          }}
          className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-2"
        >
          <Send className="h-4 w-4" />
          <span>{submitLabel}</span>
        </button>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  depth,
  currentUserId,
  isSuperAdmin,
  onReply,
  onEdit,
  onDelete,
  onResolveToggle,
}: {
  comment: DocumentComment;
  depth: number;
  currentUserId?: string;
  isSuperAdmin: boolean;
  onReply: (commentId: string, content: string) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onResolveToggle: (commentId: string, resolved: boolean) => Promise<void>;
}) {
  const [showReply, setShowReply] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(comment.content);

  const canMutate = isSuperAdmin || (currentUserId && comment.authorId === currentUserId);

  return (
    <div className={depth > 0 ? 'ml-6 mt-3' : 'mt-4'}>
      <div className="flex items-start space-x-3">
        <div className="mt-1">
          {comment.isResolved ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <Circle className="h-5 w-5 text-gray-300" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium text-gray-900">
                {comment.author?.firstName} {comment.author?.lastName}
              </span>
              <span className="text-gray-500"> · </span>
              <span className="text-gray-500">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
              {comment.pageNumber ? (
                <span className="text-gray-500"> · Page {comment.pageNumber}</span>
              ) : null}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => onResolveToggle(comment.id, !comment.isResolved)}
                className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
              >
                {comment.isResolved ? 'Unresolve' : 'Resolve'}
              </button>

              {canMutate && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing((v) => !v);
                      setEditValue(comment.content);
                    }}
                    className="p-1 rounded hover:bg-gray-100"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4 text-gray-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(comment.id)}
                    className="p-1 rounded hover:bg-gray-100"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-gray-600" />
                  </button>
                </>
              )}
            </div>
          </div>

          {!isEditing ? (
            <div className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{comment.content}</div>
          ) : (
            <div className="mt-2 border border-gray-200 rounded-lg p-3 bg-white">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={3}
                className="w-full resize-none text-sm outline-none"
              />
              <div className="mt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditValue(comment.content);
                  }}
                  className="px-3 py-1.5 text-sm rounded border border-gray-200 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={editValue.trim().length === 0}
                  onClick={async () => {
                    await onEdit(comment.id, editValue.trim());
                    setIsEditing(false);
                  }}
                  className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          <div className="mt-2 flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowReply((v) => !v)}
              className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 inline-flex items-center space-x-1"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Reply</span>
            </button>
          </div>

          {showReply && (
            <div className="mt-2">
              <CommentComposer
                placeholder="Write a reply... (Tip: mention someone with @email)"
                submitLabel="Reply"
                onCancel={() => setShowReply(false)}
                onSubmit={async (content) => {
                  await onReply(comment.id, content);
                  setShowReply(false);
                }}
              />
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              {comment.replies.map((r) => (
                <CommentItem
                  key={r.id}
                  comment={r}
                  depth={depth + 1}
                  currentUserId={currentUserId}
                  isSuperAdmin={isSuperAdmin}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onResolveToggle={onResolveToggle}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommentsPanel({ documentId }: CommentsPanelProps) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  const {
    listComments,
    addComment,
    replyToComment,
    updateComment,
    deleteComment,
    resolveComment,
  } = useDocuments();

  const [comments, setComments] = useState<DocumentComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(true);

  const visibleComments = useMemo(() => {
    if (showResolved) return comments;

    const filterTree = (items: DocumentComment[]): DocumentComment[] =>
      items
        .filter((c) => !c.isResolved)
        .map((c) => ({
          ...c,
          replies: c.replies ? filterTree(c.replies) : [],
        }));

    return filterTree(comments);
  }, [comments, showResolved]);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listComments(documentId);
      setComments(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Comments</h3>
          <p className="text-sm text-gray-500">Discuss this document with your team. Mention users with @email.</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowResolved((v) => !v)}
            className="px-3 py-1.5 text-sm rounded border border-gray-200 hover:bg-gray-50"
          >
            {showResolved ? 'Hide resolved' : 'Show resolved'}
          </button>
          <button
            type="button"
            onClick={reload}
            className="px-3 py-1.5 text-sm rounded border border-gray-200 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-start justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="p-1 rounded hover:bg-red-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mb-4">
        <CommentComposer
          placeholder="Add a comment..."
          submitLabel="Comment"
          disabled={loading}
          onSubmit={async (content) => {
            await addComment(documentId, { content });
            await reload();
          }}
        />
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading comments...</div>
      ) : visibleComments.length === 0 ? (
        <div className="text-sm text-gray-500">No comments yet.</div>
      ) : (
        <div>
          {visibleComments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              depth={0}
              currentUserId={user?.id}
              isSuperAdmin={!!isSuperAdmin}
              onReply={async (commentId, content) => {
                await replyToComment(commentId, { content });
                await reload();
              }}
              onEdit={async (commentId, content) => {
                await updateComment(commentId, { content });
                await reload();
              }}
              onDelete={async (commentId) => {
                if (!confirm('Delete this comment?')) return;
                await deleteComment(commentId);
                await reload();
              }}
              onResolveToggle={async (commentId, resolved) => {
                await resolveComment(commentId, resolved);
                await reload();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
