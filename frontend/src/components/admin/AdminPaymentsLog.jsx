import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Card, CardContent, Divider, Paper, Stack, Typography } from '@mui/material';
import api from '../../utils/api';
import FilterBar from './FilterBar';

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'initiated', label: 'Initiated' },
  { value: 'success', label: 'Success' },
  { value: 'failure', label: 'Failure' }
];

const AdminPaymentsLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: ''
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.status) params.status = filters.status;
      const response = await api.get('/admin/payments/audit', { params });
      setLogs(response.data.audits || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const summary = useMemo(() => {
    if (!logs.length) return null;
    const success = logs.filter((log) => log.status === 'success').length;
    const failures = logs.filter((log) => log.status === 'failure').length;
    return { total: logs.length, success, failures };
  }, [logs]);

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" mb={2}>
          Payment Audit Trail
        </Typography>
        <FilterBar
          filters={filters}
          onChange={setFilters}
          showStatus
          statusOptions={statusOptions}
        />
        {error && <Alert severity="error">{error}</Alert>}
        {summary && (
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary">
              Total logs: {summary.total} · Success: {summary.success} · Failures: {summary.failures}
            </Typography>
          </Box>
        )}
        <Stack spacing={2}>
          {loading ? (
            <Typography variant="body2">Loading audit logs…</Typography>
          ) : logs.length ? (
            logs.map((log) => (
              <Paper key={log.id} variant="outlined" sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack spacing={0.5}>
                    <Typography fontWeight="bold">{log.booking?.id ? `Booking #${log.booking.id}` : 'General payment'}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Student: {log.Student?.User?.name || log.student_id || '—'} · Amount: ₹{(log.amount ?? 0).toLocaleString()}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{ textTransform: 'capitalize', color: log.status === 'success' ? 'success.main' : log.status === 'failure' ? 'error.main' : 'text.secondary' }}
                  >
                    {log.status}
                  </Typography>
                </Stack>
                <Divider sx={{ my: 1 }} />
                <Stack direction="row" spacing={2} flexWrap="wrap" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    Session: {log.session_id || '—'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Created: {new Date(log.created_at).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Message: {log.message || '—'}
                  </Typography>
                </Stack>
              </Paper>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No payment logs for the selected range.
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default AdminPaymentsLog;
