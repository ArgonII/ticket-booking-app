
const request = require('supertest');
const app = require('../server');

describe('Bookings API', () => {

    test('GET seats should return 20 seats', async () => {
        const response = await request(app)
            .get('/api/events/1/seats');

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveLength(20);
    });

    test('POST should book an available seat', async () => {
        const response = await request(app)
            .post('/api/bookings')
            .send({
                eventId: 1,
                seatNumber: 15
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe('Booking successful');
        expect(response.body.seatNumber).toBe(15);
    });

    test('POST should reject an already booked seat', async () => {
        const response = await request(app)
            .post('/api/bookings')
            .send({
                eventId: 1,
                seatNumber: 3
            });

        expect(response.statusCode).toBe(409);
        expect(response.body.error).toBe('Seat is already booked');
    });

    test('POST should reject an invalid seat number', async () => {
        const response = await request(app)
            .post('/api/bookings')
            .send({
                eventId: 1,
                seatNumber: 21
            });

        expect(response.statusCode).toBe(400);
    });

    test('POST should reject a nonexistent event', async () => {
        const response = await request(app)
            .post('/api/bookings')
            .send({
                eventId: 999,
                seatNumber: 5
            });

        expect(response.statusCode).toBe(404);
    });
    test('Booked seat should become unavailable', async () => {
        const bookingResponse = await request(app)
            .post('/api/bookings')
            .send({
                eventId: 2,
                seatNumber: 16
            });

        expect(bookingResponse.statusCode).toBe(201);

        const response = await request(app)
            .get('/api/events/2/seats');

        const seat = response.body.find(s => s.number === 16);

        expect(seat.isBooked).toBe(true);
    });
});
