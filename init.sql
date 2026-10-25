CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL,
    seat_number INTEGER NOT NULL CHECK (seat_number BETWEEN 1 AND 20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_booking UNIQUE (event_id, seat_number)
);

INSERT INTO bookings (event_id, seat_number)
VALUES
    (1, 3),
    (1, 7),
    (1, 12),
    (2, 5),
    (2, 10)
ON CONFLICT (event_id, seat_number) DO NOTHING;