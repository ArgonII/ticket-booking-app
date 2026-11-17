import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [seatsError, setSeatsError] = useState('');

  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/events', { signal: controller.signal })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load events');
        }
        return response.json();
      })
      .then(data => setEvents(data))
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedEvent) return;

    const controller = new AbortController();

    fetch(`/api/events/${selectedEvent.id}/seats`, {
      signal: controller.signal,
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load seats');
        }
        return response.json();
      })
      .then(data => setSeats(data))
      .catch(err => {
        if (err.name !== 'AbortError') {
          setSeatsError(err.message);
          setSeats([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setSeatsLoading(false);
        }
      });

    return () => controller.abort();
  }, [selectedEvent]);

  const filteredEvents = events.filter(event => {
    const matchesCategory =
      filter === 'all' || event.type === filter;

    const matchesSearch =
      event.title.toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  function openEvent(event) {
    setSelectedEvent(event);
    setSelectedSeat(null);
    setSeats([]);
    setSeatsLoading(true);
    setSeatsError('');
    setBookingMessage('');
  }

  function closeEvent() {
    if (bookingLoading) return;

    setSelectedEvent(null);
    setSelectedSeat(null);
    setSeats([]);
    setBookingMessage('');
    setSeatsError('');
  }

  async function handleBooking() {
    if (
      !selectedEvent ||
      selectedSeat === null ||
      bookingLoading ||
      seatsLoading ||
      seatsError
    ) {
      return;
    }

    const seatToBook = selectedSeat;
    const eventId = selectedEvent.id;

    setBookingLoading(true);
    setBookingMessage('');

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          seatNumber: seatToBook,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Booking failed');
      }

      setBookingMessage(
        `Seat ${seatToBook} booked successfully!`
      );

      setSeats(previousSeats =>
        previousSeats.map(seat =>
          seat.number === seatToBook
            ? { ...seat, isBooked: true }
            : seat
        )
      );

      setSelectedSeat(null);
    } catch (err) {
      setBookingMessage(err.message);

      try {
        const response = await fetch(
          `/api/events/${eventId}/seats`
        );

        if (response.ok) {
          const updatedSeats = await response.json();
          setSeats(updatedSeats);
        }
      } catch (refreshError) {
        console.error(
          'Failed to refresh seats:',
          refreshError
        );
      }

      setSelectedSeat(null);
    } finally {
      setBookingLoading(false);
    }
  }

  return (
    <main className="container">
      {/* Заголовок */}
      <header>
        <h1>Ticket Booking</h1>
        <p>Find movies and concerts near you</p>
      </header>

      {/* Пошук */}
      <input
        className="search-input"
        type="text"
        placeholder="Search movies and concerts..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Фільтри */}
      <nav className="filters" aria-label="Event categories">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All Events
        </button>

        <button
          className={filter === 'movie' ? 'active' : ''}
          onClick={() => setFilter('movie')}
        >
          Movies
        </button>

        <button
          className={filter === 'concert' ? 'active' : ''}
          onClick={() => setFilter('concert')}
        >
          Concerts
        </button>
      </nav>

      {/* Стан завантаження */}
      {loading && <p>Loading events...</p>}

      {error && <p role="alert">Error: {error}</p>}

      {/* Картки подій */}
      {!loading && !error && (
        <section className="events">
          {filteredEvents.map(event => (
            <article
              className="event-card"
              key={event.id}
            >
              {event.image && (
                <img
                  className="event-poster"
                  src={event.image}
                  alt={event.title}
                />
              )}

              <div className="event-content">
                <span className="event-type">
                  {event.type}
                </span>

                <h2>{event.title}</h2>

                <p>
                  {event.date} · {event.time}
                </p>

                <p>{event.venue}</p>

                <p className="price">
                  {event.price} UAH
                </p>

                <button
                  className="details-button"
                  onClick={() => openEvent(event)}
                >
                  View Details
                </button>
              </div>
            </article>
          ))}

          {filteredEvents.length === 0 && (
            <p>No events found.</p>
          )}
        </section>
      )}

      {/* Модальне вікно */}
      {selectedEvent && (
        <div
          className="modal-overlay"
          onClick={closeEvent}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Details for ${selectedEvent.title}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Закриття */}
            <button
              className="close-button"
              onClick={closeEvent}
              disabled={bookingLoading}
              aria-label="Close details"
            >
              ×
            </button>

            {/* Деталі події */}
            <h2>{selectedEvent.title}</h2>

            <p>{selectedEvent.description}</p>

            <p>
              <strong>Type:</strong>{' '}
              {selectedEvent.type}
            </p>

            <p>
              <strong>Date:</strong>{' '}
              {selectedEvent.date}
            </p>

            <p>
              <strong>Time:</strong>{' '}
              {selectedEvent.time}
            </p>

            <p>
              <strong>Venue:</strong>{' '}
              {selectedEvent.venue}
            </p>

            <p>
              <strong>Price:</strong>{' '}
              {selectedEvent.price} UAH
            </p>

            {/* Вибір місця */}
            <div className="seat-selection">
              <h3>Select a Seat</h3>

              <div className="screen">
                SCREEN / STAGE
              </div>

              {seatsLoading && (
                <p>Loading seats...</p>
              )}

              {seatsError && (
                <p role="alert">
                  Error: {seatsError}
                </p>
              )}

              {!seatsLoading && !seatsError && (
                <>
                  <div className="seats-grid">
                    {seats.map(seat => (
                      <button
                        key={seat.number}
                        type="button"
                        disabled={
                          seat.isBooked || bookingLoading
                        }
                        className={`seat ${
                          seat.isBooked
                            ? 'booked'
                            : selectedSeat === seat.number
                              ? 'selected'
                              : ''
                        }`}
                        onClick={() => {
                          setSelectedSeat(seat.number);
                          setBookingMessage('');
                        }}
                        title={
                          seat.isBooked
                            ? 'Already booked'
                            : `Seat ${seat.number}`
                        }
                      >
                        {seat.number}
                      </button>
                    ))}
                  </div>

                  <p>
                    Selected seat:{' '}
                    <strong>
                      {selectedSeat ?? 'None'}
                    </strong>
                  </p>

                  {/* Бронювання */}
                  <button
                    className="details-button"
                    disabled={
                      selectedSeat === null ||
                      bookingLoading
                    }
                    onClick={handleBooking}
                  >
                    {bookingLoading
                      ? 'Booking...'
                      : 'Book Seat'}
                  </button>
                </>
              )}

              {/* Результат бронювання */}
              {bookingMessage && (
                <p
                  role="status"
                  className="booking-message"
                >
                  {bookingMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
