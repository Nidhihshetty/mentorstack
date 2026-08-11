-- Reset all table ID sequences to fix unique constraint errors
SELECT setval(pg_get_serial_sequence('"User"', 'id'), COALESCE(MAX(id), 1)) FROM "User";
SELECT setval(pg_get_serial_sequence('"Question"', 'id'), COALESCE(MAX(id), 1)) FROM "Question";
SELECT setval(pg_get_serial_sequence('"Answer"', 'id'), COALESCE(MAX(id), 1)) FROM "Answer";
SELECT setval(pg_get_serial_sequence('"Article"', 'id'), COALESCE(MAX(id), 1)) FROM "Article";
SELECT setval(pg_get_serial_sequence('"Community"', 'id'), COALESCE(MAX(id), 1)) FROM "Community";
SELECT setval(pg_get_serial_sequence('"Tag"', 'id'), COALESCE(MAX(id), 1)) FROM "Tag";
SELECT setval(pg_get_serial_sequence('"QuestionTag"', 'id'), COALESCE(MAX(id), 1)) FROM "QuestionTag";
SELECT setval(pg_get_serial_sequence('"ArticleTag"', 'id'), COALESCE(MAX(id), 1)) FROM "ArticleTag";
SELECT setval(pg_get_serial_sequence('"CommunityPost"', 'id'), COALESCE(MAX(id), 1)) FROM "CommunityPost";
SELECT setval(pg_get_serial_sequence('"CommunityPostTag"', 'id'), COALESCE(MAX(id), 1)) FROM "CommunityPostTag";
SELECT setval(pg_get_serial_sequence('"CommunityMember"', 'id'), COALESCE(MAX(id), 1)) FROM "CommunityMember";
SELECT setval(pg_get_serial_sequence('"ArticleVote"', 'id'), COALESCE(MAX(id), 1)) FROM "ArticleVote";
SELECT setval(pg_get_serial_sequence('"AnswerVote"', 'id'), COALESCE(MAX(id), 1)) FROM "AnswerVote";
SELECT setval(pg_get_serial_sequence('"CommunityPostVote"', 'id'), COALESCE(MAX(id), 1)) FROM "CommunityPostVote";
-- Added additional tables
SELECT setval(pg_get_serial_sequence('"Connection"', 'id'), COALESCE(MAX(id), 1)) FROM "Connection";
SELECT setval(pg_get_serial_sequence('"Conversation"', 'id'), COALESCE(MAX(id), 1)) FROM "Conversation";
SELECT setval(pg_get_serial_sequence('"Message"', 'id'), COALESCE(MAX(id), 1)) FROM "Message";
SELECT setval(pg_get_serial_sequence('"QuestionBookmark"', 'id'), COALESCE(MAX(id), 1)) FROM "QuestionBookmark";
SELECT setval(pg_get_serial_sequence('"ArticleBookmark"', 'id'), COALESCE(MAX(id), 1)) FROM "ArticleBookmark";
SELECT setval(pg_get_serial_sequence('"CommunityPostBookmark"', 'id'), COALESCE(MAX(id), 1)) FROM "CommunityPostBookmark";
SELECT setval(pg_get_serial_sequence('"ReputationHistory"', 'id'), COALESCE(MAX(id), 1)) FROM "ReputationHistory";
SELECT setval(pg_get_serial_sequence('"Badge"', 'id'), COALESCE(MAX(id), 1)) FROM "Badge";
SELECT setval(pg_get_serial_sequence('"UserBadge"', 'id'), COALESCE(MAX(id), 1)) FROM "UserBadge";
SELECT setval(pg_get_serial_sequence('"AiLog"', 'id'), COALESCE(MAX(id), 1)) FROM "AiLog";
