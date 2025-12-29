I'll help you test the mobile app features (maintenance mode, force update message, and device revocation). Let me create a plan for testing these features.

## Testing Mobile App Features

Let me guide you through testing each feature. First, let's check if you have the mobile app running locally or if we need to build and deploy it.

Perfect! Let's test the three mobile app features. First, I need to check if the mobile app has been rebuilt with the new changes (MaintenanceScreen and updated ForceUpdateScreen).

Good! The mobile app code includes the new changes. Now let's test each feature:

## Test 1: Maintenance Mode

First, let's enable maintenance mode through the web dashboard and then run the mobile app to see the MaintenanceScreen.

**Step 1:** Go to your deployed web dashboard at `/settings/mobile` and:
1. Toggle **Maintenance Mode** to **Enabled**
2. Set a custom message like: "System maintenance in progress. We'll be back shortly!"
3. Click **Save**

**Step 2:** Start the mobile app to test:

The mobile app is starting. Let me check the status and provide you with instructions for testing:

Perfect! The Expo development server is running. Now let's test the three features:

## 🧪 Test 1: Maintenance Mode

**Instructions:**

1. **On the web dashboard** (`/settings/mobile`):
   - Toggle **Maintenance Mode** to **Enabled**
   - Set message: "System maintenance in progress. We'll be back shortly!"
   - Click **Save**

2. **On your mobile device**:
   - Scan the QR code with Expo Go app
   - The app should show the **MaintenanceScreen** with your custom message
   - You should NOT be able to access the normal app screens

**Expected Result:** The app displays the maintenance screen instead of the login/home screen.

---

## 🧪 Test 2: Force Update Message

**Instructions:**

1. **Check current mobile app version:**

Current mobile app version is **1.0.0**. Here are the complete testing instructions:

## 🧪 Test 2: Force Update Message

**Instructions:**

1. **First, disable maintenance mode** on `/settings/mobile` (so we can test force update)

2. **On the web dashboard** (`/settings/mobile`):
   - Set **Minimum Version iOS** to `1.0.1` (higher than current 1.0.0)
   - Set **Minimum Version Android** to `1.0.1`
   - Set **Force Update Message** to: "A critical update is available! Please update to continue using the app."
   - Click **Save**

3. **On your mobile device**:
   - Reload the app (shake device → Reload, or press `r` in the terminal)
   - The app should show the **ForceUpdateScreen** with your custom message
   - It should display the installed version (1.0.0) and required version (1.0.1)
   - The "Update Now" button should link to the store URL you configured

**Expected Result:** The app displays the force update screen with your custom message instead of allowing normal app access.

---

## 🧪 Test 3: Device Revocation

**Instructions:**

1. **First, clear the force update requirement**:
   - Go to `/settings/mobile`
   - Set both minimum versions back to `1.0.0`
   - Click **Save**

2. **Register a device**:
   - Open the mobile app and login
   - The app will register your device automatically

3. **Find the device in the inventory**:
   - Go to `/settings/devices` on the web dashboard
   - You should see your device listed with:
     - Your user email
     - Device ID
     - Platform (iOS/Android)
     - App version (1.0.0)
     - Status: **Active** (green badge)

4. **Revoke the device**:
   - Click the **Revoke** button next to your device
   - Confirm the action
   - The device status should change to **Revoked** (red badge)

5. **Test revocation enforcement**:
   - On your mobile device, close and reopen the app
   - Try to login again
   - The app should be blocked from registering (you'll see an error or be unable to proceed)

6. **Unrevoke the device**:
   - Go back to `/settings/devices`
   - Click **Unrevoke** next to your device
   - The device status should change back to **Active**
   - You should now be able to use the app normally again

**Expected Result:** Revoked devices cannot register or access the app. Unrevoked devices can register and access normally.

---

## Summary

You can test all three features by:
1. Scanning the QR code shown in your terminal with Expo Go
2. Making changes on the web dashboard at `/settings/mobile` and `/settings/devices`
3. Observing the behavior in the mobile app

Would you like me to help you troubleshoot any issues you encounter during testing, or shall I proceed with documenting the test results?