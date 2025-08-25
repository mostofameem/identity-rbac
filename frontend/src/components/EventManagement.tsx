import React, { useState, useEffect } from 'react';
import { adminApiClient } from '../services';
import { Event, EventType, EventFilter, Pagination } from '../types/admin';

interface EventManagementProps {
  showMessage: (message: string, isError?: boolean) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const EventManagement: React.FC<EventManagementProps> = ({ showMessage, loading, setLoading }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    eventTypeId: '',
    eventStartsAt: '',
    registrationOpensAt: '',
    registrationClosesAt: ''
  });
  const [eventFilter, setEventFilter] = useState<EventFilter>({
    title: '',
    typeId: '',
    id: undefined,
    startTime: '',
    endTime: '',
    mode: 'ALL' as 'ALL' | 'ONGOING' | 'UPCOMING' | 'RECENT',
    page: 1,
    limit: 10,
    sortBy: 'id',
    sortOrder: 'DESC' as 'ASC' | 'DESC'
  });
  const [pagination, setPagination] = useState<Pagination>({
    totalItem: 0,
    totalPage: 0,
    currentPage: 1
  });
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  // Event Type Management State
  const [newEventType, setNewEventType] = useState({
    name: '',
    description: '',
    autoEventCreate: false,
    autoEventCreateInterval: 0
  });
  const [eventTypeFilter, setEventTypeFilter] = useState('');

  useEffect(() => {
    fetchEvents();
    fetchEventTypes();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [eventFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await adminApiClient.getEvents(eventFilter);
      const events = response.data.data || [];
      setEvents(events);
      
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to fetch events', true);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventTypes = async () => {
    try {
      const response = await adminApiClient.getEventTypes(eventTypeFilter);
      const eventTypes = response.data.data || [];
      setEventTypes(eventTypes);
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to fetch event types', true);
      setEventTypes([]);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.description || !newEvent.eventTypeId || 
        !newEvent.eventStartsAt || !newEvent.registrationOpensAt || !newEvent.registrationClosesAt) {
      showMessage('Please fill in all fields', true);
      return;
    }

    try {
      setLoading(true);
      
      const formatDateTime = (dateTimeLocal: string): string => {
        if (dateTimeLocal.includes('T') && (dateTimeLocal.includes('Z') || dateTimeLocal.includes('+'))) {
          return dateTimeLocal;
        }
        return new Date(dateTimeLocal).toISOString();
      };

      await adminApiClient.createEvent({
        title: newEvent.title,
        description: newEvent.description,
        eventTypeId: parseInt(newEvent.eventTypeId),
        eventStartsAt: formatDateTime(newEvent.eventStartsAt),
        registrationOpensAt: formatDateTime(newEvent.registrationOpensAt),
        registrationClosesAt: formatDateTime(newEvent.registrationClosesAt)
      });
      showMessage('Event created successfully');
      setNewEvent({
        title: '',
        description: '',
        eventTypeId: '',
        eventStartsAt: '',
        registrationOpensAt: '',
        registrationClosesAt: ''
      });
      fetchEvents();
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to create event', true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEventType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventType.name || !newEventType.description) {
      showMessage('Please fill in all fields', true);
      return;
    }

    try {
      setLoading(true);
      await adminApiClient.createEventType(newEventType);
      showMessage('Event type created successfully');
      setNewEventType({
        name: '',
        description: '',
        autoEventCreate: false,
        autoEventCreateInterval: 0
      });
      fetchEventTypes();
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to create event type', true);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = async (eventId: number) => {
    try {
      setLoading(true);
      const response = await adminApiClient.getEventDetails(eventId);
      setSelectedEvent(response.data);
      setShowEventModal(true);
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Failed to fetch event details', true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Event Management</h2>
        <p className="text-blue-100">Create and manage events and event types</p>
      </div>

      {/* Add Event Form */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title text-primary">Add New Event</h3>
          <form onSubmit={handleAddEvent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Title</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Enter event title"
                  required
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Event Type</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={newEvent.eventTypeId}
                  onChange={(e) => setNewEvent({ ...newEvent, eventTypeId: e.target.value })}
                  required
                >
                  <option value="">Select event type</option>
                  {eventTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Description</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Enter event description"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Event Starts At</span>
                </label>
                <input
                  type="datetime-local"
                  className="input input-bordered w-full"
                  value={newEvent.eventStartsAt}
                  onChange={(e) => setNewEvent({ ...newEvent, eventStartsAt: e.target.value })}
                  required
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Registration Opens</span>
                </label>
                <input
                  type="datetime-local"
                  className="input input-bordered w-full"
                  value={newEvent.registrationOpensAt}
                  onChange={(e) => setNewEvent({ ...newEvent, registrationOpensAt: e.target.value })}
                  required
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Registration Closes</span>
                </label>
                <input
                  type="datetime-local"
                  className="input input-bordered w-full"
                  value={newEvent.registrationClosesAt}
                  onChange={(e) => setNewEvent({ ...newEvent, registrationClosesAt: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? <span className="loading loading-spinner"></span> : 'Create Event'}
            </button>
          </form>
        </div>
      </div>

      {/* Add Event Type Form */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title text-secondary">Add New Event Type</h3>
          <form onSubmit={handleAddEventType} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={newEventType.name}
                  onChange={(e) => setNewEventType({ ...newEventType, name: e.target.value })}
                  placeholder="Enter event type name"
                  required
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Auto Create Interval (days)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={newEventType.autoEventCreateInterval}
                  onChange={(e) => setNewEventType({ ...newEventType, autoEventCreateInterval: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Description</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                value={newEventType.description}
                onChange={(e) => setNewEventType({ ...newEventType, description: e.target.value })}
                placeholder="Enter event type description"
                required
              />
            </div>
            
            <div className="form-control">
              <label className="cursor-pointer label">
                <span className="label-text font-semibold">Auto Create Events</span>
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={newEventType.autoEventCreate}
                  onChange={(e) => setNewEventType({ ...newEventType, autoEventCreate: e.target.checked })}
                />
              </label>
            </div>
            
            <button type="submit" disabled={loading} className="btn btn-secondary w-full">
              {loading ? <span className="loading loading-spinner"></span> : 'Create Event Type'}
            </button>
          </form>
        </div>
      </div>

      {/* Events List with Filters */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title mb-4">Events</h3>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="form-control">
              <input
                type="text"
                className="input input-bordered input-sm"
                placeholder="Filter by title"
                value={eventFilter.title}
                onChange={(e) => setEventFilter({ ...eventFilter, title: e.target.value, page: 1 })}
              />
            </div>
            
            <div className="form-control">
              <select
                className="select select-bordered select-sm"
                value={eventFilter.typeId}
                onChange={(e) => setEventFilter({ ...eventFilter, typeId: e.target.value, page: 1 })}
              >
                <option value="">All Types</option>
                {eventTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-control">
              <select
                className="select select-bordered select-sm"
                value={eventFilter.mode}
                onChange={(e) => setEventFilter({ ...eventFilter, mode: e.target.value as any, page: 1 })}
              >
                <option value="ALL">All Events</option>
                <option value="ONGOING">Ongoing</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="RECENT">Recent</option>
              </select>
            </div>
            
            <div className="form-control">
              <select
                className="select select-bordered select-sm"
                value={eventFilter.limit}
                onChange={(e) => setEventFilter({ ...eventFilter, limit: parseInt(e.target.value), page: 1 })}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </div>
          
          {/* Pagination Info */}
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-base-content/60">
              Page {pagination.currentPage} of {pagination.totalPage} (Total: {pagination.totalItem} events)
            </span>
            <div className="flex gap-2">
              <select
                className="select select-bordered select-sm"
                value={eventFilter.sortBy}
                onChange={(e) => setEventFilter({ ...eventFilter, sortBy: e.target.value })}
              >
                <option value="id">Sort by ID</option>
                <option value="startAt">Sort by Start Time</option>
              </select>
              <select
                className="select select-bordered select-sm"
                value={eventFilter.sortOrder}
                onChange={(e) => setEventFilter({ ...eventFilter, sortOrder: e.target.value as any })}
              >
                <option value="DESC">Descending</option>
                <option value="ASC">Ascending</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Title (Click for Details)</th>
                  <th>Type</th>
                  <th>Starts At</th>
                  <th>Registration Opens</th>
                  <th>Registration Closes</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id} className="hover:bg-base-200 cursor-pointer" onClick={() => handleEventClick(event.id)}>
                    <td className="text-primary font-semibold underline">{event.title}</td>
                    <td>
                      <div className="badge badge-outline">{event.eventType}</div>
                    </td>
                    <td>{new Date(event.startAt).toLocaleString()}</td>
                    <td>{new Date(event.registrationOpensAt).toLocaleString()}</td>
                    <td>{new Date(event.registrationClosesAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center items-center gap-2 mt-6">
            <button 
              onClick={() => setEventFilter({ ...eventFilter, page: Math.max(1, eventFilter.page - 1) })}
              disabled={eventFilter.page <= 1}
              className="btn btn-outline btn-sm"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm">
              Page {eventFilter.page} of {pagination.totalPage}
            </span>
            <button 
              onClick={() => setEventFilter({ ...eventFilter, page: Math.min(pagination.totalPage, eventFilter.page + 1) })}
              disabled={eventFilter.page >= pagination.totalPage}
              className="btn btn-outline btn-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Event Details</h3>
              <button 
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setShowEventModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-primary">{selectedEvent.title}</h4>
                <p className="text-sm text-base-content/60">{selectedEvent.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold">Type:</span>
                  <div className="badge badge-outline ml-2">{selectedEvent.eventType}</div>
                </div>
                <div>
                  <span className="font-semibold">Status:</span>
                  <div className="badge badge-primary ml-2">{selectedEvent.status}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div><span className="font-semibold">Starts:</span> {new Date(selectedEvent.startAt).toLocaleString()}</div>
                <div><span className="font-semibold">Registration Opens:</span> {new Date(selectedEvent.registrationOpensAt).toLocaleString()}</div>
                <div><span className="font-semibold">Registration Closes:</span> {new Date(selectedEvent.registrationClosesAt).toLocaleString()}</div>
              </div>
              
              {selectedEvent.participants && (
                <div>
                  <span className="font-semibold">Participants:</span>
                  <div className="mt-2 max-h-40 overflow-y-auto">
                    {selectedEvent.participants.map((participant: any, index: number) => (
                      <div key={index} className="flex justify-between items-center py-1 border-b border-base-300 last:border-b-0">
                        <span>{participant.email}</span>
                        <div className="flex gap-2">
                          <div className="badge badge-sm">{participant.status}</div>
                          <div className="badge badge-sm badge-outline">Guests: {participant.guestCount}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-action">
              <button className="btn" onClick={() => setShowEventModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventManagement;
