import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchResumes } from '../../store/resumeSlice';

const pipelineStatuses = ['Shortlisted', 'Interviewing', 'Offered'];

const formatRatingValue = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(1) : value;
};

const mapResumesToBoard = (resumes) => {
  const board = pipelineStatuses.reduce((acc, status) => ({ ...acc, [status]: [] }), {});
  if (!resumes?.length) return board;
  resumes.forEach((resume, idx) => {
    const status = pipelineStatuses[idx % pipelineStatuses.length];
    const ratingValue = resume.interviewer_rating ?? resume.rating ?? resume.ratings_avg ?? null;
    board[status].push({
      id: resume.id,
      name: resume.name || resume.student || 'Candidate',
      skills: resume.skills || [],
      rating: ratingValue,
      company: resume.company_name || 'Open'
    });
  });
  return board;
};

const ResumeMarketplace = () => {
  const dispatch = useDispatch();
  const resumes = useSelector((state) => state.resume.list);
  const status = useSelector((state) => state.resume.status);
  const [board, setBoard] = useState(() => mapResumesToBoard(resumes));
  const [activityLog, setActivityLog] = useState([]);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchResumes());
    }
  }, [dispatch, status]);

  useEffect(() => {
    if (status === 'succeeded') {
      setBoard(mapResumesToBoard(resumes));
    }
  }, [resumes, status]);

  const moveCandidate = (candidate, fromStatus, direction) => {
    const fromIndex = pipelineStatuses.indexOf(fromStatus);
    if (fromIndex < 0) return;
    const toIndex = direction === 'forward' ? fromIndex + 1 : fromIndex - 1;
    if (toIndex < 0 || toIndex >= pipelineStatuses.length) return;
    setBoard((prev) => {
      const next = pipelineStatuses[toIndex];
      const updated = { ...prev };
      updated[fromStatus] = updated[fromStatus].filter((item) => item.id !== candidate.id);
      updated[next] = [{ ...candidate }, ...updated[next]];
      return updated;
    });
    setActivityLog((prev) => [
      { id: Date.now(), text: `${candidate.name} moved from ${fromStatus} to ${pipelineStatuses[toIndex]}` },
      ...prev.slice(0, 9)
    ]);
  };

  const insights = useMemo(() => {
    return pipelineStatuses.map((statusName) => ({
      status: statusName,
      count: board[statusName].length
    }));
  }, [board]);

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {insights.map((insight) => (
          <Paper key={insight.status} variant="outlined" sx={{ p: 1, minWidth: 160 }}>
            <Typography variant="caption">{insight.status}</Typography>
            <Typography variant="h5" fontWeight="bold">
              {insight.count}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              candidates in this lane
            </Typography>
          </Paper>
        ))}
      </Stack>
      <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 2 }}>
        {pipelineStatuses.map((statusName) => (
          <Paper
            key={statusName}
            variant="outlined"
            sx={{
              minWidth: 280,
              p: 2,
              borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.1)',
              flexGrow: 1,
              background: 'rgba(15,23,42,0.5)'
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {statusName}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {(!board[statusName]?.length && (
              <Typography variant="body2" color="text.secondary">
                Drag candidates here to kickstart the stage.
              </Typography>
            )) || null}
            <Stack spacing={2}>
              {board[statusName]?.map((candidate) => (
                <Card
                  key={candidate.id}
                  variant="outlined"
                  sx={{ background: 'rgba(15,23,42,0.8)', borderRadius: 2 }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {candidate.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {candidate.company}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {candidate.skills.slice(0, 3).map((skill) => (
                          <Chip key={`${candidate.id}-${skill}`} label={skill} size="small" />
                        ))}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        Rating: {formatRatingValue(candidate.rating)}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        {statusName !== pipelineStatuses[0] && (
                          <Button
                            size="small"
                            onClick={() => moveCandidate(candidate, statusName, 'backward')}
                          >
                            Move Back
                          </Button>
                        )}
                        {statusName !== pipelineStatuses.at(-1) && (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => moveCandidate(candidate, statusName, 'forward')}
                          >
                            Advance
                          </Button>
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Paper>
        ))}
      </Stack>
      <Stack spacing={1}>
        <Typography variant="subtitle1">Activity log</Typography>
        {activityLog.length ? (
          activityLog.map((entry) => (
            <Typography key={entry.id} variant="body2" color="text.secondary">
              {entry.text}
            </Typography>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            No moves yet—start by building your shortlist.
          </Typography>
        )}
      </Stack>
    </Stack>
  );
};

export default ResumeMarketplace;
