const crypto = require("crypto");

const AUTH_SECRET = process.env.AUTH_SECRET || "hospital-management-auth-secret";

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload) {
  const serializedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(serializedPayload).digest("base64url");
  return `${serializedPayload}.${signature}`;
}

function verifyToken(token) {
  const [serializedPayload, signature] = token.split(".");
  if (!serializedPayload || !signature) return null;

  const expectedSignature = crypto.createHmac("sha256", AUTH_SECRET).update(serializedPayload).digest("base64url");
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    return JSON.parse(base64UrlDecode(serializedPayload));
  } catch (error) {
    return null;
  }
}

function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : req.headers["x-auth-token"];

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Invalid or expired session" });
  }

  req.user = payload;
  next();
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to access this resource" });
    }

    next();
  };
}

function createAuthToken(user) {
  return signPayload({
    id: String(user._id),
    username: user.username,
    role: user.role,
  });
}

module.exports = {
  authenticate,
  requireRole,
  createAuthToken,
};