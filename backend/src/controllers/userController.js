const prisma = require('../prisma');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { isVelocityAnomalous, verifyDeviceSensors } = require('../services/fraudService');
const { getRequiredEnv } = require('../config/env');
const { normalizeZoneName, isSupportedZone } = require('../config/zones');

const allowedPlatforms = ['ZOMATO', 'SWIGGY'];

// Password: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit, 1 special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}\[\]|:;"'<>,.?/~`])[A-Za-z\d!@#$%^&*()_\-+={}\[\]|:;"'<>,.?/~`]{8,}$/;

// UPI ID: alphanumeric/dots before @, then provider name
const UPI_REGEX = /^[a-zA-Z0-9.\-_]{3,}@[a-zA-Z]{2,}$/;

async function registerUser(req, res) {
  try {
    const {
      fullName,
      phone,
      platform,
      city,
      zone,
      avgDailyEarnings,
      upiId,
      password,
      role
    } = req.body;

const normalizedRole = String(role).toUpperCase();

if (!["WORKER", "ADMIN"].includes(normalizedRole)) {
  return res.status(400).json({ message: "Invalid role." });
}


if (!fullName || !phone || !password) {
  return res.status(400).json({ message: 'Basic fields required.' });
}

if (!PASSWORD_REGEX.test(password)) {
  return res.status(400).json({
    message: 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 digit, and 1 special character.'
  });
}

if (normalizedRole === "WORKER") {
  if (!platform || !city || !zone || !avgDailyEarnings || !upiId) {
    return res.status(400).json({ message: 'Worker fields required.' });
  }
  if (!UPI_REGEX.test(upiId)) {
    return res.status(400).json({
      message: 'Invalid UPI ID. Must be in format: username@provider (e.g. john@oksbi)'
    });
  }

  if (!isSupportedZone(zone)) {
    return res.status(400).json({ message: 'Unsupported zone. Use a supported Bengaluru zone such as Koramangala or HSR Layout.' });
  }
}

let normalizedPlatform;
let parsedEarnings;

if (normalizedRole === "WORKER") {
  normalizedPlatform = String(platform).toUpperCase();

  if (!allowedPlatforms.includes(normalizedPlatform)) {
    return res.status(400).json({ message: 'Invalid platform.' });
  }

  parsedEarnings = Number(avgDailyEarnings);

  if (Number.isNaN(parsedEarnings) || parsedEarnings <= 0) {
    return res.status(400).json({ message: 'Invalid earnings.' });
  }
}

    const normalizedPhone = String(phone).trim();

    const existingUser = await prisma.user.findUnique({
      where: { phone: normalizedPhone }
    });

    if (existingUser) {
      return res.status(409).json({ message: 'Phone number is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);


    const user = await prisma.user.create({
      data: {
        fullName: String(fullName).trim(),
        phone: normalizedPhone,
        password: hashedPassword,
        role: normalizedRole,

        ...(normalizedRole === "WORKER" && {
          platform: normalizedPlatform,
          city: String(city).trim(),
          zone: normalizeZoneName(zone),
          avgDailyEarnings: parsedEarnings,
          upiId: String(upiId).trim()
        })
      }
    });

    return res.status(201).json({
    id: user.id,
    fullName: user.fullName,
    phone: user.phone
  });
  } catch (error) {
    console.error('registerUser error', error);
    return res.status(400).json({
      message: 'Failed to register user',
      error: error.message
    });
  }
}

async function getUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      include: {
        policies: true,
        claims: {
          include: { payout: true, triggerEvent: true },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(users);
  } catch (error) {
    console.error('getUsers error', error);
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
}

async function loginUser(req, res) {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password required' });
    }

    const user = await prisma.user.findUnique({
      where: { phone: String(phone).trim() }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      getRequiredEnv('JWT_SECRET'),
      { expiresIn: "7d" }
    );

    const { password: userPassword, ...userWithoutPassword } = user;

    return res.json({
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('loginUser error', error);
    return res.status(500).json({ message: 'Login failed' });
  }
}
async function deleteUser(req, res) {
  try {
    const userId = req.user.userId;

    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user" });
  }
}

async function verifyLocation(req, res) {
  try {
    const { locationHistory, sensorData } = req.body;
    
    const velocityReport = isVelocityAnomalous(locationHistory);
    if (velocityReport.flagged) {
      return res.status(403).json({ message: 'Fraud Detected: Anomalous velocity (GPS Spoofing).', isFraud: true });
    }

    const sensorReport = verifyDeviceSensors(sensorData);
    if (sensorReport.flagged) {
       return res.status(403).json({ message: 'Fraud Detected: Sensor mismatch (Emulator).', isFraud: true });
    }

    return res.json({ message: 'Location verified successfully.', isFraud: false });
  } catch (error) {
    return res.status(500).json({ message: 'Location verification failed.' });
  }
}

module.exports = {
  registerUser,
  getUsers,
  loginUser, 
  deleteUser,
  verifyLocation
};
