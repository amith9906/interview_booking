import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchStreaks,
  fetchTodayAssignment,
  submitQuizAttempt
} from '../../store/quizSlice';
import { format } from 'date-fns';

const QuizDashboard = () => {
  const dispatch = useDispatch();
  const { assignment, streaks, status, streakStatus, submissionStatus, submissionError, error } = useSelector(
    (state) => state.quiz
  );
  const [score, setScore] = useState(70);
  const [resultStatus, setResultStatus] = useState('passed');

  useEffect(() => {
    dispatch(fetchTodayAssignment());
    dispatch(fetchStreaks());
  }, [dispatch]);

  const mostRecentAttempt = useMemo(() => {
    if (!assignment?.Attempts?.length) return null;
    return [...assignment.Attempts].sort(
      (a, b) => new Date(b.completed_at ?? 0) - new Date(a.completed_at ?? 0)
    )[0];
  }, [assignment]);

  const handleSubmit = () => {
    if (!assignment) return;
    dispatch(
      submitQuizAttempt({
        assignment_id: assignment.id,
        score,
        status: resultStatus
      })
    );
  };

  if (status === 'loading') {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography>Loading today’s quiz…</Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (status === 'failed') {
    return <Alert severity="warning">{error || 'No quiz assigned today. Check back tomorrow.'}</Alert>;
  }

  return (
    <Card variant="outlined" sx={{ background: 'rgba(15, 23, 42, 0.75)' }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h5" fontWeight="600">
                {assignment?.Quiz?.title || 'Daily Quiz'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {assignment?.Quiz?.Skill?.name ? `${assignment.Quiz.Skill.name} skill drill` : 'Skill-focused quiz'}
              </Typography>
            </Box>
            <Chip
              label={`Due ${assignment?.due_date ? format(new Date(assignment.due_date), 'MMM d') : 'today'}`}
              color="primary"
            />
          </Stack>
          <Divider />
          {assignment?.Quiz?.questions?.length ? (
            <Stack spacing={1}>
              {assignment.Quiz.questions.map((question, index) => (
                <Box key={question.id}>
                  <Typography variant="subtitle2" fontWeight="600">
                    {index + 1}. {question.prompt || question.question || 'Question'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {question.hint || question.description || 'Tap the score slider once you review your reasoning'}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Awaiting fresh questions from the admin catalog.
            </Typography>
          )}
          <Divider />
          <Stack spacing={1}>
            <Typography variant="subtitle2">Submit a result</Typography>
            <TextField
              label="Score (%)"
              type="number"
              value={score}
              onChange={(event) => setScore(Math.min(100, Math.max(0, Number(event.target.value))))}
              InputProps={{ inputProps: { min: 0, max: 100 } }}
            />
            <Stack direction="row" spacing={1}>
              {['passed', 'failed'].map((option) => (
                <Button
                  key={option}
                  variant={resultStatus === option ? 'contained' : 'outlined'}
                  onClick={() => setResultStatus(option)}
                >
                  {option === 'passed' ? 'Passed' : 'Need practice'}
                </Button>
              ))}
            </Stack>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={!assignment || submissionStatus === 'loading'}
            >
              {submissionStatus === 'loading' ? 'Recording attempt…' : 'Record attempt'}
            </Button>
            {submissionError && <Alert severity="error">{submissionError}</Alert>}
          </Stack>
          <Divider />
          <Typography variant="subtitle1">Streaks</Typography>
          {streakStatus === 'loading' && <LinearProgress />}
          {streaks.length ? (
            <Stack spacing={1}>
              {streaks.map((streak) => (
                <Stack key={`${streak.user_id}-${streak.skill_id}`} spacing={0.5}>
                  <Typography variant="body2" fontWeight="600">
                    {streak.Skill?.name || 'Skill'}: {streak.current_streak} day streak
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Longest {streak.longest_streak} · last attempt {streak.last_attempt_day || 'n/a'}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Complete today’s quiz to start tracking streaks.
            </Typography>
          )}
          <Divider />
          <Box>
            <Typography variant="caption" color="text.secondary">
              Streaks reset if you miss a day—stay consistent to earn badges and improved rankings.
            </Typography>
          </Box>
          {mostRecentAttempt && (
            <Alert severity="info">
              Last attempt: {format(new Date(mostRecentAttempt.completed_at), 'PPpp')} · Score{' '}
              {mostRecentAttempt.score} · {mostRecentAttempt.status}
            </Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default QuizDashboard;
