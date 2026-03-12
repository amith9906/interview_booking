import {
  Badge,
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Popover,
  Stack,
  Typography
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useEffect, useState } from 'react';
import api from '../../utils/api';

const NotificationPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const formatNotificationDate = (notification) => {
    const timestamp = notification.createdAt || notification.created_at;
    if (!timestamp) return 'Unknown time';
    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) return 'Unknown time';
    return parsed.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markRead = async (id) => {
    await api.post(`/notifications/${id}/read`);
    loadNotifications();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const open = Boolean(anchorEl);
  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <IconButton onClick={handleOpen} sx={{ color: '#f8fafc' }} size="large" aria-label="notifications">
        <Badge
          badgeContent={unreadCount}
          color="error"
          sx={{ '& .MuiBadge-badge': { boxShadow: '0 0 0 2px rgba(15, 23, 42, 0.9)' } }}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 360, maxHeight: 420, p: 2, borderRadius: 3 } }}
      >
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="subtitle1" fontWeight="600" sx={{ flexGrow: 1 }}>
              Notifications
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={loadNotifications}
              disabled={loading}
              sx={{ borderColor: 'rgba(255,255,255,0.2)', '&:hover': { borderColor: 'rgba(255,255,255,0.3)' } }}
            >
              Refresh
            </Button>
          </Stack>
          <List
            dense
            sx={{
              '& .MuiListItem-root': {
                borderRadius: 2,
                mb: 1,
                background: 'rgba(255,255,255,0.02)',
                transition: 'background 0.2s',
                '&:hover': { background: 'rgba(255,255,255,0.05)' }
              },
              maxHeight: 300,
              overflow: 'auto'
            }}
          >
            {notifications.map((notification) => (
              <ListItem
                key={notification.id}
                secondaryAction={
                  <Button
                    size="small"
                    onClick={() => markRead(notification.id)}
                    sx={{ color: '#94a3b8' }}
                  >
                    Mark read
                  </Button>
                }
              >
                <ListItemText
                  primary={
                    <Typography
                      variant="subtitle2"
                      fontWeight={notification.read ? 400 : 700}
                      color={notification.read ? 'text.secondary' : 'text.primary'}
                    >
                      {notification.type}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {notification.message} · {formatNotificationDate(notification)}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
            {!notifications.length && (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No notifications yet. You're all caught up!
                </Typography>
              </Box>
            )}
          </List>
        </Stack>
      </Popover>
    </>
  );
};

export default NotificationPanel;
