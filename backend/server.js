const express = require('express');

const app = express();
app.use(express.json());
const PORT = 3000;

const events = [
    {
        id: 1,
        title: 'Interstellar',
        type: 'movie',
        date: '2026-11-01',
        time: '18:30',
        venue: 'Cinema City',
        price: 250,
        image: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        description: 'A science fiction adventure through space and time.'
    },
    {
        id: 2,
        title: 'Rock Concert',
        type: 'concert',
        date: '2026-11-05',
        time: '20:00',
        venue: 'Stereo Plaza',
        price: 800,
        image: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Interior_del_estadio_Ruca_Che.JPG?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled',
        description: 'An unforgettable evening of live rock music.'
    },
    {
        id: 3,
        title: 'Avatar',
        type: 'movie',
        date: '2026-11-10',
        time: '19:00',
        venue: 'Multiplex',
        price: 300,
        image: 'https://m.media-amazon.com/images/S/pv-target-images/ae4816cade1a5b7f29787d0b89610132c72c7747041481c6619b9cc3302c0101.jpg',
        description: 'A journey to the extraordinary world of Pandora.'
    }
];
app.get('/', (req, res) => {
    res.send('Ticket Booking API is running!');
});

const bookedSeats = {
    1: [3, 7, 12],
    2: [5, 10],
    3: []
};

app.get('/api/events', (req, res) => {
    res.json(events);
});

app.get('/api/events/:id/seats', (req, res) => {
    const eventId = Number(req.params.id);

    const event = events.find(e => e.id === eventId);

    if (!event) {
        return res.status(404).json({
            error: 'Event not found'
        });
    }

    const seats = Array.from({ length: 20 }, (_, index) => {
        const number = index + 1;

        return {
            number,
            isBooked: bookedSeats[eventId].includes(number)
        };
    });

    res.json(seats);
});

app.post('/api/bookings', (req, res) => {
  const { eventId, seatNumber } = req.body ?? {};

  if (!Number.isInteger(eventId) ||
      !Number.isInteger(seatNumber)) {
    return res.status(400).json({
      error: 'Invalid booking data'
    });
  }

  const event = events.find(e => e.id === eventId);

  if (!event) {
    return res.status(404).json({
      error: 'Event not found'
    });
  }

  if (seatNumber < 1 || seatNumber > 20) {
    return res.status(400).json({
      error: 'Invalid seat number'
    });
  }

  if (bookedSeats[eventId].includes(seatNumber)) {
    return res.status(409).json({
      error: 'Seat is already booked'
    });
  }

  bookedSeats[eventId].push(seatNumber);

  return res.status(201).json({
    message: 'Booking successful',
    eventId,
    seatNumber
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;