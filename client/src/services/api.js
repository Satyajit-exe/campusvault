const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('cv_token');
  const headers = {
    ...options.headers,
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If not FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Includes HTTP-only cookie cv_token
  });

  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = (data && data.message) || response.statusText || 'An unexpected error occurred';
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  me: () => request('/auth/me', { method: 'GET' }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  // Hierarchy
  getFilterOptions: () => request('/hierarchy/filter-options'),
  getColleges: () => request('/hierarchy/colleges'),
  getAcademicYears: () => request('/hierarchy/academic-years'),

  // Subjects
  getSubjects: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/subjects${qs ? `?${qs}` : ''}`);
  },
  getSubject: (slug) => request(`/subjects/${slug}`),
  getSubjectPyqs: (slug) => request(`/subjects/${slug}/pyqs`),
  getExamMode: (slug) => request(`/subjects/${slug}/exam-mode`),

  // Resources
  getResources: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/resources${qs ? `?${qs}` : ''}`);
  },
  getTrending: () => request('/resources/trending'),
  getResourceById: (id) => request(`/resources/${id}`),
  getResourceStreamUrl: (id) => `/api/resources/${id}/stream`,

  // Search
  search: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/search${qs ? `?${qs}` : ''}`);
  },
  getSuggestions: (q) => request(`/search/suggestions?q=${encodeURIComponent(q || '')}`),

  // Bookmarks
  getBookmarks: () => request('/bookmarks'),
  checkBookmark: (resourceId) => request(`/bookmarks/check/${resourceId}`),
  toggleBookmark: (resourceId, folder) =>
    request(`/bookmarks/${resourceId}`, { method: 'POST', body: JSON.stringify({ folder }) }),

  // Progress
  getProgress: () => request('/progress'),
  getProgressStatus: (resourceId) => request(`/progress/status/${resourceId}`),
  updateProgress: (data) => request('/progress/update', { method: 'POST', body: JSON.stringify(data) }),

  // Requests
  getRequests: () => request('/requests'),
  getMyRequests: () => request('/requests/my'),
  submitRequest: (data) => request('/requests', { method: 'POST', body: JSON.stringify(data) }),
  cancelRequest: (id) => request(`/requests/${id}`, { method: 'DELETE' }),

  // Contributions
  getMyContributions: () => request('/contributions/my'),
  uploadContribution: (formData) => request('/contributions/upload', { method: 'POST', body: formData }),
  updateContribution: (id, data) => request(`/contributions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  cancelContribution: (id) => request(`/contributions/${id}`, { method: 'DELETE' }),

  // Copyright Report
  reportCopyright: (data) => request('/copyright/report', { method: 'POST', body: JSON.stringify(data) }),

  // Admin
  getAdminDashboard: () => request('/admin/dashboard'),
  getPendingContributions: () => request('/admin/contributions/pending'),
  reviewContribution: (id, data) =>
    request(`/admin/contributions/${id}/review`, { method: 'POST', body: JSON.stringify(data) }),
  getAdminResources: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/resources${qs ? `?${qs}` : ''}`);
  },
  updateResourceStatus: (id, status) =>
    request(`/admin/resources/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getAdminReports: () => request('/admin/reports'),
  resolveReport: (id, data) => request(`/admin/reports/${id}/action`, { method: 'POST', body: JSON.stringify(data) }),
  getAdminRequests: () => request('/admin/requests'),
  fulfillRequest: (id, data) => request(`/admin/requests/${id}/fulfill`, { method: 'PUT', body: JSON.stringify(data) }),
  getAdminUsers: () => request('/admin/users'),
  updateUserRole: (id, data) => request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  createSubject: (data) => request('/admin/subjects', { method: 'POST', body: JSON.stringify(data) }),
  deleteSubject: (id) => request(`/admin/subjects/${id}`, { method: 'DELETE' }),
};
