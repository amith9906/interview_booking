import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';

const listFromString = (value) =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const parseJsonField = (text) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const formatStudentRating = (student) => {
  const rating = student.latest_interview_rating ?? student.ratings_avg;
  if (rating === null || rating === undefined || rating === '') return '—';
  const numeric = Number(rating);
  return Number.isFinite(numeric) ? numeric.toFixed(1) : rating;
};

const UserManager = () => {
  const [skills, setSkills] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [companyInput, setCompanyInput] = useState('');
  const [users, setUsers] = useState({
    students: [],
    interviewers: [],
    studentCount: 0,
    interviewerCount: 0
  });
  const [studentPage, setStudentPage] = useState(0);
  const [studentPageSize, setStudentPageSize] = useState(10);
  const [interviewerPage, setInterviewerPage] = useState(0);
  const [interviewerPageSize, setInterviewerPageSize] = useState(10);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [studentDetail, setStudentDetail] = useState(null);
  const [studentDetailLoading, setStudentDetailLoading] = useState(false);
  const [studentFeedbackDialogOpen, setStudentFeedbackDialogOpen] = useState(false);
  const [studentFeedbackForm, setStudentFeedbackForm] = useState({
    name: '',
    email: '',
    experience: '',
    skills: '',
    endorsed_skills: '',
    ratings_avg: '',
    resume_file: '',
    location: ''
  });
  const [interviewFeedbackDialogOpen, setInterviewFeedbackDialogOpen] = useState(false);
  const [interviewerProfileDialogOpen, setInterviewerProfileDialogOpen] = useState(false);
  const [interviewerProfileForm, setInterviewerProfileForm] = useState({
    rate: '',
    skill_set: '',
    availability_slots: '',
    meeting_link: ''
  });
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsContext, setDetailsContext] = useState(null);
  const [interviewerFeedbackList, setInterviewerFeedbackList] = useState([]);
  const [courseDialog, setCourseDialog] = useState({
    open: false,
    course: null,
    registrations: [],
    loading: false,
    error: ''
  });
  const [internshipDialog, setInternshipDialog] = useState({
    open: false,
    internship: null,
    registrations: [],
    loading: false,
    error: ''
  });
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    studentId: '',
    companyId: '',
    skill: '',
    interviewerId: '',
    slotTime: '',
    amount: ''
  });
  const [addStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
  const [addStudentForm, setAddStudentForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    skills: '',
    experience: '',
    location: ''
  });
  const [addInterviewerDialogOpen, setAddInterviewerDialogOpen] = useState(false);
  const [addInterviewerForm, setAddInterviewerForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    company_id: '',
    rate: '',
    skill_set: '',
    availability_slots: '',
    meeting_link: ''
  });
  const [interviewFeedbackForm, setInterviewFeedbackForm] = useState({
    overall_rating: '',
    feedback: '',
    improve_areas: '',
    skill_ratings: '',
    skill_comments: ''
  });
  const [selectedInterviewBookingId, setSelectedInterviewBookingId] = useState('');
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [resumeModalState, setResumeModalState] = useState({
    selectedResumeId: '',
    cost: null,
    loadingCost: false,
    downloading: false,
    uploading: false,
    visibleToHr: false,
    publishing: false
  });
  const [resumeModalMessage, setResumeModalMessage] = useState('');
  const [studentVisibilityFilter, setStudentVisibilityFilter] = useState('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [studentFilters, setStudentFilters] = useState({
    name: '',
    skills: '',
    status: '',
    location: '',
    published: '',
    minRating: '',
    maxRating: '',
    minExperience: '',
    maxExperience: ''
  });
  const [interviewerFilters, setInterviewerFilters] = useState({
    name: '',
    company: '',
    status: '',
    minRating: '',
    maxRating: ''
  });

  const loadMasters = useCallback(async () => {
    const [skillsRes, companiesRes] = await Promise.all([api.get('/admin/skills'), api.get('/admin/companies')]);
    setSkills(skillsRes.data);
    setCompanies(companiesRes.data);
  }, []);

  const findMatchingUser = (type, id, data) => {
    if (!id || !data) return null;
    const list = type === 'student' ? data.students : data.interviewers;
    return list.find((item) => item.id === id) || null;
  };

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const response = await api.get('/admin/users/list', {
        params: {
          student_page: studentPage + 1,
          student_page_size: studentPageSize,
          interviewer_page: interviewerPage + 1,
          interviewer_page_size: interviewerPageSize
        }
      });
      const data = response.data || {};
      setUsers({
        students: data.students || [],
        interviewers: data.interviewers || [],
        studentCount: data.studentCount ?? 0,
        interviewerCount: data.interviewerCount ?? 0
      });
      return data;
    } finally {
      setLoadingUsers(false);
    }
  }, [studentPage, studentPageSize, interviewerPage, interviewerPageSize]);

  const handleStudentPageChange = (event, newPage) => {
    setStudentPage(newPage);
  };

  const handleStudentRowsPerPageChange = (event) => {
    const nextSize = Number(event.target.value) || 10;
    setStudentPageSize(nextSize);
    setStudentPage(0);
  };

  const handleInterviewerPageChange = (event, newPage) => {
    setInterviewerPage(newPage);
  };

  const handleInterviewerRowsPerPageChange = (event) => {
    const nextSize = Number(event.target.value) || 10;
    setInterviewerPageSize(nextSize);
    setInterviewerPage(0);
  };

  const latestResumeForStudent = (student) => {
    if (!student?.resumes?.length) return null;
    return student.resumes.reduce((latest, resume) => {
      if (!latest) return resume;
      return new Date(resume.created_at) > new Date(latest.created_at) ? resume : latest;
    }, null);
  };

  const filteredStudents = useMemo(() => {
    const filters = studentFilters;
    return (users.students || []).filter((student) => {
      const resume = latestResumeForStudent(student);
      const hasResume = Boolean(resume);
      const published = hasResume && resume.visible_to_hr;
      if (studentVisibilityFilter === 'published' && !published) return false;
      if (studentVisibilityFilter === 'hidden' && (hasResume ? published : true)) return false;
      if (filters.published) {
        if (filters.published === 'visible' && !published) return false;
        if (filters.published === 'hidden' && published) return false;
      }
      if (filters.name && !student.name?.toLowerCase().includes(filters.name.toLowerCase())) return false;
      if (filters.status && student.profile_status !== filters.status) return false;
      if (filters.location && !student.location?.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }
      if (filters.skills) {
        const reqSkills = filters.skills.split(',').map((s) => s.trim()).filter(Boolean);
        if (reqSkills.length) {
          const studentSkills = (student.skills || []).map((skill) => skill?.toLowerCase());
          if (!reqSkills.every((skill) => studentSkills.includes(skill.toLowerCase()))) {
            return false;
          }
        }
      }
      const ratingValue = student.latest_interview_rating ?? student.ratings_avg ?? 0;
      const parsedMinRating = Number(filters.minRating);
      const parsedMaxRating = Number(filters.maxRating);
      if (filters.minRating && !Number.isNaN(parsedMinRating) && ratingValue < parsedMinRating) return false;
      if (filters.maxRating && !Number.isNaN(parsedMaxRating) && ratingValue > parsedMaxRating) return false;
      const parsedMinExp = Number(filters.minExperience);
      const parsedMaxExp = Number(filters.maxExperience);
      if (filters.minExperience && !Number.isNaN(parsedMinExp) && (student.experience_years ?? 0) < parsedMinExp) {
        return false;
      }
      if (filters.maxExperience && !Number.isNaN(parsedMaxExp) && (student.experience_years ?? 0) > parsedMaxExp) {
        return false;
      }
      return true;
    });
  }, [users.students, studentVisibilityFilter, studentFilters]);

  const filteredInterviewers = useMemo(() => {
    const filters = interviewerFilters;
    return (users.interviewers || []).filter((interviewer) => {
      if (filters.name && !interviewer.name?.toLowerCase().includes(filters.name.toLowerCase())) {
        return false;
      }
      if (filters.company && !interviewer.company?.toLowerCase().includes(filters.company.toLowerCase())) {
        return false;
      }
      if (filters.status && interviewer.profile_status !== filters.status) {
        return false;
      }
      const rating = interviewer.average_rating ?? 0;
      const minRating = Number(filters.minRating);
      const maxRating = Number(filters.maxRating);
      if (filters.minRating && !Number.isNaN(minRating) && rating < minRating) return false;
      if (filters.maxRating && !Number.isNaN(maxRating) && rating > maxRating) return false;
      return true;
    });
  }, [users.interviewers, interviewerFilters]);

  const handleToggleStudentSelection = (studentId, hasResume) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else if (hasResume) {
        next.add(studentId);
      }
      return next;
    });
  };

  const handleSelectAllStudents = (checked) => {
    if (checked) {
      const selectable = filteredStudents
        .filter((student) => Boolean(latestResumeForStudent(student)))
        .map((student) => student.id);
      setSelectedStudentIds(new Set(selectable));
    } else {
      setSelectedStudentIds(new Set());
    }
  };

  const handleBulkVisibility = async (publish) => {
    if (!selectedUser?.data?.id) setActionStatus('');
    const targetStudents = users.students.filter((student) => selectedStudentIds.has(student.id));
    if (!targetStudents.length) {
      setActionStatus('Select at least one resume with an upload.');
      return;
    }
    setBulkActionLoading(true);
    try {
      await Promise.all(
        targetStudents.map(async (student) => {
          const resume = latestResumeForStudent(student);
          if (!resume) return;
          await api.patch(`/admin/resumes/${resume.id}/publish`, { publish });
        })
      );
      setActionStatus(publish ? 'Published selected resumes to HR.' : 'Hidden selected resumes from HR.');
      await loadUsers();
      if (selectedUser?.type === 'student') {
        await loadStudentDetail(selectedUser.data.id);
      }
      setSelectedStudentIds(new Set());
    } catch (error) {
      setActionStatus(error.response?.data?.message || 'Failed to update resume visibility.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const loadUserBookings = useCallback(async (type, id) => {
    if (!type || !id) return;
    setDetailLoading(true);
    try {
      const response = await api.get('/admin/bookings', {
        params: {
          role: type,
          userId: id
        }
      });
      setUserBookings(response.data.bookings || []);
      return response.data.bookings || [];
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const loadStudentDetail = useCallback(async (studentId) => {
    if (!studentId) {
      setStudentDetail(null);
      return;
    }
    setStudentDetailLoading(true);
    try {
      const response = await api.get(`/admin/students/${studentId}`);
      setStudentDetail(response.data.student);
      if (response.data.student?.resumes?.length) {
        const defaultResume = response.data.student.resumes[0];
        setResumeModalState((prev) => ({
          ...prev,
          selectedResumeId:
            prev.selectedResumeId || defaultResume?.id || '',
          visibleToHr: prev.visibleToHr || Boolean(defaultResume?.visible_to_hr),
          cost: null
        }));
      }
    } catch (err) {
      setActionStatus('Failed to load student details.');
    } finally {
      setStudentDetailLoading(false);
    }
  }, []);

  const handleSaveStudentFeedback = async () => {
    if (!selectedUser?.data?.id) return;
    setActionStatus('Updating student feedback...');
    try {
      const payload = {
        skills: listFromString(studentFeedbackForm.skills),
        endorsed_skills: listFromString(studentFeedbackForm.endorsed_skills),
        ratings_avg: studentFeedbackForm.ratings_avg ? Number(studentFeedbackForm.ratings_avg) : undefined,
        resume_file: studentFeedbackForm.resume_file || undefined
      };
      const profilePayload = {};
      const trimmedName = studentFeedbackForm.name?.trim();
      const trimmedEmail = studentFeedbackForm.email?.trim();
      if (trimmedName) profilePayload.name = trimmedName;
      if (trimmedEmail) profilePayload.email = trimmedEmail;
      if (studentFeedbackForm.experience) {
        profilePayload.experience_years = Number(studentFeedbackForm.experience);
      }
      const trimmedLocation = studentFeedbackForm.location?.trim() || '';
      const currentLocation = selectedUser?.data?.location || '';
      if (trimmedLocation !== currentLocation) {
        profilePayload.location = trimmedLocation || null;
      }
      await api.patch(`/admin/students/${selectedUser.data.id}/feedback`, payload);
      if (Object.keys(profilePayload).length) {
        await api.put(`/admin/students/${selectedUser.data.id}`, profilePayload);
      }
      const refreshed = await loadUsers();
      const refreshing = findMatchingUser(selectedUser.type, selectedUser.data.id, refreshed);
      if (refreshing) {
        setSelectedUser({ type: selectedUser.type, data: refreshing });
      }
      await loadStudentDetail(selectedUser.data.id);
      setActionStatus('Student feedback updated.');
      setStudentFeedbackDialogOpen(false);
    } catch (error) {
      setActionStatus(error.response?.data?.message || 'Failed to update student feedback.');
    }
  };

  const handleOpenInterviewFeedbackDialog = async (targetInterviewer) => {
    const context = normalizeInterviewerContext(targetInterviewer || selectedUser);
    if (!context) {
      setActionStatus('Select an interviewer with feedback first.');
      return;
    }
    handleSelectUser('interviewer', context.data);
    const bookings = await loadUserBookings('interviewer', context.data.id);
    const bookingWithInterview = (bookings || userBookings).find((booking) => booking.interview);
    if (!bookingWithInterview) {
      setActionStatus('No interview feedback available for this user yet.');
      return;
    }
    setSelectedInterviewBookingId(bookingWithInterview.id);
    const interview = bookingWithInterview.interview;
    setInterviewFeedbackForm({
      overall_rating: interview?.overall_rating?.toString?.() || '',
      feedback: interview?.feedback || '',
      improve_areas: interview?.improve_areas || '',
      skill_ratings: interview?.skill_ratings ? JSON.stringify(interview.skill_ratings) : '',
      skill_comments: interview?.skill_comments || ''
    });
    setInterviewFeedbackDialogOpen(true);
  };

  const handleOpenDetailsDialog = async (type, data) => {
    const target = data || (selectedUser?.type === type ? selectedUser.data : null);
    if (!target) return;
    handleSelectUser(type, target);
    setDetailsContext({ type, data: target });
    if (type === 'student') {
      await loadStudentDetail(target.id);
    } else if (type === 'interviewer') {
      await loadUserBookings('interviewer', target.id);
      try {
        const { data } = await api.get(`/admin/interviewers/${target.id}/feedback`);
        setInterviewerFeedbackList(data.feedback || []);
      } catch (error) {
        setInterviewerFeedbackList([]);
      }
    }
    setDetailsDialogOpen(true);
  };
  const handleCloseCourseDialog = () => {
    setCourseDialog((prev) => ({ ...prev, open: false }));
  };
  const handleCloseInternshipDialog = () => {
    setInternshipDialog((prev) => ({ ...prev, open: false }));
  };

  const handleOpenCourseDialog = async (courseId) => {
    if (!courseId) return;
    setCourseDialog({
      open: true,
      course: null,
      registrations: [],
      loading: true,
      error: ''
    });
    try {
      const response = await api.get(`/admin/courses/${courseId}/students`);
      setCourseDialog({
        open: true,
        course: response.data.course,
        registrations: response.data.registrations || [],
        loading: false,
        error: ''
      });
    } catch (error) {
      setCourseDialog((prev) => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || 'Unable to load registrations'
      }));
    }
  };

  const handleOpenInternshipDialog = async (internshipId) => {
    if (!internshipId) return;
    setInternshipDialog({
      open: true,
      internship: null,
      registrations: [],
      loading: true,
      error: ''
    });
    try {
      const response = await api.get(`/admin/internships/${internshipId}/students`);
      setInternshipDialog({
        open: true,
        internship: response.data.internship,
        registrations: response.data.registrations || [],
        loading: false,
        error: ''
      });
    } catch (error) {
      setInternshipDialog((prev) => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || 'Unable to load registrations'
      }));
    }
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setDetailsContext(null);
  };

  const handleOpenInterviewerProfileDialog = (interviewer) => {
    const target =
      interviewer ||
      (selectedUser?.type === 'interviewer' ? selectedUser.data : null);
    if (!target) return;
    handleSelectUser('interviewer', target);
    setInterviewerProfileForm({
      rate: target.rate?.toString?.() || '',
      skill_set: (target.skill_set || []).join(', '),
      availability_slots: JSON.stringify(target.availability_slots || [], null, 2),
      meeting_link: target.meeting_link || ''
    });
    setInterviewerProfileDialogOpen(true);
  };

  const handleSaveInterviewerProfile = async () => {
    if (selectedUser?.type !== 'interviewer' || !selectedUser?.data?.id) return;
    setActionStatus('Saving interviewer profile...');
    try {
      const payload = {};
      if (interviewerProfileForm.rate) {
        payload.rate = Number(interviewerProfileForm.rate);
      }
      const skills = listFromString(interviewerProfileForm.skill_set);
      if (skills.length) {
        payload.skill_set = skills;
      }
    const availability = parseJsonField(interviewerProfileForm.availability_slots);
    if (availability) {
      payload.availability_slots = availability;
    }
    if (interviewerProfileForm.meeting_link !== undefined) {
      payload.meeting_link = interviewerProfileForm.meeting_link?.trim() || null;
    }
      await api.put(`/admin/interviewers/${selectedUser.data.id}`, payload);
      const refreshed = await loadUsers();
      const updated = findMatchingUser('interviewer', selectedUser.data.id, refreshed);
      if (updated) {
        setSelectedUser({ type: 'interviewer', data: updated });
      }
      setActionStatus('Interviewer profile saved.');
      setInterviewerProfileDialogOpen(false);
    } catch (error) {
      setActionStatus(error.response?.data?.message || 'Failed to save interviewer profile.');
    }
  };

  const handleInterviewBookingChange = (bookingId) => {
    const booking = userBookings.find((item) => item.id === bookingId);
    if (!booking) return;
    const interview = booking.interview;
    setSelectedInterviewBookingId(booking.id);
    setInterviewFeedbackForm({
      overall_rating: interview?.overall_rating?.toString?.() || '',
      feedback: interview?.feedback || '',
      improve_areas: interview?.improve_areas || '',
      skill_ratings: interview?.skill_ratings ? JSON.stringify(interview.skill_ratings) : '',
      skill_comments: interview?.skill_comments || ''
    });
  };

  const handleSaveInterviewFeedback = async () => {
    if (!selectedInterviewBookingId) return;
    const booking = userBookings.find((b) => b.id === selectedInterviewBookingId);
    const interviewId = booking?.interview?.id;
    if (!interviewId) return;
    setActionStatus('Updating interview feedback...');
    try {
      const payload = {
        overall_rating: interviewFeedbackForm.overall_rating
          ? Number(interviewFeedbackForm.overall_rating)
          : undefined,
        feedback: interviewFeedbackForm.feedback || undefined,
        improve_areas: interviewFeedbackForm.improve_areas || undefined,
        skill_ratings: parseJsonField(interviewFeedbackForm.skill_ratings) || undefined,
        skill_comments: parseJsonField(interviewFeedbackForm.skill_comments) || interviewFeedbackForm.skill_comments
      };
      await api.patch(`/admin/interviews/${interviewId}/feedback`, payload);
      await loadUserBookings(selectedUser.type, selectedUser.data.id);
      setActionStatus('Interview feedback updated.');
      setInterviewFeedbackDialogOpen(false);
    } catch (error) {
      setActionStatus(error.response?.data?.message || 'Failed to update interview feedback.');
    }
  };

  const handleUploadResume = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedUser?.data?.id) return;
    const formData = new FormData();
    formData.append('resume', file);
    setResumeModalState((prev) => ({ ...prev, uploading: true }));
    setResumeModalMessage('Uploading resume...');
    try {
      await api.post(`/admin/students/${selectedUser.data.id}/resume`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await loadStudentDetail(selectedUser.data.id);
      const refreshed = await loadUsers();
      const refreshing = findMatchingUser(selectedUser.type, selectedUser.data.id, refreshed);
      if (refreshing) {
        setSelectedUser({ type: selectedUser.type, data: refreshing });
      }
      setResumeModalMessage('Resume uploaded.');
    } catch (error) {
      setResumeModalMessage(error.response?.data?.message || 'Failed to upload resume.');
    } finally {
      setResumeModalState((prev) => ({ ...prev, uploading: false }));
    }
  };

  const fetchResumeCost = useCallback(async (resumeId) => {
    if (!resumeId) return;
    setResumeModalState((prev) => ({ ...prev, loadingCost: true, selectedResumeId: resumeId }));
    try {
      const response = await api.get(`/admin/resumes/${resumeId}/cost`);
      setResumeModalState((prev) => ({ ...prev, cost: response.data.cost_points }));
      setResumeModalMessage(
        `Cost: ${response.data.cost_points} points · Downloads: ${response.data.download_count}`
      );
    } catch (error) {
      setResumeModalState((prev) => ({ ...prev, cost: null }));
      setResumeModalMessage(error.response?.data?.message || 'Unable to fetch resume cost.');
    } finally {
      setResumeModalState((prev) => ({ ...prev, loadingCost: false }));
    }
  }, []);

  const handleResumeSelectionChange = (event) => {
    const resumeId = event.target.value;
    setResumeModalState((prev) => ({
      ...prev,
      selectedResumeId: resumeId,
      cost: null
    }));
    if (resumeId) {
      fetchResumeCost(resumeId);
    }
  };

  const { selectedResumeId, visibleToHr } = resumeModalState;

  useEffect(() => {
    const selected = studentDetail?.resumes?.find(
      (resume) => `${resume.id}` === `${selectedResumeId}`
    );
    if (selected && Boolean(selected.visible_to_hr) !== visibleToHr) {
      setResumeModalState((prev) => ({ ...prev, visibleToHr: Boolean(selected.visible_to_hr) }));
    }
  }, [studentDetail, selectedResumeId, visibleToHr]);

  const handleDownloadResume = async () => {
    if (!resumeModalState.selectedResumeId) {
      setResumeModalMessage('Select a resume before downloading.');
      return;
    }
    setResumeModalState((prev) => ({ ...prev, downloading: true }));
    try {
      const response = await api.get(`/admin/resumes/${resumeModalState.selectedResumeId}`);
      if (response.data.url) {
        window.open(response.data.url, '_blank');
      }
      setResumeModalMessage(
        `Downloaded ${response.data.candidate || 'candidate'} · Cost: ${response.data.cost_points}`
      );
      await loadStudentDetail(selectedUser.data.id);
    } catch (error) {
      setResumeModalMessage(error.response?.data?.message || 'Failed to download resume.');
    } finally {
      setResumeModalState((prev) => ({ ...prev, downloading: false }));
    }
  };

  const handleToggleResumeVisibility = async () => {
    if (!resumeModalState.selectedResumeId) {
      setResumeModalMessage('Select a resume before publishing to HR.');
      return;
    }
    if (!selectedUser?.data?.id) {
      setResumeModalMessage('Select a student first.');
      return;
    }
    setResumeModalState((prev) => ({ ...prev, publishing: true }));
    const publish = !resumeModalState.visibleToHr;
    try {
      const response = await api.patch(`/admin/resumes/${resumeModalState.selectedResumeId}/publish`, {
        publish
      });
      setResumeModalMessage(
        publish ? 'Resume published to HR.' : 'Resume hidden from HR.'
      );
      await loadStudentDetail(selectedUser.data.id);
      const refreshedUsers = await loadUsers();
      const refreshedStudent = findMatchingUser('student', selectedUser.data.id, refreshedUsers);
      if (refreshedStudent) {
        setSelectedUser({ type: 'student', data: refreshedStudent });
      }
      setResumeModalState((prev) => ({
        ...prev,
        visibleToHr: Boolean(response.data.resume?.visible_to_hr)
      }));
    } catch (error) {
      setResumeModalMessage(error.response?.data?.message || 'Failed to update resume visibility.');
    } finally {
      setResumeModalState((prev) => ({ ...prev, publishing: false }));
    }
  };

  const handleOpenResumeDialog = () => {
    setResumeDialogOpen(true);
    setResumeModalMessage('');
  };

  const handleCloseResumeDialog = () => {
    setResumeDialogOpen(false);
    setResumeModalMessage('');
    setResumeModalState((prev) => ({ ...prev, cost: null, downloading: false }));
  };

  useEffect(() => {
    loadMasters();
  }, [loadMasters]);

  useEffect(() => {
    loadUsers().then((data) => {
      setSelectedUser((prev) => {
        if (prev) return prev;
        if (data?.students?.length) return { type: 'student', data: data.students[0] };
        if (data?.interviewers?.length) return { type: 'interviewer', data: data.interviewers[0] };
        return null;
      });
    });
  }, [loadUsers]);

  useEffect(() => {
    if (selectedUser) {
      loadUserBookings(selectedUser.type, selectedUser.data.id);
      setRejectionReason('');
      setActionStatus('');
    }
  }, [selectedUser, loadUserBookings]);

  useEffect(() => {
    if (selectedUser?.type === 'student') {
      loadStudentDetail(selectedUser.data.id);
    } else {
      setStudentDetail(null);
    }
  }, [selectedUser, loadStudentDetail]);

  useEffect(() => {
    if (!interviewFeedbackDialogOpen) {
      const bookingWithInterview = userBookings.find((booking) => booking.interview);
      if (bookingWithInterview) {
        setSelectedInterviewBookingId(bookingWithInterview.id);
        const interview = bookingWithInterview.interview;
        setInterviewFeedbackForm({
          overall_rating: interview?.overall_rating?.toString?.() || '',
          feedback: interview?.feedback || '',
          improve_areas: interview?.improve_areas || '',
          skill_ratings: interview?.skill_ratings ? JSON.stringify(interview.skill_ratings) : '',
          skill_comments: interview?.skill_comments || ''
        });
      }
    }
  }, [userBookings, interviewFeedbackDialogOpen]);

  useEffect(() => {
    if (resumeDialogOpen && resumeModalState.selectedResumeId) {
      fetchResumeCost(resumeModalState.selectedResumeId);
    }
  }, [resumeDialogOpen, resumeModalState.selectedResumeId, fetchResumeCost]);

  useEffect(() => {
    if (selectedUser?.type === 'student') {
      const interviewerRating = selectedUser.data.latest_interview_rating ?? selectedUser.data.ratings_avg;
      setStudentFeedbackForm({
        name: selectedUser.data.name || '',
        email: selectedUser.data.email || '',
        experience: selectedUser.data.experience_years?.toString?.() || '',
        skills: (selectedUser.data.skills || []).join(', '),
        endorsed_skills: (selectedUser.data.endorsed_skills || []).join(', '),
        ratings_avg: interviewerRating?.toString?.() || '',
        resume_file: selectedUser.data.resume_file || '',
        location: selectedUser.data.location || ''
      });
    }
  }, [selectedUser]);

  const handleAddSkill = async () => {
    if (!skillInput) return;
    await api.post('/admin/skills', { name: skillInput });
    setSkillInput('');
    loadMasters();
  };

  const handleAddCompany = async () => {
    if (!companyInput) return;
    await api.post('/admin/companies', { name: companyInput });
    setCompanyInput('');
    loadMasters();
  };

  const handleCreateStudent = async () => {
    setActionStatus('Creating student...');
    const payload = {
      email: addStudentForm.email,
      password: addStudentForm.password,
      name: addStudentForm.name,
      phone: addStudentForm.phone,
      skills: listFromString(addStudentForm.skills),
      experience_years: addStudentForm.experience ? Number(addStudentForm.experience) : 0,
      location: addStudentForm.location
    };
    try {
      await api.post('/admin/students', payload);
      setActionStatus('Student created.');
      setAddStudentDialogOpen(false);
      setAddStudentForm({
        email: '',
        password: '',
        name: '',
        phone: '',
        skills: '',
        experience: '',
        location: ''
      });
      await loadUsers();
    } catch (error) {
      setActionStatus(error.response?.data?.message || 'Failed to create student.');
    }
  };

  const handleCreateInterviewer = async () => {
    setActionStatus('Creating interviewer...');
    if (!addInterviewerForm.company_id) {
      setActionStatus('Company required for interviewer.');
      return;
    }
    const payload = {
      email: addInterviewerForm.email,
      password: addInterviewerForm.password,
      name: addInterviewerForm.name,
      phone: addInterviewerForm.phone,
      company_id: Number(addInterviewerForm.company_id),
      rate: addInterviewerForm.rate ? Number(addInterviewerForm.rate) : undefined,
      skill_set: listFromString(addInterviewerForm.skill_set),
      availability_slots: parseJsonField(addInterviewerForm.availability_slots) || []
    };
    if (addInterviewerForm.meeting_link?.trim()) {
      payload.meeting_link = addInterviewerForm.meeting_link.trim();
    }
    try {
      await api.post('/admin/interviewers', payload);
      setActionStatus('Interviewer created.');
      setAddInterviewerDialogOpen(false);
      setAddInterviewerForm({
        email: '',
        password: '',
        name: '',
        phone: '',
        company_id: '',
        rate: '',
        skill_set: '',
        availability_slots: '',
        meeting_link: ''
      });
      await loadUsers();
    } catch (error) {
      setActionStatus(error.response?.data?.message || 'Failed to create interviewer.');
    }
  };

  const handleSelectUser = (type, data) => {
    setSelectedUser({ type, data });
  };

  const handleOpenStudentFeedback = (student) => {
    handleSelectUser('student', student);
    setStudentFeedbackDialogOpen(true);
  };

  const handleResumeActionsClick = (student) => {
    handleSelectUser('student', student);
    setResumeDialogOpen(true);
    setResumeModalMessage('');
  };

  const handleToggleActive = async (type, data) => {
    if (!data) return;
    const reason = window.prompt(`Reason for ${data.is_active ? 'deactivation' : 'activation'}?`);
    if (reason === null) return;
    setActionStatus('Updating active state...');
    try {
      await api.patch(`/admin/profiles/${type}/${data.id}/active`, {
        active: !data.is_active,
        reason
      });
      const refreshed = await loadUsers();
      const refreshedUser = findMatchingUser(type, data.id, refreshed);
      if (refreshedUser) {
        setSelectedUser({ type, data: refreshedUser });
      }
      setActionStatus('Active state updated.');
    } catch (error) {
      setActionStatus(error.response?.data?.message || 'Failed to update active state.');
    }
  };

  const handleDownloadFeedbackTemplate = async (type, target) => {
    const role = type || selectedUser?.type;
    const data =
      target || (selectedUser?.type === role ? selectedUser.data : null);
    if (!role || !data) {
      setActionStatus('Select a user with feedback first.');
      return;
    }
    handleSelectUser(role, data);
    const bookings = await loadUserBookings(role, data.id);
    const bookingWithInterview = (bookings || userBookings).find((booking) => booking.interview?.id);
    if (!bookingWithInterview) {
      setActionStatus('No interview feedback available to download.');
      return;
    }
    try {
      const response = await api.get(`/admin/templates/feedback/${bookingWithInterview.interview.id}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `feedback-${bookingWithInterview.interview.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setActionStatus('Feedback report downloaded.');
    } catch (error) {
      setActionStatus(error.response?.data?.message || 'Failed to download feedback template.');
    }
  };

  const handleProfileAction = async (status, reason = '') => {
    if (!selectedUser) return;
    setActionStatus('Updating profile...');
    try {
      const payload = { status };
      if (status === 'rejected' && reason) {
        payload.notes = reason;
      }
      await api.patch(`/admin/profiles/${selectedUser.type}/${selectedUser.data.id}`, payload);
      const data = await loadUsers();
      const refreshing = findMatchingUser(selectedUser.type, selectedUser.data.id, data);
      if (refreshing) {
        setSelectedUser({ type: selectedUser.type, data: refreshing });
      }
      setActionStatus('Profile updated.');
    } catch (err) {
      setActionStatus(err.response?.data?.message || err.message || 'Failed to update profile.');
    }
  };

  const studentAnalytics = studentDetail?.analytics;

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" mb={2}>
        User Manager & Masters
      </Typography>
      <Stack spacing={2}>
      
        <Divider />
        <Typography variant="h6" mt={2}>
          User directory
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" size="small" onClick={() => setAddStudentDialogOpen(true)}>
            Add student
          </Button>
          <Button variant="contained" size="small" onClick={() => setAddInterviewerDialogOpen(true)}>
            Add interviewer
          </Button>
        </Stack>
        {loadingUsers ? (
          <CircularProgress size={24} />
        ) : (
          <>
            <Stack direction="row" alignItems="center" spacing={2} mt={2} mb={1}>
              <Typography variant="subtitle1">Students</Typography>
              <FormControl size="small">
                <InputLabel>Visibility</InputLabel>
                <Select
                  value={studentVisibilityFilter}
                  label="Visibility"
                  onChange={(event) => setStudentVisibilityFilter(event.target.value)}
                >
                  <MenuItem value="all">All resumes</MenuItem>
                  <MenuItem value="published">Published to HR</MenuItem>
                  <MenuItem value="hidden">Hidden from HR</MenuItem>
                </Select>
              </FormControl>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={!selectedStudentIds.size || bulkActionLoading}
                  onClick={() => handleBulkVisibility(true)}
                >
                  Publish selected
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={!selectedStudentIds.size || bulkActionLoading}
                  onClick={() => handleBulkVisibility(false)}
                >
                  Hide selected
                </Button>
              </Stack>
            </Stack>
            <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 1 }}>
              <TextField
                size="small"
                label="Name"
                value={studentFilters.name}
                onChange={(event) => setStudentFilters((prev) => ({ ...prev, name: event.target.value }))}
              />
              <TextField
                size="small"
                label="Skills"
                value={studentFilters.skills}
                onChange={(event) => setStudentFilters((prev) => ({ ...prev, skills: event.target.value }))}
              />
              <TextField
                size="small"
                label="Job location"
                value={studentFilters.location}
                onChange={(event) => setStudentFilters((prev) => ({ ...prev, location: event.target.value }))}
              />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={studentFilters.status}
                  onChange={(event) => setStudentFilters((prev) => ({ ...prev, status: event.target.value }))}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="pending_review">Pending review</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Published</InputLabel>
                <Select
                  label="Published"
                  value={studentFilters.published}
                  onChange={(event) => setStudentFilters((prev) => ({ ...prev, published: event.target.value }))}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="visible">Visible to HR</MenuItem>
                  <MenuItem value="hidden">Hidden</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="Min rating"
                type="number"
                value={studentFilters.minRating}
                onChange={(event) => setStudentFilters((prev) => ({ ...prev, minRating: event.target.value }))}
              />
              <TextField
                size="small"
                label="Max rating"
                type="number"
                value={studentFilters.maxRating}
                onChange={(event) => setStudentFilters((prev) => ({ ...prev, maxRating: event.target.value }))}
              />
              <TextField
                size="small"
                label="Min experience"
                type="number"
                value={studentFilters.minExperience}
                onChange={(event) => setStudentFilters((prev) => ({ ...prev, minExperience: event.target.value }))}
              />
              <TextField
                size="small"
                label="Max experience"
                type="number"
                value={studentFilters.maxExperience}
                onChange={(event) => setStudentFilters((prev) => ({ ...prev, maxExperience: event.target.value }))}
              />
            </Stack>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
              <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            size="small"
                            indeterminate={
                              selectedStudentIds.size > 0 && selectedStudentIds.size < filteredStudents.length
                            }
                            checked={
                              filteredStudents.length > 0 &&
                              selectedStudentIds.size ===
                                filteredStudents.filter((student) => Boolean(latestResumeForStudent(student))).length
                            }
                            onChange={(event) => handleSelectAllStudents(event.target.checked)}
                          />
                        </TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Rating</TableCell>
                        <TableCell>Published</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Skills</TableCell>
                        <TableCell align="right">Experience</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                <TableBody>
                  {filteredStudents.map((student) => {
                    const resume = latestResumeForStudent(student);
                    const hasResume = Boolean(student?.resumes?.length);
                    const published = (student?.resumes || []).some((r) => r.visible_to_hr);
                    return (
                      <TableRow
                        key={`student-${student.id}`}
                        hover
                        sx={{ cursor: 'pointer' }}
                        selected={selectedUser?.type === 'student' && selectedUser?.data?.id === student.id}
                        onClick={() => setSelectedUser({ type: 'student', data: student })}
                      >
                        <TableCell padding="checkbox" onClick={(event) => event.stopPropagation()}>
                          <Checkbox
                            size="small"
                            checked={selectedStudentIds.has(student.id)}
                            disabled={!hasResume}
                            onChange={() => handleToggleStudentSelection(student.id, hasResume)}
                          />
                        </TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.profile_status}</TableCell>
                        <TableCell>{formatStudentRating(student)}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={published ? 'success' : 'default'}
                            label={published ? 'Published' : 'Hidden'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{student.location || '—'}</TableCell>
                        <TableCell>{(student.skills || []).join(', ') || '—'}</TableCell>
                        <TableCell align="right">{student.experience_years || '—'}</TableCell>
                        <TableCell>
                          <Stack direction="column" spacing={0.5} alignItems="flex-end">
                            <Stack spacing={0.5}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleOpenDetailsDialog('student', student)}
                              >
                                View
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleOpenStudentFeedback(student)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleToggleActive('student', student)}
                              >
                                {student.is_active ? 'Deactivate' : 'Activate'}
                              </Button>
                            </Stack>
                            <Stack direction="row" spacing={0.5}>
                              <Button size="small" variant="contained" onClick={() => handleResumeActionsClick(student)}>
                                Resume
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleDownloadFeedbackTemplate('student', student)}
                              >
                                Template
                              </Button>
                            </Stack>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!filteredStudents.length && (
                    <TableRow>
                    <TableCell colSpan={10} align="center">
                        No student profiles yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={users.studentCount || 0}
              page={studentPage}
              onPageChange={handleStudentPageChange}
              rowsPerPage={studentPageSize}
              onRowsPerPageChange={handleStudentRowsPerPageChange}
              rowsPerPageOptions={[5, 10, 25]}
              showFirstButton
              showLastButton
              labelRowsPerPage="Students per page"
            />
            <Typography variant="subtitle1">Interviewers</Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" mb={2}>
              <TextField
                size="small"
                label="Name"
                value={interviewerFilters.name}
                onChange={(event) =>
                  setInterviewerFilters((prev) => ({ ...prev, name: event.target.value }))
                }
              />
              <TextField
                size="small"
                label="Company"
                value={interviewerFilters.company}
                onChange={(event) =>
                  setInterviewerFilters((prev) => ({ ...prev, company: event.target.value }))
                }
              />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={interviewerFilters.status}
                  onChange={(event) =>
                    setInterviewerFilters((prev) => ({ ...prev, status: event.target.value }))
                  }
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="pending_review">Pending review</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="Min rating"
                type="number"
                value={interviewerFilters.minRating}
                onChange={(event) =>
                  setInterviewerFilters((prev) => ({ ...prev, minRating: event.target.value }))
                }
              />
              <TextField
                size="small"
                label="Max rating"
                type="number"
                value={interviewerFilters.maxRating}
                onChange={(event) =>
                  setInterviewerFilters((prev) => ({ ...prev, maxRating: event.target.value }))
                }
              />
            </Stack>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Rate</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInterviewers.map((interviewer) => (
                    <TableRow
                      key={`interviewer-${interviewer.id}`}
                      hover
                      sx={{ cursor: 'pointer' }}
                      selected={selectedUser?.type === 'interviewer' && selectedUser?.data?.id === interviewer.id}
                      onClick={() => setSelectedUser({ type: 'interviewer', data: interviewer })}
                    >
                      <TableCell>
                        {interviewer.name}
                        {interviewer.badge && (
                          <Chip
                            label={interviewer.badge}
                            size="small"
                            color="secondary"
                            sx={{ ml: 1, fontSize: '0.65rem' }}
                          />
                        )}
                      </TableCell>
                      <TableCell>{interviewer.email}</TableCell>
                      <TableCell>{interviewer.company || '—'}</TableCell>
                      <TableCell>{interviewer.average_rating?.toFixed?.(1) ?? '—'}</TableCell>
                      <TableCell>₹{interviewer.rate ?? '—'}</TableCell>
                      <TableCell>{interviewer.profile_status}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenDetailsDialog('interviewer', interviewer)}
                          >
                            View
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={handleOpenInterviewFeedbackDialog}
                            disabled={!userBookings.some((booking) => booking.interview)}
                          >
                            Edit Feedback
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleToggleActive('interviewer', interviewer)}
                          >
                            {interviewer.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenInterviewerProfileDialog(interviewer)}
                          >
                            Edit profile
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!filteredInterviewers.length && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No interviewer profiles yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={users.interviewerCount || 0}
              page={interviewerPage}
              onPageChange={handleInterviewerPageChange}
              rowsPerPage={interviewerPageSize}
              onRowsPerPageChange={handleInterviewerRowsPerPageChange}
              rowsPerPageOptions={[5, 10, 25]}
              showFirstButton
              showLastButton
              labelRowsPerPage="Interviewers per page"
            />
          </>
        )}
        {selectedUser && (
          <Paper sx={{ mt: 3, p: 2, borderRadius: 2, background: 'rgba(255,255,255,0.02)' }}>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6">
                  {selectedUser.type === 'student' ? 'Student' : 'Interviewer'} details
                </Typography>
                {selectedUser?.data?.badge && (
                  <Chip
                    label={selectedUser.data.badge}
                    size="small"
                    color="secondary"
                    sx={{ fontSize: '0.65rem' }}
                  />
                )}
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {selectedUser.data.name} · {selectedUser.data.email}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button variant="contained" size="small" color="success" onClick={() => handleProfileAction('approved')}>
                  {selectedUser.type === 'student' ? 'Approve student' : 'Accept interviewer'}
                </Button>
                <Button variant="outlined" size="small" color="error" onClick={() => handleProfileAction('rejected', rejectionReason)}>
                  {selectedUser.type === 'student' ? 'Reject student' : 'Reject interviewer'}
                </Button>
                <Typography variant="caption" color="text.secondary">
                  Current status: {selectedUser.data.profile_status}
                </Typography>
              </Stack>
              <TextField
                label="Rejection reason"
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                fullWidth
                size="small"
                multiline
                rows={2}
                helperText="Optional note that will be saved with the rejection."
              />
              <Typography variant="body2">
                Bookings ({userBookings.length}) · Current rating: {selectedUser.data.average_rating ?? '—'}
              </Typography>
              {studentAnalytics ? (
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <Typography variant="caption" color="text.secondary">
                    Completed: {studentAnalytics.bookings_completed ?? '—'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Pending: {studentAnalytics.bookings_pending ?? '—'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Revenue: ₹{studentAnalytics.revenue?.toLocaleString?.() ?? '—'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Resume downloads: {studentAnalytics.resume_downloads ?? 0}
                  </Typography>
                </Stack>
              ) : null}
              {detailLoading ? (
                <CircularProgress size={20} />
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Rating</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {userBookings.length ? (
                        userBookings.slice(0, 5).map((booking) => (
                          <TableRow key={`booking-${booking.id}`}>
                            <TableCell>{new Date(booking.slot_time).toLocaleString()}</TableCell>
                            <TableCell>{booking.status}</TableCell>
                            <TableCell>₹{booking.amount ?? 0}</TableCell>
                            <TableCell>{booking.interview?.overall_rating?.toFixed?.(1) ?? '—'}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            No recent bookings.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              {selectedUser.type === 'student' && (
                <Stack spacing={1} mt={2}>
                  <Typography variant="subtitle2">Admin actions</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setStudentFeedbackDialogOpen(true)}
                  >
                    Edit student profile
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleOpenInterviewFeedbackDialog}
                    disabled={!userBookings.some((booking) => booking.interview)}
                  >
                    Edit interview feedback
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleOpenResumeDialog}
                    disabled={studentDetailLoading && !studentDetail}
                  >
                    Resume actions
                  </Button>
                </Stack>
              </Stack>
            )}
            {actionStatus && (
              <Typography variant="caption" color="success.main">
                {actionStatus}
              </Typography>
            )}
            </Stack>
          </Paper>
        )}
      </Stack>
    <Dialog
      open={studentFeedbackDialogOpen}
      onClose={() => setStudentFeedbackDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit student profile feedback</DialogTitle>
        <DialogContent>
        <TextField
          label="Full name"
          value={studentFeedbackForm.name}
          onChange={(event) =>
            setStudentFeedbackForm((prev) => ({ ...prev, name: event.target.value }))
          }
          fullWidth
          margin="dense"
        />
        <TextField
          label="Email"
          value={studentFeedbackForm.email}
          onChange={(event) =>
            setStudentFeedbackForm((prev) => ({ ...prev, email: event.target.value }))
          }
          fullWidth
          margin="dense"
        />
        <TextField
          label="Experience (years)"
          type="number"
          value={studentFeedbackForm.experience}
          onChange={(event) =>
            setStudentFeedbackForm((prev) => ({ ...prev, experience: event.target.value }))
          }
          fullWidth
          margin="dense"
        />
        <TextField
          label="Job location"
          value={studentFeedbackForm.location}
          onChange={(event) =>
            setStudentFeedbackForm((prev) => ({ ...prev, location: event.target.value }))
          }
          fullWidth
          margin="dense"
        />
        <TextField
          label="Skills (comma separated)"
          value={studentFeedbackForm.skills}
          onChange={(event) =>
            setStudentFeedbackForm((prev) => ({ ...prev, skills: event.target.value }))
          }
          fullWidth
          margin="dense"
        />
          <TextField
            label="Endorsed skills (comma separated)"
            value={studentFeedbackForm.endorsed_skills}
            onChange={(event) =>
              setStudentFeedbackForm((prev) => ({ ...prev, endorsed_skills: event.target.value }))
            }
            fullWidth
            margin="dense"
          />
          <TextField
            label="Avg. rating"
            type="number"
            value={studentFeedbackForm.ratings_avg}
            onChange={(event) =>
              setStudentFeedbackForm((prev) => ({ ...prev, ratings_avg: event.target.value }))
            }
            fullWidth
            margin="dense"
          />
          <TextField
            label="Resume file path"
            value={studentFeedbackForm.resume_file}
            onChange={(event) =>
              setStudentFeedbackForm((prev) => ({ ...prev, resume_file: event.target.value }))
            }
            fullWidth
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStudentFeedbackDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveStudentFeedback}>
            Save
          </Button>
        </DialogActions>
    </Dialog>
    <Dialog
      open={interviewFeedbackDialogOpen}
        onClose={() => setInterviewFeedbackDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit interview feedback</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Booking</InputLabel>
            <Select
              value={selectedInterviewBookingId}
              label="Booking"
              onChange={(event) => handleInterviewBookingChange(event.target.value)}
            >
              {userBookings
                .filter((booking) => booking.interview)
                .map((booking) => (
                  <MenuItem key={`booking-select-${booking.id}`} value={booking.id}>
                    {new Date(booking.slot_time).toLocaleDateString()} · {booking.status}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <TextField
            label="Overall rating"
            type="number"
            value={interviewFeedbackForm.overall_rating}
            onChange={(event) =>
              setInterviewFeedbackForm((prev) => ({ ...prev, overall_rating: event.target.value }))
            }
            fullWidth
            margin="dense"
          />
          <TextField
            label="Feedback"
            value={interviewFeedbackForm.feedback}
            onChange={(event) =>
              setInterviewFeedbackForm((prev) => ({ ...prev, feedback: event.target.value }))
            }
            fullWidth
            margin="dense"
            multiline
            minRows={2}
          />
          <TextField
            label="Improve areas"
            value={interviewFeedbackForm.improve_areas}
            onChange={(event) =>
              setInterviewFeedbackForm((prev) => ({ ...prev, improve_areas: event.target.value }))
            }
            fullWidth
            margin="dense"
            multiline
            minRows={2}
          />
          <TextField
            label="Skill ratings (JSON)"
            value={interviewFeedbackForm.skill_ratings}
            onChange={(event) =>
              setInterviewFeedbackForm((prev) => ({ ...prev, skill_ratings: event.target.value }))
            }
            fullWidth
            margin="dense"
            multiline
          />
          <TextField
            label="Skill comments"
            value={interviewFeedbackForm.skill_comments}
            onChange={(event) =>
              setInterviewFeedbackForm((prev) => ({ ...prev, skill_comments: event.target.value }))
            }
            fullWidth
            margin="dense"
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInterviewFeedbackDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveInterviewFeedback}>
            Save
          </Button>
        </DialogActions>
    </Dialog>
    <Dialog
      open={addStudentDialogOpen}
      onClose={() => setAddStudentDialogOpen(false)}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Add student</DialogTitle>
      <DialogContent>
        <TextField
          label="Email"
          value={addStudentForm.email}
          onChange={(event) => setAddStudentForm((prev) => ({ ...prev, email: event.target.value }))}
          fullWidth
          margin="dense"
        />
        <TextField
          label="Password"
          type="password"
          value={addStudentForm.password}
          onChange={(event) => setAddStudentForm((prev) => ({ ...prev, password: event.target.value }))}
          fullWidth
          margin="dense"
        />
        <TextField
          label="Name"
          value={addStudentForm.name}
          onChange={(event) => setAddStudentForm((prev) => ({ ...prev, name: event.target.value }))}
          fullWidth
          margin="dense"
        />
        <TextField
          label="Phone"
          value={addStudentForm.phone}
          onChange={(event) => setAddStudentForm((prev) => ({ ...prev, phone: event.target.value }))}
          fullWidth
          margin="dense"
        />
        <TextField
          label="Skills (comma separated)"
          value={addStudentForm.skills}
          onChange={(event) => setAddStudentForm((prev) => ({ ...prev, skills: event.target.value }))}
          fullWidth
          margin="dense"
        />
        <TextField
          label="Experience (years)"
          type="number"
          value={addStudentForm.experience}
          onChange={(event) => setAddStudentForm((prev) => ({ ...prev, experience: event.target.value }))}
          fullWidth
          margin="dense"
        />
        <TextField
          label="Location"
          value={addStudentForm.location}
          onChange={(event) => setAddStudentForm((prev) => ({ ...prev, location: event.target.value }))}
          fullWidth
          margin="dense"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setAddStudentDialogOpen(false)}>Cancel</Button>
        <Button variant="contained" onClick={handleCreateStudent}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
    <Dialog
      open={addInterviewerDialogOpen}
      onClose={() => setAddInterviewerDialogOpen(false)}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Add interviewer</DialogTitle>
      <DialogContent>
        <TextField
          label="Email"
          value={addInterviewerForm.email}
          onChange={(event) => setAddInterviewerForm((prev) => ({ ...prev, email: event.target.value }))}
          fullWidth
          margin="dense"
        />
        <TextField
          label="Password"
          type="password"
          value={addInterviewerForm.password}
          onChange={(event) => setAddInterviewerForm((prev) => ({ ...prev, password: event.target.value }))}
          fullWidth
          margin="dense"
        />
        <TextField
          label="Name"
          value={addInterviewerForm.name}
          onChange={(event) => setAddInterviewerForm((prev) => ({ ...prev, name: event.target.value }))}
          fullWidth
          margin="dense"
        />
        <TextField
          label="Phone"
          value={addInterviewerForm.phone}
          onChange={(event) => setAddInterviewerForm((prev) => ({ ...prev, phone: event.target.value }))}
          fullWidth
          margin="dense"
        />
        <FormControl margin="dense" fullWidth>
          <InputLabel>Company</InputLabel>
          <Select
            value={addInterviewerForm.company_id}
            label="Company"
            onChange={(event) => setAddInterviewerForm((prev) => ({ ...prev, company_id: event.target.value }))}
          >
            {companies.map((company) => (
              <MenuItem key={`company-select-${company.id}`} value={company.id}>
                {company.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Rate (₹)"
          type="number"
          value={addInterviewerForm.rate}
          onChange={(event) => setAddInterviewerForm((prev) => ({ ...prev, rate: event.target.value }))}
          fullWidth
          margin="dense"
        />
        <TextField
          label="Skill set (comma separated)"
          value={addInterviewerForm.skill_set}
          onChange={(event) => setAddInterviewerForm((prev) => ({ ...prev, skill_set: event.target.value }))}
          fullWidth
          margin="dense"
        />
        <TextField
          label="Availability slots (JSON array)"
          value={addInterviewerForm.availability_slots}
          onChange={(event) =>
            setAddInterviewerForm((prev) => ({ ...prev, availability_slots: event.target.value }))
          }
          fullWidth
          margin="dense"
          multiline
          minRows={3}
        />
        <TextField
          label="Meeting link (Google Meet)"
          value={addInterviewerForm.meeting_link}
          onChange={(event) =>
            setAddInterviewerForm((prev) => ({ ...prev, meeting_link: event.target.value }))
          }
          fullWidth
          margin="dense"
          helperText="Optional shared meeting URL"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setAddInterviewerDialogOpen(false)}>Cancel</Button>
        <Button variant="contained" onClick={handleCreateInterviewer}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
      <Dialog
        open={resumeDialogOpen}
        onClose={handleCloseResumeDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Resume actions</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Resume record</InputLabel>
            <Select
              value={resumeModalState.selectedResumeId}
              label="Resume record"
              onChange={handleResumeSelectionChange}
              disabled={studentDetailLoading && !studentDetail}
            >
              {(studentDetail?.resumes || []).map((resume) => (
                <MenuItem key={`resume-${resume.id}`} value={resume.id}>
                  {new Date(resume.created_at).toLocaleDateString()} · downloads:{' '}
                  {resume.download_count}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary">
            {resumeModalMessage || 'Select a resume to review cost and download.'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Visibility: {resumeModalState.visibleToHr ? 'Visible to HR' : 'Hidden from HR'}
          </Typography>
          {resumeModalState.cost !== null && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Cost: {resumeModalState.cost} points
            </Typography>
          )}
          <Stack spacing={1} mt={2}>
            <Typography variant="subtitle2">Upload new resume</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                component="label"
                variant="contained"
                disabled={resumeModalState.uploading}
              >
                {resumeModalState.uploading ? 'Uploading…' : 'Choose file & upload'}
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx"
                  onChange={handleUploadResume}
                />
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResumeDialog}>Close</Button>
          <Button
            variant="outlined"
            onClick={handleToggleResumeVisibility}
            disabled={!resumeModalState.selectedResumeId || resumeModalState.publishing}
          >
            {resumeModalState.visibleToHr ? 'Hide from HR' : 'Publish to HR'}
          </Button>
          <Button
            variant="contained"
            onClick={handleDownloadResume}
            disabled={!resumeModalState.selectedResumeId || resumeModalState.downloading}
          >
            {resumeModalState.downloading ? 'Downloading…' : 'Download resume'}
          </Button>
        </DialogActions>
      </Dialog>
    <Dialog
      open={detailsDialogOpen}
      onClose={handleCloseDetailsDialog}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {detailsContext?.type === 'student' ? 'Student details' : 'Interviewer details'}
      </DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" gutterBottom>
          {detailsContext?.data?.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Email: {detailsContext?.data?.email}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Status: {detailsContext?.data?.profile_status || '—'}
        </Typography>
        {detailsContext?.type === 'student' ? (
          <>
            <Typography variant="body2" color="text.secondary">
              Location: {studentDetail?.location || detailsContext.data.location || '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Skills: {(detailsContext.data.skills || []).join(', ') || '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Experience: {detailsContext.data.experience_years || '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Activation reason: {detailsContext.data.activation_reason || '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Deactivation reason: {detailsContext.data.deactivation_reason || '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Resume files: {studentDetail?.resumes?.length || 0}
            </Typography>
            {studentDetail?.courses?.length ? (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Course registrations
                </Typography>
                <Stack spacing={1}>
                  {studentDetail.courses.map((entry) => (
                    <Box
                      key={`course-${entry.id}`}
                      sx={{
                        p: 1,
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 2
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" fontWeight="bold">
                          {entry.course?.name || 'Unnamed course'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {entry.status}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {entry.course?.level || '—'} · {entry.course?.description || 'No description'}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </>
            ) : null}
            {studentDetail?.internships?.length ? (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Internship registrations
                </Typography>
                <Stack spacing={1}>
                  {studentDetail.internships.map((entry) => (
                    <Box
                      key={`internship-${entry.id}`}
                      sx={{
                        p: 1,
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 2
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" fontWeight="bold">
                          {entry.internship?.title || 'Unnamed internship'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {entry.status}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {entry.internship?.company || 'Company N/A'} · {entry.internship?.location || 'Location N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Desired skills: {(entry.desired_skills || []).join(', ') || '—'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Duration: {entry.duration_months || entry.internship?.duration_months || '—'} months
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </>
            ) : null}
            {studentAnalytics?.skill_badges?.length ? (
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {studentAnalytics.skill_badges.map((badge) => (
                  <Chip
                    key={`badge-${badge.skill}`}
                    label={`${badge.skill} · ${badge.rating}`}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Stack>
            ) : null}
            {studentAnalytics ? (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Analytics
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <Typography variant="body2" color="text.secondary">
                    Downloads: {studentAnalytics.resume_downloads}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Points spent: {studentAnalytics.resume_points_spent}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg. rating: {studentAnalytics.avg_rating ? studentAnalytics.avg_rating.toFixed(1) : '—'}
                  </Typography>
                </Stack>
                {studentAnalytics.last_download && (
                  <Typography variant="body2" color="text.secondary">
                    Last download: {studentAnalytics.last_download.by?.name || '—'} on{' '}
                    {new Date(studentAnalytics.last_download.downloaded_at).toLocaleString()} ({studentAnalytics.last_download.points
                      ? `${studentAnalytics.last_download.points} pts`
                      : '0 pts'})
                  </Typography>
                )}
                {studentAnalytics.download_history?.length ? (
                  <Table size="small" sx={{ mt: 1 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>HR</TableCell>
                        <TableCell>Points</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {studentAnalytics.download_history.map((download) => (
                        <TableRow key={`analytics-${download.id}`}>
                          <TableCell>{download.by?.name || download.by?.email || '—'}</TableCell>
                          <TableCell>{download.points}</TableCell>
                          <TableCell>{new Date(download.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No downloads yet.
                  </Typography>
                )}
              </>
            ) : null}
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary">
              Company: {detailsContext?.data?.company || '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Rate: ₹{detailsContext?.data?.rate ?? '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Availability:{' '}
              {(Array.isArray(detailsContext?.data?.availability_slots)
                ? JSON.stringify(detailsContext.data.availability_slots)
                : '—')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Meeting link: {detailsContext?.data?.meeting_link || '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Activation reason: {detailsContext?.data?.activation_reason || '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Deactivation reason: {detailsContext?.data?.deactivation_reason || '—'}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Feedback received
            </Typography>
            {interviewerFeedbackList.length ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Feedback</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {interviewerFeedbackList.map((entry) => (
                    <TableRow key={`feedback-${entry.id}`}>
                      <TableCell>{entry.Student?.User?.name || '—'}</TableCell>
                      <TableCell>{new Date(entry.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{entry.overall_rating ?? '—'}</TableCell>
                      <TableCell>{entry.feedback || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No feedback yet.
              </Typography>
            )}
          </>
        )}
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" gutterBottom>
          Recent bookings
        </Typography>
        {userBookings.length ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Rating</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userBookings.slice(0, 5).map((booking) => (
                <TableRow key={`detail-booking-${booking.id}`}>
                  <TableCell>{new Date(booking.slot_time).toLocaleString()}</TableCell>
                  <TableCell>{booking.status}</TableCell>
                  <TableCell>₹{booking.amount ?? 0}</TableCell>
                  <TableCell>{booking.interview?.overall_rating?.toFixed?.(1) ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No bookings captured yet.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDetailsDialog}>Close</Button>
      </DialogActions>
    </Dialog>
      <Dialog
        open={interviewerProfileDialogOpen}
        onClose={() => setInterviewerProfileDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit interviewer profile</DialogTitle>
        <DialogContent>
          <TextField
            label="Rate (₹)"
            type="number"
            value={interviewerProfileForm.rate}
            onChange={(event) =>
              setInterviewerProfileForm((prev) => ({ ...prev, rate: event.target.value }))
            }
            fullWidth
            margin="dense"
          />
          <TextField
            label="Skill set (comma separated)"
            value={interviewerProfileForm.skill_set}
            onChange={(event) =>
              setInterviewerProfileForm((prev) => ({ ...prev, skill_set: event.target.value }))
            }
            fullWidth
            margin="dense"
          />
          <TextField
            label="Availability slots (JSON)"
            value={interviewerProfileForm.availability_slots}
            onChange={(event) =>
              setInterviewerProfileForm((prev) => ({ ...prev, availability_slots: event.target.value }))
            }
            fullWidth
            margin="dense"
            multiline
            minRows={3}
            helperText='Provide availability as a JSON array (e.g., [{"day":"Mon","slots":["10:00","14:00"]}])'
          />
          <TextField
            label="Meeting link (Google Meet)"
            value={interviewerProfileForm.meeting_link}
            onChange={(event) =>
              setInterviewerProfileForm((prev) => ({ ...prev, meeting_link: event.target.value }))
            }
            fullWidth
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInterviewerProfileDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveInterviewerProfile}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default UserManager;
