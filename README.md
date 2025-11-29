# 🏨 Hotel Mess Manager

A mobile-first application designed to simplify meal subscription management for hotels, hostels, and mess facilities. Track clients, manage subscriptions, monitor payments, and stay on top of your business—all in one place.

---

## ✨ Features

- **Client Management** – Add, edit, and manage client profiles with contact information
- **Meal Subscriptions** – Create flexible subscription plans (10/20/30 days or custom)
- **Payment Tracking** – Monitor paid, pending, and overdue payments at a glance
- **Live Dashboard** – Real-time metrics including active subscriptions, revenue, and payment status
- **Smart Search** – Quickly find clients or subscriptions by name or phone
- **Status Filtering** – Filter subscriptions by active, expired, or pending status
- **Offline-First** – All data stored locally on your device—no internet required

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI installed globally (`npm install -g expo-cli`)
- Android/iOS device or emulator

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/saranzafar/hotel-book.git
   cd hotel-book
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Install required packages**

   ```bash
   npx expo install expo-sqlite @react-native-community/datetimepicker
   ```

4. **Start the development server**

   ```bash
   npx expo start
   ```

5. **Open on your device**
   - Scan the QR code with Expo Go app (iOS/Android)
   - Or press `a` for Android emulator or `i` for iOS simulator

---

## 📱 App Structure

```
hotel-mess-manager/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.js          # Tab navigation
│   │   ├── index.js            # Home dashboard
│   │   ├── clients.js          # Client management
│   │   ├── mess.js             # Subscription management
│   │   └── about.js            # About screen
│   ├── components/
│   │   ├── AddClientDrawer.js
│   │   ├── EditClientDrawer.js
│   │   ├── AddSubscriptionDrawer.js
│   │   └── EditSubscriptionDrawer.js
│   │   └── components/dashboard # Here all dashboard components
│   ├── _layout.js              # App initialization
│   └── database/
├── src/
│   └── database/
│       ├── db.js               # SQLite setup
│       └── queries.js          # Database operations
└── package.json
```

---

## 🎯 How to Use

### Managing Clients

1. **Add a Client**
   - Go to the **Clients** tab
   - Tap the **+** button
   - Fill in name (required) and phone number (required)
   - Optional: Add email, address, and notes
   - Tap "Add Client"

2. **Edit a Client**
   - Tap any client card
   - Update information as needed
   - Tap "Save" to confirm

3. **Delete a Client**
   - Tap any client card
   - Tap the "Delete" button
   - Confirm the action

### Managing Subscriptions

1. **Add a Subscription**
   - Go to the **Mess** tab
   - Tap the **+** button
   - Select a client from the dropdown
   - Choose start and end dates (automatic day count calculation)
   - Enter total amount and amount paid
   - Tap "Add Subscription"

2. **Edit a Subscription**
   - Tap any subscription card
   - Modify dates, amounts, or active status
   - Tap "Save" to confirm

3. **Delete a Subscription**
   - Tap any subscription card
   - Tap the "Delete" button
   - Confirm the action

### Viewing the Dashboard

- **Home** tab shows key metrics:
  - Active subscriptions count
  - Total revenue collected
  - Pending payments and overdue amounts
  - Subscriptions expiring in the next 7 days

---

## 🛠️ Technology Stack

| Tool | Purpose |
|------|---------|
| **React Native** | Cross-platform mobile framework |
| **Expo** | Development platform and deployment |
| **Expo Router** | File-based routing |
| **SQLite** | Local database (no server required) |
| **Ionicons** | Icon library |
| **React Navigation** | Screen navigation |

---

## 💾 Database Schema

### Tables

- **clients** – Store client information (name, phone, email, address)
- **mess_subscriptions** – Track meal subscriptions (dates, amounts, status)
- **payments** – Record payment history (optional for detailed tracking)

All data is encrypted and stored locally on your device.

---

## 🔒 Privacy & Security

- **100% Offline** – No internet connection needed after installation
- **Local Storage** – All data remains on your device
- **No Cloud Sync** – Your information stays private and secure
- **No Ads or Tracking** – Clean, distraction-free experience

---

## 🐛 Troubleshooting

### App won't start?

```bash
# Clear cache and reinstall
npm install
npx expo start -c
```

### Date picker not showing?

- Ensure `@react-native-community/datetimepicker` is installed
- Run `npx expo install @react-native-community/datetimepicker`

### Database errors?

- Clear Expo cache: `npx expo start --clear`
- Uninstall and reinstall the app on your device

---

## 📝 License

This project is open-source and available under the MIT License.

---

## 💬 Support

Found a bug or have a suggestion? Feel free to open an issue or reach out.

- **Developer:** Saran Zafar
- **Email:** <saran.development@example.com>  
- **Phone:** +91 XXXXX XXXXX

---

## 🙏 Acknowledgments

Built with ❤️ using React Native and Expo to make hotel and mess management simpler, faster, and more efficient.

---

**Last Updated:** Nov 2025  
**Version:** 1.0.0
