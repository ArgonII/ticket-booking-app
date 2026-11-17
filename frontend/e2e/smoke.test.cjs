
const { Builder, By, until } = require('selenium-webdriver');
const assert = require('node:assert/strict');
const chrome = require('selenium-webdriver/chrome');
const FRONTEND_URL =
    process.env.FRONTEND_URL || 'http://localhost:8081';

async function runTest() {
    const chromeOptions = new chrome.Options();

    if (process.env.CI === 'true') {
        chromeOptions.addArguments(
            '--headless=new',
            '--no-sandbox',
            '--disable-dev-shm-usage'
        );
    }

    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build();
        
    try {
        // 1. Відкриття застосунку
        await driver.get(FRONTEND_URL);

        await driver.wait(
            until.elementLocated(By.css('.event-card')),
            10000
        );

        // 2. Пошук події
        const search = await driver.findElement(
            By.css('.search-input')
        );

        await search.sendKeys('Interstellar');

        const card = await driver.findElement(
            By.css('.event-card')
        );

        assert.equal(
            await card.findElement(By.css('h2')).getText(),
            'Interstellar'
        );

        console.log('PASS: Event search');

        // 3. Перегляд деталей події
        await card.findElement(
            By.css('.details-button')
        ).click();

        const modal = await driver.wait(
            until.elementLocated(By.css('[role="dialog"]')),
            10000
        );

        assert.match(
            await modal.getAttribute('aria-label'),
            /Interstellar/
        );

        console.log('PASS: Event details');

        // 4. Перевірка кількості місць
        await driver.wait(
            until.elementsLocated(By.css('.seats-grid .seat')),
            10000
        );

        const seats = await modal.findElements(
            By.css('.seats-grid .seat')
        );

        assert.equal(seats.length, 20);

        console.log('PASS: 20 seats displayed');

        // 5. Пошук вільного місця
        let freeSeat = null;

        for (const seat of seats) {
            if (await seat.isEnabled()) {
                freeSeat = seat;
                break;
            }
        }

        assert.ok(freeSeat, 'No available seats found');

        const seatNumber = await freeSeat.getText();

        // 6. Вибір вільного місця
        await freeSeat.click();

        const selectedSeat = await modal.findElement(
            By.css('.seat.selected')
        );

        assert.equal(
            await selectedSeat.getText(),
            seatNumber
        );

        console.log('PASS: Free seat selected');

        // 7. Перевірка кнопки бронювання
        const bookButton = await modal.findElement(
            By.xpath(".//button[normalize-space()='Book Seat']")
        );

        assert.equal(await bookButton.isEnabled(), true);

        console.log('PASS: Booking button enabled');

        // 8. Створення бронювання
        await bookButton.click();

        const statusMessage = await driver.wait(
            until.elementLocated(By.css('[role="status"]')),
            10000
        );

        await driver.wait(async () => {
            const text = await statusMessage.getText();

            return text.includes(
                `Seat ${seatNumber} booked successfully!`
            );
        }, 10000);

        console.log('PASS: Booking successful');

        // 9. Перевірка недоступності заброньованого місця
        const bookedSeat = await modal.findElement(
            By.xpath(
                `.//div[contains(@class, 'seats-grid')]` +
                `//button[normalize-space()='${seatNumber}']`
            )
        );

        assert.equal(await bookedSeat.isEnabled(), false);

        console.log('PASS: Booked seat is disabled');

        console.log('All Selenium tests passed!');

    } finally {
        await driver.quit();
    }
}

runTest().catch(error => {
    console.error('Selenium test failed:', error);
    process.exitCode = 1;
});
