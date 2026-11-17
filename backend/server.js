const express = require('express');
const pool = require('./db');

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

app.get('/api/events', (req, res) => {
    res.json(events);
});

app.get('/api/events/:id/seats', async (req, res) => {
    const eventId = Number(req.params.id);

    const event = events.find(e => e.id === eventId);

    if (!event) {
        return res.status(404).json({
            error: 'Event not found'
        });
    }

    try {
        const result = await pool.query(
            'SELECT seat_number FROM bookings WHERE event_id = $1',
            [eventId]
        );

        const bookedNumbers = new Set(
            result.rows.map(row => row.seat_number)
        );

        const seats = Array.from({ length: 20 }, (_, index) => {
            const number = index + 1;

            return {
                number,
                isBooked: bookedNumbers.has(number)
            };
        });

        res.json(seats);
    } catch (error) {
        console.error('Database error:', error);

        res.status(500).json({
            error: 'Database error'
        });
    }
});

app.post('/api/bookings', async (req, res) => {
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

    try {
        await pool.query(
            'INSERT INTO bookings (event_id, seat_number) VALUES ($1, $2)',
            [eventId, seatNumber]
        );

        return res.status(201).json({
            message: 'Booking successful',
            eventId,
            seatNumber
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                error: 'Seat is already booked'
            });
        }

        console.error('Database error:', error);

        return res.status(500).json({
            error: 'Database error'
        });
    }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;