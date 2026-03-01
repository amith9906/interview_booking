import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography
} from '@mui/material';
import QuizIcon from '@mui/icons-material/Quiz';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { addBadge } from '../../utils/engagementBadges';

const quizLibrary = [
  {
    id: 'react-basics',
    title: 'React Basics Warm-up',
    description: 'Validate your understanding of hooks, JSX, and component flows before booking.',
    difficulty: 'Beginner',
    tags: ['React', 'Hooks', 'JSX'],
    questions: [
      {
        id: 'react-1',
        question: 'Which hook lets you store state in a functional component?',
        options: ['useReducer', 'useState', 'useEffect', 'useMemo'],
        answer: 'useState'
      },
      {
        id: 'react-2',
        question: 'What does JSX compile into under the hood?',
        options: ['HTML strings', 'React.createElement calls', 'JSON blobs', 'CSS rules'],
        answer: 'React.createElement calls'
      },
      {
        id: 'react-3',
        question: 'Which prop keeps a component from re-rendering when the value does not change?',
        options: ['memo', 'useCallback', 'useRef', 'forwardRef'],
        answer: 'memo'
      }
    ]
  },
  {
    id: 'js-essentials',
    title: 'JavaScript Essentials',
    description: 'Brush up on hoisting, scoping, and modern syntax that frequently appear in interviews.',
    difficulty: 'Intermediate',
    tags: ['JavaScript', 'ES6', 'Closure'],
    questions: [
      {
        id: 'js-1',
        question: 'Which keyword creates a block-scoped variable?',
        options: ['var', 'let', 'function', 'arguments'],
        answer: 'let'
      },
      {
        id: 'js-2',
        question: 'What will `typeof null` return?',
        options: ['null', 'object', 'undefined', 'boolean'],
        answer: 'object'
      },
      {
        id: 'js-3',
        question: 'Which array method returns a new array without mutating the original?',
        options: ['sort', 'splice', 'map', 'push'],
        answer: 'map'
      }
    ]
  }
];

const CodingQuiz = () => {
  const [selectedQuizId, setSelectedQuizId] = useState(quizLibrary[0].id);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const quiz = useMemo(
    () => quizLibrary.find((item) => item.id === selectedQuizId) || quizLibrary[0],
    [selectedQuizId]
  );

  useEffect(() => {
    setAnswers({});
    setResult(null);
  }, [quiz.id]);

  const allAnswered = quiz.questions.every((question) => Boolean(answers[question.id]));

  const handleAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    const correctCount = quiz.questions.reduce(
      (acc, question) => (answers[question.id] === question.answer ? acc + 1 : acc),
      0
    );
    setResult({
      correct: correctCount,
      total: quiz.questions.length,
      confidence: Number(((correctCount / quiz.questions.length) * 100).toFixed(0))
    });
    if (correctCount === quiz.questions.length) {
      addBadge(`${quiz.title} Challenge`);
    }
    if (quiz.tags.includes('React') && correctCount >= quiz.questions.length - 1) {
      addBadge('React Ready');
    }
    if (correctCount / quiz.questions.length >= 0.7) {
      addBadge('Learning Momentum');
    }
  };

  const handleReset = () => {
    setAnswers({});
    setResult(null);
  };

  return (
    <Card
      variant="outlined"
      sx={{
        background: 'rgba(15,23,42,0.7)',
        border: '1px solid rgba(255,255,255,0.12)'
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <QuizIcon color="primary" />
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {quiz.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {quiz.description}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              icon={<LightbulbIcon />}
              label={`Difficulty: ${quiz.difficulty}`}
              variant="outlined"
              size="small"
            />
            {quiz.tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" color="primary" variant="outlined" />
            ))}
          </Stack>
          <Divider />
          {quiz.questions.map((question, index) => (
            <Box key={question.id}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {index + 1}. {question.question}
              </Typography>
              <FormControl component="fieldset">
                <RadioGroup
                  name={`${quiz.id}-${question.id}`}
                  value={answers[question.id] || ''}
                  onChange={(event) => handleAnswer(question.id, event.target.value)}
                >
                  {question.options.map((option) => (
                    <FormControlLabel
                      key={option}
                      value={option}
                      control={<Radio />}
                      label={option}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
              <Divider sx={{ mt: 1 }} />
            </Box>
          ))}
          <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
            <Button variant="contained" onClick={handleSubmit} disabled={!allAnswered}>
              Submit Answers
            </Button>
            <Button variant="outlined" onClick={handleReset} disabled={!Object.keys(answers).length && !result}>
              Reset
            </Button>
            <Typography variant="caption" color="text.secondary">
              Answer all questions to reveal instant feedback.
            </Typography>
          </Stack>
          {result && (
            <Box
              sx={{
                p: 2,
                background: 'rgba(16,185,129,0.08)',
                borderRadius: 2,
                border: '1px solid rgba(16,185,129,0.4)'
              }}
            >
              <Typography variant="body1" color="success.main" fontWeight="bold">
                You scored {result.correct} / {result.total} ({result.confidence}%)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {result.confidence >= 80
                  ? 'Great job! Use this confidence when reviewing interviewers or booking your next session.'
                  : 'Review the reasoning above and re-run the quiz to boost your rating.'}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default CodingQuiz;
