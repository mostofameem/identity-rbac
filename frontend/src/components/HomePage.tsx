import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { Event } from '../types/events';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState<{ [key: number]: boolean }>({});
  const [modeFilter, setModeFilter] = useState<'ALL' | 'ONGOING' | 'UPCOMING' | 'RECENT'>('ONGOING');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showGuestModal, setShowGuestModal] = useState<number | null>(null);
  const [guestCount, setGuestCount] = useState(0);
  
  const { user, logout } = useAuth();
  const itemsPerPage = 12;

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filter changes
    fetchEvents(1);
  }, [modeFilter]);

  const fetchEvents = async (page: number = currentPage) => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.getEvents({ 
        mode: modeFilter,
        page: page,
        limit: itemsPerPage,
        sortBy: 'startAt',
        sortOrder: 'ASC'
      });
      
      setEvents(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPage || 1);
      setCurrentPage(page);
    } catch (err: any) {
      console.error('Failed to fetch events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchEvents(page);
    }
  };

  const handleRegisterClick = (eventId: number) => {
    setShowGuestModal(eventId);
    setGuestCount(0);
  };

  const handleRegister = async () => {
    if (showGuestModal === null) return;

    try {
      setRegistering(prev => ({ ...prev, [showGuestModal]: true }));
      
      await apiClient.registerForEvent(showGuestModal, {
        action: 'REGISTER',
        guestCount: guestCount
      });
      
      // Update the event's registration status
      setEvents(prev => prev.map(event => 
        event.id === showGuestModal 
          ? { ...event, status: 'REGISTERED', guestCount: guestCount }
          : event
      ));
      
      // Show success message
      const event = events.find(e => e.id === showGuestModal);
      alert(`✅ Successfully registered for "${event?.title}"${guestCount > 0 ? ` with ${guestCount} guest(s)` : ''}!`);
      
      setShowGuestModal(null);
      setGuestCount(0);
    } catch (err: any) {
      console.error('Registration failed:', err);
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      alert(`❌ ${errorMessage}`);
    } finally {
      setRegistering(prev => ({ ...prev, [showGuestModal!]: false }));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeLeft = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diffMs = end.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Registration closed';
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const getParticipationTimeLeft = (event: Event) => {
    const now = new Date();
    const eventStart = new Date(event.startAt);
    const eventEnd = event.endAt ? new Date(event.endAt) : null;
    
    // If event hasn't started yet, show time until start
    if (now < eventStart) {
      const diffMs = eventStart.getTime() - now.getTime();
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) return `Starts in ${days}d ${hours}h`;
      if (hours > 0) return `Starts in ${hours}h ${minutes}m`;
      return `Starts in ${minutes}m`;
    }
    
    // If event has started and we have end time, show time left to participate
    if (eventEnd && now < eventEnd) {
      const diffMs = eventEnd.getTime() - now.getTime();
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) return `${days}d ${hours}h left to participate`;
      if (hours > 0) return `${hours}h ${minutes}m left to participate`;
      return `${minutes}m left to participate`;
    }
    
    return 'Event ongoing';
  };

  const isRegistrationOpen = (event: Event) => {
    const now = new Date();
    const registrationOpens = new Date(event.registrationOpensAt);
    const registrationCloses = new Date(event.registrationClosesAt);
    
    return now >= registrationOpens && now <= registrationCloses;
  };

  const isEventFinished = (event: Event) => {
    const now = new Date();
    const eventEnd = new Date(event.startAt);
    return now > eventEnd;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REGISTERED':
        return <span className="status-badge status-registered">✓ Registered</span>;
      case 'CANCELED':
        return <span className="status-badge status-canceled">✗ Canceled</span>;
      case 'NOT_REGISTERED':
        return <span className="status-badge status-not-registered">⏳ Not Registered</span>;
      default:
        return <span className="status-badge status-unknown">❓ Unknown</span>;
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'daily':
        return '🍽️';
      case 'weekly':
        return '📅';
      case 'monthly':
        return '🗓️';
      case 'special':
        return '🎉';
      default:
        return '📋';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading events...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🎯</span>
            <span>Event Manager</span>
          </div>
          <div className="user-section">
            <div className="user-info">
              <span className="user-avatar">👤</span>
              <span className="user-email">{user?.email}</span>
            </div>
            <Link 
              to="/admin" 
              className="btn btn-admin"
            >
              ⚙️ Admin
            </Link>
            <button 
              onClick={logout} 
              className="btn btn-logout"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      <div className="main-content">
        <div className="container">
          <div className="page-header">
            <div className="page-title-section">
              <h1 className="page-title">
                <span className="title-icon">🎪</span>
                Events Dashboard
              </h1>
              <div className="filter-inline">
                <select
                  value={modeFilter}
                  onChange={(e) => setModeFilter(e.target.value as any)}
                  className="filter-select-inline"
                >
                  <option value="ALL">All Events</option>
                  <option value="ONGOING">🔥 Ongoing</option>
                  <option value="UPCOMING">⏰ Upcoming</option>
                  <option value="RECENT">📅 Recent</option>
                </select>
              </div>
            </div>
            <p className="page-subtitle">Discover and register for upcoming events</p>
            
            {/* Event Stats */}
            <div className="event-stats">
              <div className="stat-card">
                <span className="stat-number">{events.length}</span>
                <span className="stat-label">Events Found</span>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              <span>{error}</span>
              <button 
                onClick={() => fetchEvents(currentPage)} 
                className="btn btn-retry"
              >
                🔄 Retry
              </button>
            </div>
          )}

          {events.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎭</div>
              <h3>No events found</h3>
              <p>No {modeFilter.toLowerCase()} events available.</p>
              <button onClick={() => setModeFilter('ALL')} className="btn btn-primary">
                🔄 Show All Events
              </button>
            </div>
          ) : (
            <>
              <div className="events-grid">
                {events.map((event) => (
                  <div key={event.id} className="event-card">
                    <div className="event-header">
                      <div className="event-type">
                        <span className="event-type-icon">{getEventTypeIcon(event.eventType)}</span>
                        <span className="event-type-text">{event.eventType}</span>
                      </div>
                      {getStatusBadge(event.status)}
                    </div>

                    <h3 className="event-title">{event.title}</h3>
                    {event.description && (
                      <p className="event-description">{event.description}</p>
                    )}
                    
                    <div className="event-details">
                      <div className="event-detail-item">
                        <span className="detail-icon">🚀</span>
                        <span className="detail-label">Starts:</span>
                        <span className="detail-value">{formatDate(event.startAt)}</span>
                      </div>

                      {event.guestCount > 0 && (
                        <div className="event-detail-item">
                          <span className="detail-icon">👥</span>
                          <span className="detail-label">Guests:</span>
                          <span className="detail-value">{event.guestCount}</span>
                        </div>
                      )}
                    </div>

                    {/* Registration Time Left - For events with open registration */}
                    {isRegistrationOpen(event) && !isEventFinished(event) && (
                      <div className="registration-timer">
                        <div className="timer-icon">⏰</div>
                        <div className="timer-content">
                          <span className="timer-label">Registration ends in</span>
                          <span className="timer-value">{getTimeLeft(event.registrationClosesAt)}</span>
                        </div>
                      </div>
                    )}

                    {/* Registration Time Finished - For finished events */}
                    {isEventFinished(event) && (
                      <div className="registration-finished">
                        <div className="finished-icon">🏁</div>
                        <div className="finished-content">
                          <span className="finished-label">Registration time finished</span>
                        </div>
                      </div>
                    )}

                    <div className="event-actions">
                      {event.status === 'REGISTERED' ? (
                        <div className="registered-message">
                          <span className="success-icon">🎉</span>
                          <span>You're all set for this event!</span>
                        </div>
                      ) : event.status === 'CANCELED' ? (
                        <div className="canceled-message">
                          <span className="canceled-icon">🚫</span>
                          <span>Registration was canceled</span>
                        </div>
                      ) : (
                        <div>
                          {isEventFinished(event) ? (
                            <div className="registration-closed">
                              <span className="closed-icon">🏁</span>
                              <span>Registration time finished</span>
                            </div>
                          ) : isRegistrationOpen(event) ? (
                            <button
                              onClick={() => handleRegisterClick(event.id)}
                              disabled={registering[event.id]}
                              className="btn btn-register"
                            >
                              {registering[event.id] ? (
                                <>
                                  <span className="loading-spinner-small"></span>
                                  Registering...
                                </>
                              ) : (
                                <>
                                  <span>🎫</span>
                                  Register Now
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="registration-closed">
                              <span className="closed-icon">🔒</span>
                              <span>Registration is not open</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pagination at Bottom */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn btn-pagination"
            >
              ← Previous
            </button>
            
            <div className="pagination-numbers">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber: number;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage > totalPages - 3) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`btn btn-pagination-number ${
                      currentPage === pageNumber ? 'active' : ''
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn btn-pagination"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Guest Count Modal */}
      {showGuestModal && (
        <div className="modal-overlay" onClick={() => setShowGuestModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Register for Event</h3>
              <button
                onClick={() => setShowGuestModal(null)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <p>How many guests would you like to register?</p>
              
              <div className="guest-count-section">
                <label htmlFor="guest-count">Number of Guests:</label>
                <div className="guest-count-controls">
                  <button
                    onClick={() => setGuestCount(Math.max(0, guestCount - 1))}
                    className="btn btn-count"
                    disabled={guestCount === 0}
                  >
                    −
                  </button>
                  <input
                    id="guest-count"
                    type="number"
                    min="0"
                    max="10"
                    value={guestCount}
                    onChange={(e) => setGuestCount(Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))}
                    className="guest-count-input"
                  />
                  <button
                    onClick={() => setGuestCount(Math.min(10, guestCount + 1))}
                    className="btn btn-count"
                    disabled={guestCount === 10}
                  >
                    +
                  </button>
                </div>
                <small className="guest-count-note">
                  {guestCount === 0 ? 'Just yourself' : `You + ${guestCount} guest${guestCount > 1 ? 's' : ''}`}
                </small>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={() => setShowGuestModal(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleRegister}
                disabled={registering[showGuestModal]}
                className="btn btn-primary"
              >
                {registering[showGuestModal] ? (
                  <>
                    <span className="loading-spinner-small"></span>
                    Registering...
                  </>
                ) : (
                  <>
                    🎫 Confirm Registration
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage; 