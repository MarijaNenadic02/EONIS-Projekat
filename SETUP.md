# Setup guide (Windows)

This runs the whole SCENTIQ shop (backend + frontend) on a Windows PC.

## 1. Install Node.js (one time)

Download and install **Node.js LTS** from <https://nodejs.org/> (just click
through the installer with the defaults). This also installs `npm`, which the
project needs.

## 2. Get the project

Either:

- **Clone** the repository with Git, or
- Download it as a **ZIP** and extract it somewhere simple, e.g.
  `C:\Users\YourName\Desktop\EONIS-Projekat`.

> If you received a ZIP, it should **not** contain the `node_modules` folders.
> The setup script downloads those for you.

## 3. Run it

Double-click **`START-WINDOWS.bat`** in the project folder.

It will automatically:

1. Check that Node.js is installed
2. Install the backend dependencies
3. Create the database and load demo data (products + accounts)
4. Install the frontend dependencies
5. Start the backend and the frontend, and open the shop in your browser

The first run takes a few minutes (it downloads dependencies). Two terminal
windows will open: **keep them open** while you test. Close them to stop the
app.

The shop opens at **<http://localhost:5173>**.

## 4. Log in

| Role     | Email                   | Password    |
|----------|-------------------------|-------------|
| Admin    | admin@scentiq.test      | admin123    |
| Customer | customer@scentiq.test   | customer123 |

The admin account has the admin panel (products, brands, categories, users,
orders, transactions). The customer account is for browsing, the cart and
checkout.

## Card payments with Stripe (optional)

The whole app works without payment setup; only the final "Checkout with
Stripe" button needs it. If you want to test paying by card too, there is a
second one-click launcher that handles everything:

1. Ask the project owner for the **Stripe TEST secret key** (it starts with
   `sk_test_`). It is a test key: no real money is involved. You do **not**
   need your own Stripe account.
2. Double-click **`START-WINDOWS-STRIPE.bat`**.
   - The first time, it asks you to paste that test key (saved locally).
   - It downloads the Stripe CLI automatically if you don't have it.
   - It opens the secure webhook tunnel, then starts the app.
3. In the shop, add a perfume, go to the cart and click **Checkout with
   Stripe**. Pay with the test card:
   - Card `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP.
4. After paying you return to the shop, and the payment shows up under
   **Admin → Transactions** (the order is marked paid and stock goes down).

Keep that window open while testing; press `Ctrl+C` in it to stop everything.
No public website or domain is required: the Stripe CLI tunnels webhooks
straight to your PC.

## If something goes wrong

- **"Node.js is not installed"**: install it from <https://nodejs.org/> and
  run the file again.
- **A step failed**: make sure you have an internet connection (it downloads
  packages), then run `START-WINDOWS.bat` again.
- **Port already in use**: close any other terminal windows running the app,
  or restart the PC, then try again.
- **Want a clean database again**: open the `server` folder in a terminal and
  run `npm run seed`.

## Manual steps (if you prefer not to use the script)

```bat
cd server
npm install
copy .env.example .env
npx prisma migrate deploy
npm run seed
npm run dev

REM in a second terminal:
cd client
npm install
copy .env.example .env
npm run dev
```

Then open <http://localhost:5173>.
