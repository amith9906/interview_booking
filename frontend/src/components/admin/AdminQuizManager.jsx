import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';

const defaultForm = {
  title: '',
  skill_id: '',
  questions: [],
  published: false,
  next_publish_at: ''
};

const formatDateForInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
};

const AdminQuizManager = () => {
  const [skills, setSkills] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [skillsRes, quizzesRes] = await Promise.all([api.get('/admin/skills'), api.get('/admin/quizzes')]);
      setSkills(skillsRes.data);
      setQuizzes(quizzesRes.data.quizzes);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setForm({
      title: quiz.title,
      skill_id: quiz.skill_id,
      questions: (quiz.questions || []).map((q) => ({
        ...q,
        options: q.options?.length ? q.options : []
      })),
      published: quiz.published,
      next_publish_at: formatDateForInput(quiz.next_publish_at)
    });
  };

  const handleResetForm = () => {
    setSelectedQuiz(null);
    setForm(defaultForm);
  };

  const normalizeNextPublish = () => {
    if (!form.next_publish_at) return null;
    return new Date(form.next_publish_at).toISOString();
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.title || !form.skill_id) {
      setError('Title and skill are required.');
      return;
    }
    const payload = {
      title: form.title,
      skill_id: Number(form.skill_id),
      questions: form.questions,
      published: Boolean(form.published),
      next_publish_at: normalizeNextPublish()
    };
    try {
      if (selectedQuiz) {
        await api.patch(`/admin/quizzes/${selectedQuiz.id}`, payload);
        setStatus('Quiz updated successfully.');
      } else {
        await api.post('/admin/quizzes', payload);
        setStatus('Quiz created successfully.');
      }
      setForm(defaultForm);
      setSelectedQuiz(null);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleTogglePublished = async (quiz) => {
    try {
      await api.patch(`/admin/quizzes/${quiz.id}/publish`, { published: !quiz.published });
      setStatus(`Quiz ${quiz.published ? 'hidden' : 'published'} successfully.`);
      await loadData();
      if (selectedQuiz?.id === quiz.id) {
        handleSelectQuiz({ ...quiz, published: !quiz.published });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handlePublishNow = async (quiz) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await api.patch(`/admin/quizzes/${quiz.id}/publish`, {
        published: true,
        next_publish_at: tomorrow.toISOString()
      });
      setStatus('Quiz published and rescheduled.');
      await loadData();
      if (selectedQuiz?.id === quiz.id) {
        handleSelectQuiz({ ...quiz, published: true, next_publish_at: tomorrow.toISOString() });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const summaryCards = useMemo(() => {
    return quizzes.map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      skill: quiz.Skill?.name,
      published: quiz.published,
      questionCount: (quiz.questions?.length || 0),
      nextPublish: quiz.next_publish_at
    }));
  }, [quizzes]);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">Quiz catalog & automation</Typography>
          <Typography variant="body2" color="text.secondary">
            Review the quizzes published to students, adjust scheduling, and seed new assignments for
            specific skills.
          </Typography>
          {status && (
            <Alert severity="success" onClose={() => setStatus('')}>
              {status}
            </Alert>
          )}
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Button variant="outlined" onClick={handleResetForm}>
              Clear form
            </Button>
            <Button variant="contained" onClick={handleSubmit}>
              {selectedQuiz ? 'Update quiz' : 'Create quiz'}
            </Button>
          </Stack>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <TextField
                    label="Title"
                    value={form.title}
                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  />
                  <FormControl fullWidth>
                    <InputLabel>Skill</InputLabel>
                    <Select
                      value={form.skill_id}
                      label="Skill"
                      onChange={(event) => setForm((prev) => ({ ...prev, skill_id: event.target.value }))}
                    >
                      {skills.map((skill) => (
                        <MenuItem key={`skill-${skill.id}`} value={skill.id}>
                          {skill.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
          <Stack spacing={1}>
            <Typography variant="caption">Questions</Typography>
            {(form.questions || []).map((question, index) => (
              <Paper key={`question-${index}`} variant="outlined" sx={{ p: 1, mb: 1 }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2">Question {index + 1}</Typography>
                  <TextField
                    label="Prompt"
                    value={question.prompt || ''}
                    onChange={(event) => {
                      const next = [...form.questions];
                      next[index] = { ...next[index], prompt: event.target.value };
                      setForm((prev) => ({ ...prev, questions: next }));
                    }}
                  />
                  <TextField
                    label="Hint"
                    value={question.hint || ''}
                    onChange={(event) => {
                      const next = [...form.questions];
                      next[index] = { ...next[index], hint: event.target.value };
                      setForm((prev) => ({ ...prev, questions: next }));
                    }}
                  />
                  <TextField
                    label="Description"
                    value={question.description || ''}
                    onChange={(event) => {
                      const next = [...form.questions];
                      next[index] = { ...next[index], description: event.target.value };
                      setForm((prev) => ({ ...prev, questions: next }));
                    }}
                  />
                  <Stack spacing={1}>
                    <Typography variant="caption">Options</Typography>
                    {(question.options || []).map((option, optionIndex) => (
                      <Paper key={`option-${index}-${optionIndex}`} variant="outlined" sx={{ p: 1 }}>
                        <Stack spacing={1} direction="row" alignItems="center">
                          <TextField
                            label={`Option ${optionIndex + 1}`}
                            value={option.text || ''}
                            onChange={(event) => {
                              const next = [...form.questions];
                              next[index].options = [...(next[index].options || [])];
                              next[index].options[optionIndex] = {
                                ...next[index].options[optionIndex],
                                text: event.target.value
                              };
                              setForm((prev) => ({ ...prev, questions: next }));
                            }}
                            fullWidth
                          />
                          <FormControl>
                            <Select
                              value={option.is_correct ? 'true' : 'false'}
                              onChange={(event) => {
                                const next = [...form.questions];
                                next[index].options = [...(next[index].options || [])];
                                next[index].options[optionIndex] = {
                                  ...next[index].options[optionIndex],
                                  is_correct: event.target.value === 'true'
                                };
                                setForm((prev) => ({ ...prev, questions: next }));
                              }}
                              size="small"
                            >
                              <MenuItem value="false">Incorrect</MenuItem>
                              <MenuItem value="true">Correct</MenuItem>
                            </Select>
                          </FormControl>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => {
                              const next = [...form.questions];
                              next[index].options = [...(next[index].options || [])];
                              next[index].options.splice(optionIndex, 1);
                              setForm((prev) => ({ ...prev, questions: next }));
                            }}
                          >
                            Remove
                          </Button>
                        </Stack>
                      </Paper>
                    ))}
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        const next = [...form.questions];
                        next[index] = {
                          ...next[index],
                          options: [...(next[index].options || []), { text: '', is_correct: false }]
                        };
                        setForm((prev) => ({ ...prev, questions: next }));
                      }}
                    >
                      Add option
                    </Button>
                  </Stack>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => {
                      const next = [...form.questions];
                      next.splice(index, 1);
                      setForm((prev) => ({ ...prev, questions: next }));
                    }}
                  >
                    Remove question
                  </Button>
                </Stack>
              </Paper>
            ))}
            <Button
              size="small"
              variant="outlined"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  questions: [...(prev.questions || []), { prompt: '', hint: '', description: '', options: [] }]
                }))
              }
            >
              Add question
            </Button>
          </Stack>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="caption">Published</Typography>
                    <Switch
                      checked={form.published}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, published: event.target.checked }))
                      }
                    />
                    <TextField
                      label="Next publish"
                      type="datetime-local"
                      value={form.next_publish_at}
                      InputLabelProps={{ shrink: true }}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, next_publish_at: event.target.value }))
                      }
                    />
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                {summaryCards.map((quiz) => (
                  <Paper key={`quiz-${quiz.id}`} variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography fontWeight="600">{quiz.title}</Typography>
                        <Chip label={quiz.published ? 'Published' : 'Draft'} size="small" color="primary" />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        Skill: {quiz.skill || 'Unassigned'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Questions: {quiz.questionCount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Next publish: {quiz.nextPublish ? new Date(quiz.nextPublish).toLocaleString() : 'Not set'}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Button size="small" variant="outlined" onClick={() => handleSelectQuiz(quizzes.find((item) => item.id === quiz.id))}>
                          Edit
                        </Button>
                        <Button size="small" variant="contained" onClick={() => handlePublishNow(quizzes.find((item) => item.id === quiz.id))}>
                          Publish & schedule
                        </Button>
                        <Button size="small" onClick={() => handleTogglePublished(quizzes.find((item) => item.id === quiz.id))}>
                          {quiz.published ? 'Hide' : 'Publish'}
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default AdminQuizManager;
