'use strict';

const { Op } = require('sequelize');
const {
  sequelize,
  Booking,
  Interview,
  Interviewer,
  Student,
  HrUser,
  HrTransaction,
  User,
  Resume,
  Company,
  Course,
  StudentCourse,
  Internship,
  StudentInternship
} = require('../models');

const DEFAULT_RANGE_START = new Date(0);

const normalizeDateRange = (start, end) => {
  const from = start ? new Date(start) : DEFAULT_RANGE_START;
  const to = end ? new Date(end) : new Date();
  to.setHours(23, 59, 59, 999);
  return { from, to };
};

const buildFilters = ({ startDate, endDate }) => {
  const { from, to } = normalizeDateRange(startDate, endDate);
  return { [Op.between]: [from, to] };
};

const buildInterviewerMetrics = async ({ startDate, endDate }) => {
  const slotFilter = buildFilters({ startDate, endDate });
  const interviews = await Interview.findAll({
    where: { created_at: slotFilter },
    include: [{
      model: Booking,
      include: [
        {
          model: Interviewer,
          include: [
            { model: User, attributes: ['id', 'name', 'email'] },
            { model: Company, attributes: ['id', 'name'] }
          ]
        }
      ]
    }]
  });
  const ratings = {};
  interviews.forEach((interview) => {
    const interviewer = interview.Booking?.Interviewer;
    if (interview.Booking?.status !== 'completed') return;
    if (!interviewer) return;
    const entry = ratings[interviewer.id] || { interviewer, sum: 0, count: 0 };
    entry.sum += interview.overall_rating || 0;
    entry.count += 1;
    ratings[interviewer.id] = entry;
  });
  const ratingList = Object.values(ratings).map((entry) => ({
    interviewer: {
      id: entry.interviewer.id,
      name: entry.interviewer.User?.name || 'Interviewer',
      company: entry.interviewer.Company?.name,
      title: entry.interviewer.title,
      email: entry.interviewer.User?.email
    },
    avgRating: entry.count ? entry.sum / entry.count : 0,
    reviewCount: entry.count,
    totalInterviews: entry.count
  }));
  const slotBookings = await Booking.findAll({
    where: {
      slot_time: slotFilter
    },
    include: [
      {
        model: Interviewer,
        include: [
          { model: User, attributes: ['id', 'name'] },
          { model: Company, attributes: ['id', 'name'] }
        ]
      }
    ]
  });
  const upcoming = slotBookings.filter(
    (b) =>
      ['pending', 'paid', 'confirmed', 'postponed'].includes(b.status)
  );
  const completed = slotBookings.filter((b) => b.status === 'completed');
  const revenue = slotBookings.reduce((sum, booking) => sum + (booking.amount || 0), 0);
  const skillCount = {};
  slotBookings.forEach((booking) => {
    (booking.Interviewer?.skill_set || []).forEach((skill) => {
      skillCount[skill] = (skillCount[skill] || 0) + 1;
    });
  });

  const summary = {
    totalBookings: slotBookings.length,
    upcoming: upcoming.length,
    completed: completed.length,
    revenue,
    avgRating: ratingList.length ? ratingList.reduce((sum, entry) => sum + entry.avgRating, 0) / ratingList.length : 0
  };

  const topInterviewers = [...ratingList]
    .sort((a, b) => {
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
      return b.reviewCount - a.reviewCount;
    })
    .slice(0, 10);
  const bottomInterviewers = [...ratingList]
    .sort((a, b) => a.avgRating - b.avgRating)
    .slice(0, 10);

  return {
    role: 'interviewer',
    summary,
    topInterviewers,
    bottomInterviewers,
    skillCount,
    bookings: slotBookings.map((booking) => ({
      id: booking.id,
      interviewer: booking.Interviewer?.User?.name,
      company: booking.Interviewer?.Company?.name,
      slot_time: booking.slot_time,
      status: booking.status,
      amount: booking.amount
    }))
  };
};

const buildStudentMetrics = async ({ startDate, endDate }) => {
  const slotFilter = buildFilters({ startDate, endDate });
  const bookings = await Booking.findAll({
    where: {
      slot_time: slotFilter
    },
    include: [
      {
        model: Student,
        include: [{ model: User, attributes: ['id', 'name', 'email'] }]
      }
    ]
  });
  const interviews = await Interview.findAll({
    where: {
      created_at: slotFilter
    },
    include: [
      {
        model: Booking,
        include: [
          {
            model: Student,
            include: [{ model: User, attributes: ['id', 'name', 'email'] }]
          }
        ]
      }
    ]
  });
  const studentMap = {};
  bookings.forEach((booking) => {
    const student = booking.Student;
    if (!student) return;
    const entry = studentMap[student.id] || { student, bookings: [] };
    entry.bookings.push(booking);
    studentMap[student.id] = entry;
  });
  const ratings = {};
  interviews.forEach((interview) => {
    const student = interview.Booking?.Student;
    if (!student) return;
    const entry = ratings[student.id] || { sum: 0, count: 0 };
    entry.sum += interview.overall_rating || 0;
    entry.count += 1;
    ratings[student.id] = entry;
  });
  const avgRating =
    Object.values(ratings).length
      ? Object.values(ratings).reduce((sum, entry) => sum + entry.sum / (entry.count || 1), 0) /
        Object.values(ratings).length
      : 0;
  const revenue = bookings.reduce((sum, booking) => sum + (booking.amount || 0), 0);
  const completedBookings = bookings.filter((b) => b.status === 'completed').length;
  const repeaters = Object.values(studentMap).filter((entry) => entry.bookings.length > 1);
  const totalStudents = Object.keys(studentMap).length;
  return {
    role: 'student',
    summary: {
      totalBookings: bookings.length,
      uniqueStudents: totalStudents,
      repeatBookings: repeaters.length,
      paidBookings: bookings.filter((b) => b.status === 'paid' || b.status === 'completed').length,
      completedBookings,
      revenue,
      avgRating
    },
    repeaters: repeaters.map((entry) => ({
      student: entry.student.User?.name,
      email: entry.student.User?.email,
      bookings: entry.bookings.length
    })),
    students: Object.values(studentMap).map((entry) => ({
      id: entry.student.id,
      name: entry.student.User?.name,
      email: entry.student.User?.email,
      bookings: entry.bookings.length,
      lastBooking: entry.bookings.slice(-1)[0]?.slot_time
    }))
  };
};

const buildHrMetrics = async ({ startDate, endDate }) => {
  const timeFilter = buildFilters({ startDate, endDate });
  const hrs = await HrUser.findAll({
    include: [
      { model: User, attributes: ['id', 'name', 'email'] },
      {
        model: HrTransaction,
        as: 'Transactions',
        where: {
          created_at: timeFilter
        },
        required: false,
        include: [{
          model: Resume,
          as: 'resume',
          include: [{
            model: Student,
            as: 'Student',
            include: [{ model: User, attributes: ['id', 'name', 'email'] }]
          }]
        }]
      }
    ]
  });
  const summary = {
    totalConsultancies: hrs.length,
    totalDownloads: hrs.reduce((sum, hrUser) => {
      const downloads = (hrUser.Transactions || []).filter((tx) => tx.type === 'download');
      return sum + downloads.length;
    }, 0),
    creditsSpent: hrs.reduce((sum, hrUser) => {
      const downloads = (hrUser.Transactions || []).filter((tx) => tx.type === 'download');
      return sum + downloads.reduce((inner, tx) => inner + Math.abs(tx.credits_change || 0), 0);
    }, 0),
    creditsAdded: hrs.reduce((sum, hrUser) => {
      const adds = (hrUser.Transactions || []).filter((tx) => tx.type === 'credit_add');
      return sum + adds.reduce((inner, tx) => inner + (tx.credits_change || 0), 0);
    }, 0)
  };
  return {
    role: 'hr',
    summary,
    consultancies: hrs.map((hr) => {
      const transactions = hr.Transactions || [];
      const downloads = transactions.filter((tx) => tx.type === 'download');
      const adds = transactions.filter((tx) => tx.type === 'credit_add');
      const uniqueResumes = new Set(downloads.map((tx) => tx.resume_id).filter(Boolean));
      const creditsSpent = downloads.reduce((sum, tx) => sum + Math.abs(tx.credits_change || 0), 0);
      const creditsAdded = adds.reduce((sum, tx) => sum + (tx.credits_change || 0), 0);
      return {
        id: hr.id,
        name: hr.User?.name,
        email: hr.User?.email,
        credits: hr.subscription_points,
        downloads: downloads.length,
        uniqueResumes: uniqueResumes.size,
        creditsSpent,
        creditsAdded,
        transactions: transactions.map((tx) => ({
          id: tx.id,
          type: tx.type,
          credits: tx.credits_change,
          description: tx.description,
          resume: tx.resume
            ? {
                id: tx.resume.id,
                student: tx.resume.Student?.User?.name,
                student_id: tx.resume.student_id
              }
            : null,
          created_at: tx.created_at
        }))
      };
    })
  };
};

const buildCourseAnalytics = async ({ startDate, endDate } = {}) => {
  const timeFilter = buildFilters({ startDate, endDate });
  const courses = await Course.findAll({
    include: [
      {
        model: StudentCourse,
        as: 'StudentCourses',
        where: {
          created_at: timeFilter
        },
        required: false,
        include: [
          {
            model: Student,
            include: [{ model: User, attributes: ['id', 'name', 'email'] }]
          }
        ]
      }
    ],
    order: [['name', 'ASC']]
  });
  const payload = courses.map((course) => ({
    id: course.id,
    name: course.name,
    level: course.level,
    duration_weeks: course.duration_weeks,
    description: course.description,
    registrations: course.StudentCourses?.length || 0,
    students: (course.StudentCourses || []).map((registration) => ({
      id: registration.Student?.id,
      name: registration.Student?.User?.name,
      email: registration.Student?.User?.email,
      status: registration.status,
      enrolled_at: registration.created_at
    }))
  }));
  return {
    totalRegistrations: payload.reduce((sum, course) => sum + course.registrations, 0),
    total: payload.length,
    courses: payload
  };
};

const buildInternshipAnalytics = async ({ startDate, endDate } = {}) => {
  const timeFilter = buildFilters({ startDate, endDate });
  const internships = await Internship.findAll({
    include: [
      {
        model: Company,
        as: 'Company',
        attributes: ['id', 'name']
      },
      {
        model: StudentInternship,
        as: 'Registrations',
        where: {
          created_at: timeFilter
        },
        required: false,
        include: [
          {
            model: Student,
            as: 'Student',
            include: [{ model: User, attributes: ['id', 'name', 'email'] }]
          }
        ]
      }
    ],
    order: [['created_at', 'DESC']]
  });
  const payload = internships.map((internship) => ({
    id: internship.id,
    title: internship.title,
    company: internship.Company?.name,
    duration_months: internship.duration_months,
    skills: internship.skills,
    registrations: internship.Registrations?.length || 0,
    students: (internship.Registrations || []).map((registration) => ({
      id: registration.Student?.id,
      name: registration.Student?.User?.name,
      email: registration.Student?.User?.email,
      status: registration.status,
      desired_skills: registration.desired_skills,
      purpose: registration.purpose,
      duration_months: registration.duration_months,
      start_date: registration.start_date,
      submitted_at: registration.created_at
    }))
  }));
  return {
    totalRegistrations: payload.reduce((sum, internship) => sum + internship.registrations, 0),
    registered: payload.reduce((sum, internship) => sum + internship.registrations, 0),
    internships: payload
  };
};

const getConsultancyAnalyticsData = async (filters = {}) => {
  const analytics = await buildHrMetrics(filters);
  return analytics;
};

const getRoleAnalyticsData = async (role, filters) => {
  if (role === 'student') return buildStudentMetrics(filters);
  if (role === 'hr') return buildHrMetrics(filters);
  return buildInterviewerMetrics(filters);
};

const buildAdminOverview = async ({ startDate, endDate } = {}) => {
  const timeFilter = buildFilters({ startDate, endDate });
  const [bookings, totalStudents, totalInterviewers, uniqueCompanies] = await Promise.all([
    Booking.findAll({ where: { slot_time: timeFilter } }),
    Student.count(),
    Interviewer.count(),
    Company.count()
  ]);

  const revenue = bookings.reduce((sum, booking) => sum + (booking.amount || 0), 0);
  const scheduledStatuses = ['pending', 'paid', 'confirmed', 'postponed'];
  const interviewsScheduled = bookings.filter((b) => scheduledStatuses.includes(b.status)).length;
  const interviewsCompleted = bookings.filter((b) => b.status === 'completed').length;
  const interviewsPending = bookings.filter((b) => b.status === 'pending').length;
  const interviewsConfirmed = bookings.filter((b) => b.status === 'confirmed').length;
  const interviewsPostponed = bookings.filter((b) => b.status === 'postponed').length;

  const hrTransactions = await HrTransaction.findAll({
    where: {
      type: 'download',
      created_at: timeFilter
    },
    include: [
      {
        model: HrUser,
        as: 'hrUser',
        include: [{ model: User, attributes: ['name'] }]
      },
      {
        model: Resume,
        as: 'resume',
        include: [
          {
            model: Student,
            as: 'Student',
            include: [{ model: User, attributes: ['name'] }]
          }
        ]
      }
    ],
    order: [['created_at', 'ASC']]
  });

  const hrConsultancies = {};
  const trendMap = {};
  const skillMap = {};
  hrTransactions.forEach((tx) => {
    const consultancyName = tx.HrUser?.User?.name || `Consultancy ${tx.hr_user_id}`;
    const consultancy = hrConsultancies[consultancyName] || { name: consultancyName, downloads: 0, creditsSpent: 0 };
    consultancy.downloads += 1;
    consultancy.creditsSpent += Math.abs(tx.credits_change || 0);
    hrConsultancies[consultancyName] = consultancy;

    if (tx.created_at) {
      const createdAt = tx.created_at instanceof Date ? tx.created_at : new Date(tx.created_at);
      if (!Number.isNaN(createdAt.getTime())) {
        const dateKey = createdAt.toISOString().split('T')[0];
        trendMap[dateKey] = (trendMap[dateKey] || 0) + 1;
      }
    }

    const student = tx.resume?.Student;
    const skills = student?.skills || [];
    const skillKey = skills[0] || 'Other';
    skillMap[skillKey] = (skillMap[skillKey] || 0) + 1;
  });

  return {
    revenue,
    interviewsScheduled,
    interviewsCompleted,
    interviewsPending,
    interviewsConfirmed,
    interviewsPostponed,
    totalStudents,
    totalInterviewers,
    uniqueCompanies,
    totalDownloads: hrTransactions.length,
    hrDownloadsByConsultancy: Object.values(hrConsultancies).map((consultancy) => ({
      ...consultancy,
      downloads: consultancy.downloads,
      creditsSpent: consultancy.creditsSpent
    })),
    hrDownloadTrend: Object.entries(trendMap)
      .map(([date, downloads]) => ({ date, downloads }))
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
    hrSkillBreakdown: Object.entries(skillMap).map(([skill, downloads]) => ({ skill, downloads }))
  };
};

const buildRoleTrendData = async ({ role = 'interviewer', startDate, endDate } = {}) => {
  const { from, to } = normalizeDateRange(startDate, endDate);
  if (role === 'hr') {
    const downloads = await HrTransaction.findAll({
      where: {
        type: 'download',
        created_at: { [Op.between]: [from, to] }
      },
      attributes: [
        [sequelize.fn('date_trunc', 'day', sequelize.col('created_at')), 'day'],
        [sequelize.fn('count', '*'), 'count']
      ],
      group: ['day'],
      order: [['day', 'ASC']]
    });
    return (downloads || [])
      .map((row) => {
        const dayValue = row.get('day');
        if (!dayValue) return null;
        const dayDate = dayValue instanceof Date ? dayValue : new Date(dayValue);
        if (Number.isNaN(dayDate.getTime())) return null;
        return {
          date: dayDate.toISOString().split('T')[0],
          count: Number(row.get('count'))
        };
      })
      .filter(Boolean);
  }
  const bookings = await Booking.findAll({
    where: {
      slot_time: { [Op.between]: [from, to] }
    },
    attributes: [
      [sequelize.fn('date_trunc', 'day', sequelize.col('slot_time')), 'day'],
      [sequelize.fn('count', '*'), 'count']
    ],
    group: ['day'],
    order: [['day', 'ASC']]
  });
  return (bookings || [])
    .map((row) => {
      const dayValue = row.get('day');
      if (!dayValue) return null;
      const dayDate = dayValue instanceof Date ? dayValue : new Date(dayValue);
      if (Number.isNaN(dayDate.getTime())) return null;
      return {
        date: dayDate.toISOString().split('T')[0],
        count: Number(row.get('count'))
      };
    })
    .filter(Boolean);
};

const buildCourseAnalyticsCsv = (analytics) => {
  const headers = ['Course', 'Level', 'Duration (weeks)', 'Registrations'];
  const rows = (analytics.courses || []).map((course) =>
    [
      course.name,
      course.level || '',
      course.duration_weeks || '',
      course.registrations
    ]
      .map(quote)
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
};

const buildInternshipAnalyticsCsv = (analytics) => {
  const headers = ['Internship', 'Company', 'Duration (months)', 'Registrations'];
  const rows = (analytics.internships || []).map((internship) =>
    [
      internship.title,
      internship.company || '',
      internship.duration_months || '',
      internship.registrations
    ]
      .map(quote)
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
};

const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const buildCsv = (role, data) => {
  const lines = [];
  if (role === 'interviewer') {
    const headers = ['Section', 'Interviewer', 'Company', 'Avg Rating', 'Reviews', 'Revenue'];
    lines.push(headers.join(','));
    data.topInterviewers?.forEach((entry, index) => {
      lines.push(
        [
          `Top-${index + 1}`,
          entry.interviewer.name,
          entry.interviewer.company || '',
          entry.avgRating.toFixed(2),
          entry.reviewCount,
          data.summary.revenue
        ]
          .map(quote)
          .join(',')
      );
    });
    data.bottomInterviewers?.forEach((entry, index) => {
      lines.push(
        [
          `Bottom-${index + 1}`,
          entry.interviewer.name,
          entry.interviewer.company || '',
          entry.avgRating.toFixed(2),
          entry.reviewCount,
          data.summary.revenue
        ]
          .map(quote)
          .join(',')
      );
    });
  } else if (role === 'student') {
    const headers = ['Student', 'Email', 'Bookings', 'Last Booking', 'Repeaters', 'Paid'];
    lines.push(headers.join(','));
    data.students?.forEach((student) => {
      lines.push(
        [
          student.name,
          student.email,
          student.bookings,
          student.lastBooking || '',
          student.bookings > 1 ? 'Yes' : 'No',
          data.summary.paidBookings
        ]
          .map(quote)
          .join(',')
      );
    });
  } else if (role === 'hr') {
    const headers = ['Consultancy', 'Email', 'Credits', 'Downloads', 'Unique Resumes', 'Credits Spent', 'Credits Added'];
    lines.push(headers.join(','));
    data.consultancies?.forEach((consultancy) => {
      lines.push(
        [
          consultancy.name,
          consultancy.email,
          consultancy.credits,
          consultancy.downloads,
          consultancy.uniqueResumes,
          consultancy.creditsSpent,
          consultancy.creditsAdded
        ]
          .map(quote)
          .join(',')
      );
    });
  }
  return lines.join('\n');
};

const buildConsultancyCsv = (data) => {
  const headers = ['Consultancy', 'Email', 'Credits', 'Downloads', 'Unique Resumes', 'Credits Spent', 'Credits Added'];
  const rows = data.consultancies?.map((consultancy) =>
    [
      consultancy.name,
      consultancy.email,
      consultancy.credits,
      consultancy.downloads,
      consultancy.uniqueResumes,
      consultancy.creditsSpent,
      consultancy.creditsAdded
    ]
      .map(quote)
      .join(',')
  ) || [];
  return [headers.join(','), ...rows].join('\n');
};

module.exports = {
  getRoleAnalyticsData,
  buildCsv,
  getConsultancyAnalyticsData,
  buildConsultancyCsv,
  buildHrMetrics,
  buildAdminOverview,
  normalizeDateRange,
  buildCourseAnalytics,
  buildInternshipAnalytics
  ,
  buildRoleTrendData,
  buildCourseAnalyticsCsv,
  buildInternshipAnalyticsCsv
};
